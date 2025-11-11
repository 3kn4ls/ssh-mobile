# 🚀 Guía de Despliegue

Esta guía te ayudará a desplegar SSH Mobile Client en producción.

## 📋 Opciones de Despliegue

### Opción 1: VPS (Recomendado para uso personal)

#### Prerequisitos
- VPS con Ubuntu 20.04+ (DigitalOcean, Linode, AWS EC2, etc.)
- Dominio con DNS configurado
- Certificado SSL (Let's Encrypt gratis)

#### Paso 1: Preparar el servidor

```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Instalar Nginx
sudo apt install -y nginx

# Instalar Certbot para SSL
sudo apt install -y certbot python3-certbot-nginx

# Instalar PM2 (gestor de procesos Node.js)
sudo npm install -g pm2
```

#### Paso 2: Clonar y configurar el proyecto

```bash
# Clonar repositorio
cd /var/www
sudo git clone https://github.com/tu-usuario/ssh-mobile.git
cd ssh-mobile
sudo chown -R $USER:$USER .

# Instalar dependencias
npm run install:all

# Configurar backend
cd backend
cp .env.example .env
# Editar .env según necesites

# Compilar frontend
cd ../frontend
cp .env.example .env
# Cambiar REACT_APP_WS_URL a tu dominio:
# REACT_APP_WS_URL=wss://tu-dominio.com/ws
npm run build
```

#### Paso 3: Configurar Nginx

```bash
sudo nano /etc/nginx/sites-available/ssh-mobile
```

Pega esta configuración:

```nginx
server {
    listen 80;
    server_name tu-dominio.com;

    # Redirigir a HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name tu-dominio.com;

    # Certificados SSL (se generarán con certbot)
    ssl_certificate /etc/letsencrypt/live/tu-dominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tu-dominio.com/privkey.pem;

    # Configuración SSL moderna
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Frontend (React build)
    root /var/www/ssh-mobile/frontend/build;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "no-cache, must-revalidate";
    }

    # Cache estático
    location /static/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Backend WebSocket
    location /ws {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts largos para WebSocket
        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;
    }

    # API Health check
    location /health {
        proxy_pass http://localhost:3001/health;
    }
}
```

#### Paso 4: Obtener certificado SSL

```bash
# Primero habilita el sitio sin SSL
sudo ln -s /etc/nginx/sites-available/ssh-mobile /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Obtener certificado
sudo certbot --nginx -d tu-dominio.com

# Certbot configurará automáticamente el SSL en Nginx
```

#### Paso 5: Iniciar backend con PM2

```bash
cd /var/www/ssh-mobile/backend

# Iniciar con PM2
pm2 start server.js --name ssh-mobile-backend

# Configurar inicio automático
pm2 startup
pm2 save

# Ver logs
pm2 logs ssh-mobile-backend
```

#### Paso 6: Verificar

```bash
# Estado de Nginx
sudo systemctl status nginx

# Estado del backend
pm2 status

# Test WebSocket
curl -i http://localhost:3001/health
```

Accede a `https://tu-dominio.com` y prueba la app!

---

### Opción 2: Docker (Para escalabilidad)

#### Crear Dockerfile para backend

```dockerfile
# backend/Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3001

CMD ["node", "server.js"]
```

#### Crear Dockerfile para frontend

```dockerfile
# frontend/Dockerfile
FROM node:18-alpine as builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "3001:3001"
    environment:
      - PORT=3001
    restart: unless-stopped

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: unless-stopped
```

Ejecutar:

```bash
docker-compose up -d
```

---

### Opción 3: Serverless (AWS Lambda + API Gateway)

Esta opción es más compleja pero permite auto-escalado:

1. **Backend**: Lambda + API Gateway WebSocket
2. **Frontend**: S3 + CloudFront
3. **Guía**: [AWS WebSocket API](https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-websocket-api.html)

---

### Opción 4: Plataformas Cloud

#### Heroku

```bash
# Instalar Heroku CLI
npm install -g heroku

# Backend
cd backend
heroku create ssh-mobile-backend
git init
git add .
git commit -m "Initial commit"
git push heroku main

# Frontend
cd ../frontend
# Actualizar REACT_APP_WS_URL con la URL de Heroku
npm run build
# Deploy con Heroku buildpack para React
```

#### Railway / Render

Ambos tienen muy buena integración con Node.js:

1. Conectar repositorio de GitHub
2. Railway/Render detectan automáticamente Node.js
3. Configurar variables de entorno
4. Deploy automático

---

## 🔒 Seguridad en Producción

### 1. Variables de entorno

```bash
# backend/.env
PORT=3001
NODE_ENV=production
SESSION_TIMEOUT=1800000
MAX_RECONNECT_ATTEMPTS=5

# Opcional: Añadir autenticación
JWT_SECRET=tu-secreto-super-seguro
ALLOWED_ORIGINS=https://tu-dominio.com
```

### 2. Firewall

```bash
# Permitir solo puertos necesarios
sudo ufw allow 22/tcp  # SSH
sudo ufw allow 80/tcp  # HTTP
sudo ufw allow 443/tcp # HTTPS
sudo ufw enable
```

### 3. Rate limiting (Nginx)

Añadir a la configuración de Nginx:

```nginx
limit_req_zone $binary_remote_addr zone=ssh_limit:10m rate=10r/s;

server {
    ...
    location /ws {
        limit_req zone=ssh_limit burst=20;
        ...
    }
}
```

### 4. Autenticación adicional (opcional)

Para añadir autenticación JWT antes de permitir conexiones SSH, modifica `backend/server.js`:

```javascript
const jwt = require('jsonwebtoken');

// Middleware de autenticación
ws.on('message', (message) => {
  const data = JSON.parse(message);

  if (data.type === 'connect') {
    // Verificar token
    const token = data.token;
    try {
      jwt.verify(token, process.env.JWT_SECRET);
      // Continuar con conexión SSH
    } catch (err) {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'No autorizado'
      }));
      ws.close();
    }
  }
});
```

---

## 📊 Monitoreo

### PM2 Plus (gratis para open source)

```bash
pm2 link [secret] [public]
```

### Logs

```bash
# Ver logs en tiempo real
pm2 logs

# Logs de Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Health checks

Configura un cron job para verificar que el servicio esté activo:

```bash
# Crear script de health check
nano /var/www/ssh-mobile/healthcheck.sh
```

```bash
#!/bin/bash
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/health)
if [ $RESPONSE != "200" ]; then
    pm2 restart ssh-mobile-backend
    echo "$(date): Servicio reiniciado" >> /var/log/ssh-mobile-health.log
fi
```

```bash
chmod +x /var/www/ssh-mobile/healthcheck.sh

# Añadir a crontab
crontab -e
# Añadir:
*/5 * * * * /var/www/ssh-mobile/healthcheck.sh
```

---

## 🔄 Actualizaciones

```bash
cd /var/www/ssh-mobile

# Actualizar código
git pull origin main

# Reinstalar dependencias si hay cambios
npm run install:all

# Recompilar frontend
cd frontend
npm run build

# Reiniciar backend
pm2 restart ssh-mobile-backend
```

---

## 💰 Costos Estimados

| Plataforma | Costo Mensual | Características |
|------------|---------------|-----------------|
| DigitalOcean Droplet | $5-10 | VPS básico, 1GB RAM |
| Linode Nanode | $5 | VPS básico |
| AWS t2.micro | Gratis 1er año | Capa gratuita |
| Heroku Hobby | $7 | Fácil deploy |
| Railway | $5+ | Auto-scale |
| Cloudflare Tunnel | Gratis | + VPS propio |

---

## 🆘 Troubleshooting

### WebSocket no conecta

- Verifica que Nginx proxy_pass esté bien configurado
- Revisa que el puerto 3001 esté abierto
- Comprueba los logs: `pm2 logs`

### Error 502 Bad Gateway

- Backend no está corriendo: `pm2 status`
- Puerto incorrecto en Nginx config

### Certificado SSL expirado

```bash
sudo certbot renew
```

Certbot renueva automáticamente, pero puedes forzarlo.

---

¿Necesitas ayuda? Abre un issue en GitHub!
