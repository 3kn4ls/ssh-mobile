import React, { useState } from 'react';
import '../styles/ConnectionForm.css';

const ConnectionForm = ({ onConnect, savedConnections, onDeleteConnection }) => {
  const [formData, setFormData] = useState({
    host: '',
    port: '22',
    username: '',
    password: '',
    privateKey: '',
    authMethod: 'password',
    saveConnection: false,
    name: ''
  });

  const [showSaved, setShowSaved] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.host || !formData.username) {
      alert('Por favor completa los campos requeridos');
      return;
    }
    onConnect(formData);
  };

  const handleLoadConnection = (connection) => {
    setFormData(prev => ({
      ...prev,
      host: connection.host,
      port: connection.port || '22',
      username: connection.username,
      name: connection.name
    }));
    setShowSaved(false);
  };

  return (
    <div className="connection-form-container">
      <div className="connection-form-card">
        <h2>Conectar a SSH</h2>

        {savedConnections.length > 0 && (
          <div className="saved-connections-section">
            <button
              type="button"
              className="toggle-saved-btn"
              onClick={() => setShowSaved(!showSaved)}
            >
              {showSaved ? '− Ocultar' : '+ Mostrar'} conexiones guardadas ({savedConnections.length})
            </button>

            {showSaved && (
              <div className="saved-connections-list">
                {savedConnections.map(conn => (
                  <div key={conn.id} className="saved-connection-item">
                    <button
                      onClick={() => handleLoadConnection(conn)}
                      className="load-connection-btn"
                    >
                      <strong>{conn.name}</strong>
                      <span>{conn.username}@{conn.host}:{conn.port}</span>
                    </button>
                    <button
                      onClick={() => onDeleteConnection(conn.id)}
                      className="delete-connection-btn"
                      title="Eliminar"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="host">Servidor *</label>
            <input
              type="text"
              id="host"
              name="host"
              value={formData.host}
              onChange={handleChange}
              placeholder="ejemplo.com o 192.168.1.1"
              required
              autoComplete="off"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="port">Puerto</label>
              <input
                type="number"
                id="port"
                name="port"
                value={formData.port}
                onChange={handleChange}
                placeholder="22"
              />
            </div>

            <div className="form-group">
              <label htmlFor="username">Usuario *</label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="usuario"
                required
                autoComplete="off"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Método de autenticación</label>
            <div className="radio-group">
              <label>
                <input
                  type="radio"
                  name="authMethod"
                  value="password"
                  checked={formData.authMethod === 'password'}
                  onChange={handleChange}
                />
                Contraseña
              </label>
              <label>
                <input
                  type="radio"
                  name="authMethod"
                  value="privateKey"
                  checked={formData.authMethod === 'privateKey'}
                  onChange={handleChange}
                />
                Clave privada
              </label>
            </div>
          </div>

          {formData.authMethod === 'password' ? (
            <div className="form-group">
              <label htmlFor="password">Contraseña *</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
                autoComplete="new-password"
              />
            </div>
          ) : (
            <div className="form-group">
              <label htmlFor="privateKey">Clave privada *</label>
              <textarea
                id="privateKey"
                name="privateKey"
                value={formData.privateKey}
                onChange={handleChange}
                placeholder="-----BEGIN RSA PRIVATE KEY-----&#10;..."
                rows="4"
                required
              />
            </div>
          )}

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="saveConnection"
                checked={formData.saveConnection}
                onChange={handleChange}
              />
              Guardar esta conexión
            </label>
          </div>

          {formData.saveConnection && (
            <div className="form-group">
              <label htmlFor="name">Nombre de la conexión</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Mi servidor"
              />
            </div>
          )}

          <button type="submit" className="connect-btn">
            Conectar
          </button>
        </form>

        <div className="security-notice">
          <small>
            🔒 Las credenciales no se almacenan. Solo se guarda la información de conexión.
          </small>
        </div>
      </div>
    </div>
  );
};

export default ConnectionForm;
