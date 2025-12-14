import React, { useState, useEffect } from 'react';
import Terminal from './components/Terminal';
import ConnectionForm from './components/ConnectionForm';
import MobileKeyboard from './components/MobileKeyboard';
import TabManager from './components/TabManager';
import './styles/App.css';

function App() {
  const [tabs, setTabs] = useState([]);
  const [activeTabId, setActiveTabId] = useState(null);
  const [terminals, setTerminals] = useState({});
  const [savedConnections, setSavedConnections] = useState([]);
  const [showConnectionForm, setShowConnectionForm] = useState(false);
  const [pendingTabId, setPendingTabId] = useState(null);
  const [isKeyboardExpanded, setIsKeyboardExpanded] = useState(true);

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

    // Crear primera pestaña vacía al inicio
    const firstTabId = Date.now();
    const firstTab = {
      id: firstTabId,
      connectionParams: null,
      name: null,
      isConnected: false
    };
    setTabs([firstTab]);
    setActiveTabId(firstTabId);
    setPendingTabId(firstTabId);
    setShowConnectionForm(true);
  }, []);

  const handleNewTab = () => {
    const newTabId = Date.now();
    const newTab = {
      id: newTabId,
      connectionParams: null,
      name: null,
      isConnected: false
    };

    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newTabId);
    setPendingTabId(newTabId);
    setShowConnectionForm(true);
  };

  const handleConnect = (params) => {
    const tabId = pendingTabId || activeTabId;

    // Actualizar tab con parámetros de conexión
    setTabs(prev => prev.map(tab =>
      tab.id === tabId
        ? {
            ...tab,
            connectionParams: params,
            name: params.name || `${params.username}@${params.host}`,
            isConnected: true
          }
        : tab
    ));

    setShowConnectionForm(false);
    setPendingTabId(null);

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

  const handleTabChange = (tabId) => {
    setActiveTabId(tabId);
    const tab = tabs.find(t => t.id === tabId);

    // Si la pestaña no tiene conexión, mostrar formulario
    if (!tab.isConnected) {
      setShowConnectionForm(true);
      setPendingTabId(tabId);
    } else {
      setShowConnectionForm(false);
    }
  };

  const handleTabClose = (tabId) => {
    // Cerrar terminal si existe
    const terminal = terminals[tabId];
    if (terminal && terminal.disconnect) {
      terminal.disconnect();
    }

    // Eliminar terminal del state
    setTerminals(prev => {
      const newTerminals = { ...prev };
      delete newTerminals[tabId];
      return newTerminals;
    });

    // Eliminar tab
    const newTabs = tabs.filter(tab => tab.id !== tabId);
    setTabs(newTabs);

    // Si cerramos el tab activo, activar otro
    if (tabId === activeTabId) {
      if (newTabs.length > 0) {
        // Activar el último tab
        const newActiveTab = newTabs[newTabs.length - 1];
        setActiveTabId(newActiveTab.id);

        if (!newActiveTab.isConnected) {
          setShowConnectionForm(true);
          setPendingTabId(newActiveTab.id);
        } else {
          setShowConnectionForm(false);
        }
      } else {
        // No quedan tabs, crear uno nuevo
        setActiveTabId(null);
        setShowConnectionForm(false);
        handleNewTab();
      }
    }
  };

  const handleDisconnect = (tabId) => {
    // Actualizar estado del tab
    setTabs(prev => prev.map(tab =>
      tab.id === tabId
        ? { ...tab, isConnected: false, connectionParams: null }
        : tab
    ));

    // Si es el tab activo, mostrar formulario de conexión
    if (tabId === activeTabId) {
      setShowConnectionForm(true);
      setPendingTabId(tabId);
    }
  };

  const handleDeleteConnection = (id) => {
    const updated = savedConnections.filter(conn => conn.id !== id);
    setSavedConnections(updated);
    localStorage.setItem('savedConnections', JSON.stringify(updated));
  };

  const handleTerminalReady = (tabId, terminalAPI) => {
    setTerminals(prev => ({
      ...prev,
      [tabId]: terminalAPI
    }));
  };

  const handleKeyPress = (key) => {
    const terminal = terminals[activeTabId];
    if (terminal && terminal.sendKey) {
      terminal.sendKey(key);
    }
  };

  const handleScrollToBottom = () => {
    const terminal = terminals[activeTabId];
    if (terminal && terminal.scrollToBottom) {
      terminal.scrollToBottom();
    }
  };

  const handleScrollToTop = () => {
    const terminal = terminals[activeTabId];
    if (terminal && terminal.scrollToTop) {
      terminal.scrollToTop();
    }
  };

  const activeTab = tabs.find(tab => tab.id === activeTabId);
  const hasConnectedTabs = tabs.some(tab => tab.isConnected);

  return (
    <div className="App">
      <header className="App-header">
        <h1>📱 SSH Mobile Client</h1>
        {hasConnectedTabs && (
          <button
            className="new-connection-btn"
            onClick={handleNewTab}
            title="Nueva conexión"
          >
            + Nueva
          </button>
        )}
      </header>

      {tabs.length > 0 && hasConnectedTabs && (
        <TabManager
          tabs={tabs}
          activeTabId={activeTabId}
          onTabChange={handleTabChange}
          onTabClose={handleTabClose}
          onNewTab={handleNewTab}
        />
      )}

      <main className="App-main">
        {showConnectionForm ? (
          <ConnectionForm
            onConnect={handleConnect}
            savedConnections={savedConnections}
            onDeleteConnection={handleDeleteConnection}
          />
        ) : (
          <>
            {/* Renderizar todos los terminales, pero solo mostrar el activo */}
            {tabs.map(tab => (
              tab.isConnected && (
                <div
                  key={tab.id}
                  style={{
                    display: tab.id === activeTabId ? 'flex' : 'none',
                    flexDirection: 'column',
                    flex: 1,
                    height: '100%'
                  }}
                >
                  <Terminal
                    connectionParams={tab.connectionParams}
                    onDisconnect={() => handleDisconnect(tab.id)}
                    onTerminalReady={(api) => handleTerminalReady(tab.id, api)}
                    isKeyboardExpanded={isKeyboardExpanded}
                  />
                </div>
              )
            ))}

            {activeTab && activeTab.isConnected && (
              <MobileKeyboard
                onKeyPress={handleKeyPress}
                onScrollToBottom={handleScrollToBottom}
                onScrollToTop={handleScrollToTop}
                onExpandChange={setIsKeyboardExpanded}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default App;
