const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const { Client } = require('ssh2');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Almacenamiento de sesiones activas
const sessions = new Map();

// Clase para gestionar sesiones SSH
class SSHSession {
  constructor(ws, connectionParams) {
    this.id = uuidv4();
    this.ws = ws;
    this.connectionParams = connectionParams;
    this.sshClient = new Client();
    this.stream = null;
    this.isConnected = false;
    this.lastActivity = Date.now();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  connect() {
    return new Promise((resolve, reject) => {
      this.sshClient.on('ready', () => {
        console.log(`[${this.id}] SSH conexión establecida`);
        this.isConnected = true;
        this.reconnectAttempts = 0;

        this.sshClient.shell({ term: 'xterm-256color' }, (err, stream) => {
          if (err) {
            console.error(`[${this.id}] Error al abrir shell:`, err);
            reject(err);
            return;
          }

          this.stream = stream;

          stream.on('data', (data) => {
            this.lastActivity = Date.now();
            if (this.ws.readyState === WebSocket.OPEN) {
              this.ws.send(JSON.stringify({
                type: 'data',
                data: data.toString('utf-8')
              }));
            }
          });

          stream.on('close', () => {
            console.log(`[${this.id}] Stream cerrado`);
            this.cleanup();
          });

          stream.stderr.on('data', (data) => {
            if (this.ws.readyState === WebSocket.OPEN) {
              this.ws.send(JSON.stringify({
                type: 'data',
                data: data.toString('utf-8')
              }));
            }
          });

          resolve();
        });
      });

      this.sshClient.on('error', (err) => {
        console.error(`[${this.id}] Error SSH:`, err.message);
        if (this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({
            type: 'error',
            message: `Error de conexión: ${err.message}`
          }));
        }
        reject(err);
      });

      this.sshClient.on('end', () => {
        console.log(`[${this.id}] SSH conexión finalizada`);
        this.isConnected = false;
      });

      this.sshClient.on('close', () => {
        console.log(`[${this.id}] SSH conexión cerrada`);
        this.isConnected = false;
        this.attemptReconnect();
      });

      // Conectar con los parámetros proporcionados
      const { host, port, username, password, privateKey } = this.connectionParams;

      const config = {
        host,
        port: port || 22,
        username,
        readyTimeout: 20000,
        keepaliveInterval: 10000,
        keepaliveCountMax: 3
      };

      if (privateKey) {
        config.privateKey = privateKey;
      } else if (password) {
        config.password = password;
      }

      this.sshClient.connect(config);
    });
  }

  attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log(`[${this.id}] Máximo de intentos de reconexión alcanzado`);
      if (this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({
          type: 'error',
          message: 'Conexión perdida. Por favor, reconecta manualmente.'
        }));
      }
      return;
    }

    this.reconnectAttempts++;
    console.log(`[${this.id}] Intento de reconexión ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);

    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'reconnecting',
        attempt: this.reconnectAttempts
      }));
    }

    setTimeout(() => {
      this.connect().catch(err => {
        console.error(`[${this.id}] Error en reconexión:`, err.message);
      });
    }, 2000 * this.reconnectAttempts);
  }

  sendData(data) {
    if (this.stream && this.isConnected) {
      this.lastActivity = Date.now();
      this.stream.write(data);
    }
  }

  resize(cols, rows) {
    if (this.stream && this.isConnected) {
      this.stream.setWindow(rows, cols);
    }
  }

  cleanup() {
    if (this.stream) {
      this.stream.end();
      this.stream = null;
    }
    if (this.sshClient) {
      this.sshClient.end();
    }
    sessions.delete(this.id);
  }
}

// Manejador de WebSocket
wss.on('connection', (ws) => {
  console.log('Nueva conexión WebSocket');
  let session = null;

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);

      switch (data.type) {
        case 'connect':
          // Crear nueva sesión SSH
          session = new SSHSession(ws, data.params);
          sessions.set(session.id, session);

          try {
            await session.connect();
            ws.send(JSON.stringify({
              type: 'connected',
              sessionId: session.id
            }));
          } catch (err) {
            ws.send(JSON.stringify({
              type: 'error',
              message: `No se pudo conectar: ${err.message}`
            }));
            session.cleanup();
            session = null;
          }
          break;

        case 'data':
          // Enviar datos al servidor SSH
          if (session) {
            session.sendData(data.data);
          }
          break;

        case 'resize':
          // Redimensionar terminal
          if (session) {
            session.resize(data.cols, data.rows);
          }
          break;

        case 'ping':
          // Mantener conexión viva
          ws.send(JSON.stringify({ type: 'pong' }));
          break;

        default:
          console.log('Tipo de mensaje desconocido:', data.type);
      }
    } catch (err) {
      console.error('Error procesando mensaje:', err);
    }
  });

  ws.on('close', () => {
    console.log('WebSocket cerrado');
    if (session) {
      // No cerrar la sesión SSH inmediatamente, permitir reconexión
      setTimeout(() => {
        if (session && !session.isConnected) {
          session.cleanup();
        }
      }, 60000); // 1 minuto de gracia para reconexión
    }
  });

  ws.on('error', (error) => {
    console.error('Error WebSocket:', error);
  });
});

// Endpoint de salud
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    activeSessions: sessions.size,
    uptime: process.uptime()
  });
});

// Limpiar sesiones inactivas cada 5 minutos
setInterval(() => {
  const now = Date.now();
  const timeout = 30 * 60 * 1000; // 30 minutos

  sessions.forEach((session, id) => {
    if (now - session.lastActivity > timeout) {
      console.log(`[${id}] Sesión inactiva, cerrando...`);
      session.cleanup();
    }
  });
}, 5 * 60 * 1000);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Servidor SSH proxy ejecutándose en puerto ${PORT}`);
  console.log(`WebSocket disponible en ws://localhost:${PORT}`);
});
