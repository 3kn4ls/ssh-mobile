import React, { useEffect, useRef, useState } from 'react';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { WebLinksAddon } from 'xterm-addon-web-links';
import 'xterm/css/xterm.css';
import '../styles/Terminal.css';

const Terminal = ({ connectionParams, onDisconnect, onTerminalReady }) => {
  const terminalRef = useRef(null);
  const xtermRef = useRef(null);
  const wsRef = useRef(null);
  const fitAddonRef = useRef(null);
  const [status, setStatus] = useState('Conectando...');
  const [reconnectAttempt, setReconnectAttempt] = useState(0);
  const pingIntervalRef = useRef(null);

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

    // Conectar WebSocket
    connectWebSocket();

    // API para enviar teclas especiales
    const terminalAPI = {
      sendKey: (key) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: 'data',
            data: key
          }));
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
      if (wsRef.current) {
        wsRef.current.close();
      }
      term.dispose();
    };
  }, []);

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
            xtermRef.current.write(message.data);
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
      }
    });

    wsRef.current = ws;
  };

  return (
    <div className="terminal-container">
      <div className="terminal-status">
        <span className={`status-indicator ${status.includes('Conectado') ? 'connected' : ''}`}>
          {status}
        </span>
      </div>
      <div ref={terminalRef} className="terminal" />
    </div>
  );
};

export default Terminal;
