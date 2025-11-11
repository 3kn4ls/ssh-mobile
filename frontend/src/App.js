import React, { useState, useEffect } from 'react';
import Terminal from './components/Terminal';
import ConnectionForm from './components/ConnectionForm';
import MobileKeyboard from './components/MobileKeyboard';
import './styles/App.css';

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionParams, setConnectionParams] = useState(null);
  const [terminal, setTerminal] = useState(null);
  const [savedConnections, setSavedConnections] = useState([]);

  useEffect(() => {
    // Cargar conexiones guardadas
    const saved = localStorage.getItem('savedConnections');
    if (saved) {
      try {
        setSavedConnections(JSON.parse(saved));
      } catch (e) {
        console.error('Error cargando conexiones guardadas:', e);
      }
    }

    // Prevenir zoom en móviles
    document.addEventListener('gesturestart', function (e) {
      e.preventDefault();
    });

    // Mantener pantalla activa
    if ('wakeLock' in navigator) {
      let wakeLock = null;
      const requestWakeLock = async () => {
        try {
          wakeLock = await navigator.wakeLock.request('screen');
          console.log('Wake Lock activado');
        } catch (err) {
          console.error('Error activando Wake Lock:', err);
        }
      };

      requestWakeLock();

      document.addEventListener('visibilitychange', async () => {
        if (wakeLock !== null && document.visibilityState === 'visible') {
          await requestWakeLock();
        }
      });
    }
  }, []);

  const handleConnect = (params) => {
    setConnectionParams(params);
    setIsConnected(true);

    // Guardar conexión si se solicita
    if (params.saveConnection) {
      const newConnection = {
        id: Date.now(),
        name: params.name || `${params.username}@${params.host}`,
        host: params.host,
        port: params.port,
        username: params.username
      };

      const updated = [...savedConnections, newConnection];
      setSavedConnections(updated);
      localStorage.setItem('savedConnections', JSON.stringify(updated));
    }
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    setConnectionParams(null);
  };

  const handleDeleteConnection = (id) => {
    const updated = savedConnections.filter(conn => conn.id !== id);
    setSavedConnections(updated);
    localStorage.setItem('savedConnections', JSON.stringify(updated));
  };

  const handleKeyPress = (key) => {
    if (terminal) {
      terminal.sendKey(key);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>📱 SSH Mobile Client</h1>
        {isConnected && (
          <button className="disconnect-btn" onClick={handleDisconnect}>
            Desconectar
          </button>
        )}
      </header>

      <main className="App-main">
        {!isConnected ? (
          <ConnectionForm
            onConnect={handleConnect}
            savedConnections={savedConnections}
            onDeleteConnection={handleDeleteConnection}
          />
        ) : (
          <>
            <Terminal
              connectionParams={connectionParams}
              onDisconnect={handleDisconnect}
              onTerminalReady={setTerminal}
            />
            <MobileKeyboard onKeyPress={handleKeyPress} />
          </>
        )}
      </main>
    </div>
  );
}

export default App;
