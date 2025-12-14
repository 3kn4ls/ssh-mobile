import React, { useState } from 'react';
import '../styles/MobileKeyboard.css';

const MobileKeyboard = ({ onKeyPress, onScrollToBottom, onScrollToTop, onExpandChange }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeModifier, setActiveModifier] = useState(null);

  const toggleExpanded = () => {
    const newState = !isExpanded;
    setIsExpanded(newState);
    if (onExpandChange) {
      onExpandChange(newState);
    }
  };

  const handleKeyPress = (key, vibrate = true) => {
    if (vibrate && 'vibrate' in navigator) {
      navigator.vibrate(10);
    }

    let finalKey = key;

    // Aplicar modificador si está activo
    if (activeModifier === 'ctrl') {
      // Convertir a código de control
      if (key.length === 1) {
        const code = key.toUpperCase().charCodeAt(0) - 64;
        finalKey = String.fromCharCode(code);
      }
      setActiveModifier(null);
    } else if (activeModifier === 'alt') {
      finalKey = '\x1b' + key; // ESC + key para Alt
      setActiveModifier(null);
    }

    onKeyPress(finalKey);
  };

  const toggleModifier = (modifier) => {
    setActiveModifier(activeModifier === modifier ? null : modifier);
    if ('vibrate' in navigator) {
      navigator.vibrate(15);
    }
  };

  const specialKeys = [
    { label: 'Esc', value: '\x1b', width: 'normal' },
    { label: 'Tab', value: '\t', width: 'normal' },
    { label: '↑', value: '\x1b[A', width: 'small' },
    { label: '↓', value: '\x1b[B', width: 'small' },
    { label: '←', value: '\x1b[D', width: 'small' },
    { label: '→', value: '\x1b[C', width: 'small' },
  ];

  const commonCommands = [
    { label: 'ls', value: 'ls\r' },
    { label: 'cd', value: 'cd ' },
    { label: 'pwd', value: 'pwd\r' },
    { label: 'clear', value: 'clear\r' },
    { label: 'exit', value: 'exit\r' },
    { label: 'sudo', value: 'sudo ' },
  ];

  const commonChars = [
    { label: '/', value: '/' },
    { label: '-', value: '-' },
    { label: '~', value: '~' },
    { label: '|', value: '|' },
    { label: '&', value: '&' },
    { label: '>', value: '>' },
    { label: '<', value: '<' },
    { label: '*', value: '*' },
  ];

  return (
    <div className={`mobile-keyboard ${isExpanded ? 'expanded' : 'collapsed'}`}>
      <div className="keyboard-toggle" onClick={toggleExpanded}>
        <span>{isExpanded ? '▼' : '▲'} Teclado SSH</span>
      </div>

      {isExpanded && (
        <div className="keyboard-content">
          {/* Fila 0: Controles de scroll (nuevo) */}
          <div className="keyboard-row scroll-controls">
            <button
              className="key scroll-control"
              onClick={() => {
                if (onScrollToTop) {
                  onScrollToTop();
                  if ('vibrate' in navigator) navigator.vibrate(15);
                }
              }}
              title="Ir al inicio"
            >
              ⇈ Inicio
            </button>
            <button
              className="key scroll-control"
              onClick={() => {
                if (onScrollToBottom) {
                  onScrollToBottom();
                  if ('vibrate' in navigator) navigator.vibrate(15);
                }
              }}
              title="Ir al final"
            >
              ⇊ Final
            </button>
          </div>

          {/* Fila 1: Teclas especiales */}
          <div className="keyboard-row">
            {specialKeys.map((key, index) => (
              <button
                key={index}
                className={`key ${key.width}`}
                onClick={() => handleKeyPress(key.value)}
              >
                {key.label}
              </button>
            ))}
          </div>

          {/* Fila 2: Modificadores y teclas comunes */}
          <div className="keyboard-row">
            <button
              className={`key modifier ${activeModifier === 'ctrl' ? 'active' : ''}`}
              onClick={() => toggleModifier('ctrl')}
            >
              Ctrl
            </button>
            <button
              className={`key modifier ${activeModifier === 'alt' ? 'active' : ''}`}
              onClick={() => toggleModifier('alt')}
            >
              Alt
            </button>
            {commonChars.slice(0, 4).map((char, index) => (
              <button
                key={index}
                className="key small"
                onClick={() => handleKeyPress(char.value)}
              >
                {char.label}
              </button>
            ))}
          </div>

          {/* Fila 3: Más caracteres comunes */}
          <div className="keyboard-row">
            {commonChars.slice(4).map((char, index) => (
              <button
                key={index}
                className="key small"
                onClick={() => handleKeyPress(char.value)}
              >
                {char.label}
              </button>
            ))}
          </div>

          {/* Fila 4: Comandos comunes */}
          <div className="keyboard-row commands">
            {commonCommands.map((cmd, index) => (
              <button
                key={index}
                className="key command"
                onClick={() => handleKeyPress(cmd.value)}
              >
                {cmd.label}
              </button>
            ))}
          </div>

          {/* Fila 5: Controles especiales */}
          <div className="keyboard-row">
            <button
              className="key wide"
              onClick={() => handleKeyPress('\r')}
            >
              Enter ↵
            </button>
            <button
              className="key normal"
              onClick={() => handleKeyPress('\x7f')}
            >
              ⌫ Backspace
            </button>
            <button
              className="key normal"
              onClick={() => handleKeyPress('\x03')}
              title="Ctrl+C"
            >
              ^C
            </button>
            <button
              className="key normal"
              onClick={() => handleKeyPress('\x04')}
              title="Ctrl+D"
            >
              ^D
            </button>
          </div>

          {/* Indicador de modificador activo */}
          {activeModifier && (
            <div className="modifier-indicator">
              {activeModifier.toUpperCase()} + [presiona una tecla]
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MobileKeyboard;
