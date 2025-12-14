import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { WebLinksAddon } from 'xterm-addon-web-links';
import 'xterm/css/xterm.css';
import '../styles/Terminal.css';

const Terminal = ({ connectionParams, onDisconnect, onTerminalReady, isKeyboardExpanded }) => {
  const terminalRef = useRef(null);
  const xtermRef = useRef(null);
  const wsRef = useRef(null);
  const fitAddonRef = useRef(null);
  const [status, setStatus] = useState('Conectando...');
  const [reconnectAttempt, setReconnectAttempt] = useState(0);
  const pingIntervalRef = useRef(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const scrollCheckIntervalRef = useRef(null);
  const terminalContainerRef = useRef(null);

  // Función para verificar si el scroll está al final
  const checkScrollPosition = useCallback(() => {
    if (!xtermRef.current) return;

    const term = xtermRef.current;
    const buffer = term.buffer.active;
    const viewport = term.element?.querySelector('.xterm-viewport');

    if (viewport) {
      const scrollTop = viewport.scrollTop;
      const scrollHeight = viewport.scrollHeight;
      const clientHeight = viewport.clientHeight;

      // Considerar que está al final si está a menos de 50px del final
      const atBottom = scrollHeight - scrollTop - clientHeight < 50;
      setIsAtBottom(atBottom);
      setShowScrollButton(!atBottom);
    }
  }, []);

  // Función para hacer scroll al final
  const scrollToBottom = useCallback(() => {
    if (!xtermRef.current) return;

    const term = xtermRef.current;
    term.scrollToBottom();

    // Vibración táctil
    if ('vibrate' in navigator) {
      navigator.vibrate(20);
    }

    setIsAtBottom(true);
    setShowScrollButton(false);
  }, []);

  // Función para hacer scroll rápido con animación
  const smoothScrollToBottom = useCallback(() => {
    if (!xtermRef.current) return;

    const viewport = xtermRef.current.element?.querySelector('.xterm-viewport');
    if (viewport) {
      viewport.scrollTo({
        top: viewport.scrollHeight,
        behavior: 'smooth'
      });
    }

    // Vibración táctil
    if ('vibrate' in navigator) {
      navigator.vibrate(20);
    }

    setTimeout(() => {
      setIsAtBottom(true);
      setShowScrollButton(false);
    }, 300);
  }, []);

  useEffect(() => {
    // Inicializar terminal
    const term = new XTerm({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      theme: {
        background: '#1e1e1e',
        foreground: '#ffffff',
        cursor: '#00ff00',
        selection: 'rgba(255, 255, 255, 0.3)'
      },
      scrollback: 10000,
      bellStyle: 'sound'
    });

    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();

    term.loadAddon(fitAddon);
    term.loadAddon(webLinksAddon);

    term.open(terminalRef.current);
    fitAddon.fit();

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    // Monitorear scroll para mostrar/ocultar botón
    const viewport = term.element?.querySelector('.xterm-viewport');
    if (viewport) {
      viewport.addEventListener('scroll', checkScrollPosition);

      // Mejorar el scroll en móviles
      viewport.style.webkitOverflowScrolling = 'touch';
      viewport.style.overscrollBehavior = 'contain';
    }

    // Verificar posición del scroll cada 500ms
    scrollCheckIntervalRef.current = setInterval(checkScrollPosition, 500);

    // Conectar WebSocket
    connectWebSocket();

    // API para enviar teclas especiales y control del terminal
    const terminalAPI = {
      sendKey: (key) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: 'data',
            data: key
          }));
        }
      },
      scrollToBottom: () => scrollToBottom(),
      scrollToTop: () => {
        if (xtermRef.current) {
          xtermRef.current.scrollToTop();
          if ('vibrate' in navigator) {
            navigator.vibrate(20);
          }
        }
      },
      disconnect: () => {
        if (wsRef.current) {
          wsRef.current.close();
        }
      }
    };

    onTerminalReady(terminalAPI);

    // Redimensionar al cambiar tamaño de ventana
    const handleResize = () => {
      fitAddon.fit();
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'resize',
          cols: term.cols,
          rows: term.rows
        }));
      }
    };

    window.addEventListener('resize', handleResize);

    // Mantener conexión viva con pings
    pingIntervalRef.current = setInterval(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000); // Ping cada 30 segundos

    return () => {
      window.removeEventListener('resize', handleResize);
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }
      if (scrollCheckIntervalRef.current) {
        clearInterval(scrollCheckIntervalRef.current);
      }
      if (viewport) {
        viewport.removeEventListener('scroll', checkScrollPosition);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
      term.dispose();
    };
  }, [checkScrollPosition]);

  // Ajustar terminal cuando el teclado se expande/colapsa
  useEffect(() => {
    if (!xtermRef.current || !fitAddonRef.current) return;

    // Ajustar tamaño del terminal
    setTimeout(() => {
      fitAddonRef.current.fit();

      // Hacer scroll al final para mostrar el prompt
      if (xtermRef.current && isAtBottom) {
        xtermRef.current.scrollToBottom();
      }
    }, 100); // Pequeño delay para que el CSS se aplique

  }, [isKeyboardExpanded, isAtBottom]);

  const connectWebSocket = () => {
    const wsUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:3001';
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('WebSocket conectado');
      setStatus('Conectando SSH...');

      // Enviar parámetros de conexión
      ws.send(JSON.stringify({
        type: 'connect',
        params: connectionParams
      }));
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);

        switch (message.type) {
          case 'connected':
            setStatus('Conectado');
            setReconnectAttempt(0);
            xtermRef.current.write('\r\n✓ Conexión SSH establecida\r\n\r\n');
            break;

          case 'data':
            // Auto-scroll inteligente: solo si ya estabas al final
            const wasAtBottom = isAtBottom;
            xtermRef.current.write(message.data);

            // Si estabas al final, mantente al final
            if (wasAtBottom) {
              setTimeout(() => {
                if (xtermRef.current) {
                  xtermRef.current.scrollToBottom();
                }
              }, 10);
            }
            break;

          case 'error':
            setStatus('Error: ' + message.message);
            xtermRef.current.write(`\r\n\x1b[31m✗ ${message.message}\x1b[0m\r\n`);
            break;

          case 'reconnecting':
            setStatus(`Reconectando... (${message.attempt}/5)`);
            setReconnectAttempt(message.attempt);
            break;

          case 'pong':
            // Respuesta al ping
            break;

          default:
            console.log('Mensaje desconocido:', message);
        }
      } catch (err) {
        console.error('Error procesando mensaje:', err);
      }
    };

    ws.onerror = (error) => {
      console.error('Error WebSocket:', error);
      setStatus('Error de conexión');
    };

    ws.onclose = () => {
      console.log('WebSocket cerrado');
      setStatus('Desconectado');

      // Intentar reconectar después de 3 segundos
      setTimeout(() => {
        if (reconnectAttempt < 3) {
          console.log('Intentando reconectar...');
          setReconnectAttempt(prev => prev + 1);
          connectWebSocket();
        }
      }, 3000);
    };

    // Manejar entrada del usuario
    xtermRef.current.onData((data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'data',
          data: data
        }));

        // Hacer scroll al final cuando el usuario escribe
        // para asegurar que el prompt siempre sea visible
        setTimeout(() => {
          if (xtermRef.current) {
            xtermRef.current.scrollToBottom();
            setIsAtBottom(true);
            setShowScrollButton(false);
          }
        }, 50);
      }
    });

    wsRef.current = ws;
  };

  return (
    <div
      ref={terminalContainerRef}
      className={`terminal-container ${isKeyboardExpanded ? 'keyboard-expanded' : 'keyboard-collapsed'}`}
    >
      <div className="terminal-status">
        <span className={`status-indicator ${status.includes('Conectado') ? 'connected' : ''}`}>
          {status}
        </span>
      </div>
      <div ref={terminalRef} className="terminal" />

      {/* Botón flotante para scroll rápido al final */}
      {showScrollButton && (
        <button
          className="scroll-to-bottom-btn"
          onClick={smoothScrollToBottom}
          title="Ir al final"
        >
          <span className="scroll-icon">↓</span>
          <span className="scroll-text">Ir al final</span>
        </button>
      )}
    </div>
  );
};

export default Terminal;
