import React, { useState } from 'react';
import '../styles/TabManager.css';

const TabManager = ({ tabs, activeTabId, onTabChange, onTabClose, onNewTab }) => {
  const [showMenu, setShowMenu] = useState(false);

  const handleTabClick = (tabId) => {
    onTabChange(tabId);
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  };

  const handleTabClose = (e, tabId) => {
    e.stopPropagation();
    if ('vibrate' in navigator) {
      navigator.vibrate(15);
    }

    // Confirmar si hay más de una pestaña
    if (tabs.length > 1) {
      onTabClose(tabId);
    } else {
      // Si es la última pestaña, preguntar
      const confirm = window.confirm('¿Cerrar la última pestaña y desconectar?');
      if (confirm) {
        onTabClose(tabId);
      }
    }
  };

  const getTabLabel = (tab) => {
    if (tab.name) return tab.name;
    if (tab.connectionParams) {
      const { username, host } = tab.connectionParams;
      return `${username}@${host}`;
    }
    return 'Nueva conexión';
  };

  const getShortLabel = (label) => {
    // Acortar para móvil
    if (label.length > 15) {
      return label.substring(0, 12) + '...';
    }
    return label;
  };

  return (
    <div className="tab-manager">
      <div className="tabs-container">
        <div className="tabs-scroll">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              className={`tab ${tab.id === activeTabId ? 'active' : ''}`}
              onClick={() => handleTabClick(tab.id)}
            >
              <span className="tab-label" title={getTabLabel(tab)}>
                {getShortLabel(getTabLabel(tab))}
              </span>
              {tabs.length > 1 && (
                <button
                  className="tab-close"
                  onClick={(e) => handleTabClose(e, tab.id)}
                  title="Cerrar pestaña"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>

        <button
          className="new-tab-btn"
          onClick={() => {
            onNewTab();
            if ('vibrate' in navigator) navigator.vibrate(15);
          }}
          title="Nueva conexión"
        >
          +
        </button>
      </div>

      {/* Contador de pestañas para móvil */}
      <div className="tab-counter">
        {tabs.length} {tabs.length === 1 ? 'conexión' : 'conexiones'}
      </div>
    </div>
  );
};

export default TabManager;
