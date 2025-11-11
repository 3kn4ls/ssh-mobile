# 📱 SSH Mobile Client

Cliente SSH optimizado para dispositivos móviles como Progressive Web App (PWA). Permite conectarse a servidores SSH desde tu smartphone o tablet con una interfaz táctil intuitiva.

## ✨ Características

- 📱 **Progressive Web App (PWA)** - Instalable como app nativa en Android e iOS
- ⌨️ **Teclado virtual optimizado** - Teclas especiales SSH (Ctrl, Esc, Tab, flechas)
- 🔄 **Reconexión automática** - Mantiene la sesión activa en segundo plano
- 💾 **Gestión de conexiones** - Guarda tus servidores favoritos localmente
- 🌙 **Tema oscuro** - Diseñado para reducir fatiga visual
- 📶 **Modo offline** - Service Worker para funcionamiento sin conexión
- 🔐 **Autenticación flexible** - Soporte para contraseña y clave privada
- 🎯 **Comandos rápidos** - Botones para comandos comunes (ls, cd, clear, etc.)
- 📏 **Responsive** - Se adapta a cualquier tamaño de pantalla

## 🏗️ Arquitectura

```
ssh-mobile/
├── backend/          # Servidor Node.js + WebSocket + SSH2
│   ├── server.js     # Proxy SSH con gestión de sesiones
│   └── package.json
├── frontend/         # React + xterm.js + PWA
│   ├── public/       # Assets estáticos y PWA
│   │   ├── manifest.json
│   │   ├── service-worker.js
│   │   └── index.html
│   └── src/
│       ├── components/
│       │   ├── Terminal.js           # Terminal xterm.js
│       │   ├── ConnectionForm.js     # Formulario de conexión
│       │   └── MobileKeyboard.js     # Teclado virtual táctil
│       ├── styles/
│       └── App.js
└── package.json
```

## 🚀 Instalación

### Prerequisitos

- Node.js 16+ y npm
- Acceso SSH al servidor que deseas conectar

### Paso 1: Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/ssh-mobile.git
cd ssh-mobile
```

### Paso 2: Instalar dependencias

```bash
npm run install:all
```

O manualmente:

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### Paso 3: Configurar variables de entorno

**Backend** (`backend/.env`):
```bash
cp backend/.env.example backend/.env
# Editar si es necesario
```

**Frontend** (`frontend/.env`):
```bash
cp frontend/.env.example frontend/.env
# Para desarrollo local, el valor por defecto está bien
```

Para **producción**, actualiza la URL del WebSocket:
```
REACT_APP_WS_URL=wss://tu-servidor.com
```

## 💻 Desarrollo

Ejecutar backend y frontend simultáneamente:

```bash
npm run dev
```

O por separado:

```bash
# Terminal 1 - Backend
npm run dev:backend

# Terminal 2 - Frontend
npm run dev:frontend
```

Accede a la aplicación en: `http://localhost:3000`

## 📦 Producción

### Backend

```bash
cd backend
npm start
```

### Frontend

```bash
cd frontend
npm run build
```

Los archivos optimizados estarán en `frontend/build/`

### Servir con HTTPS

Para que la PWA funcione completamente, necesitas HTTPS. Opciones:

1. **Nginx** como proxy reverso:
```nginx
server {
    listen 443 ssl;
    server_name tu-dominio.com;

    # Certificados SSL
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # Frontend
    location / {
        root /path/to/frontend/build;
        try_files $uri /index.html;
    }

    # Backend WebSocket
    location /ws {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

2. **Cloudflare Tunnel** (gratis)
3. **ngrok** (para testing)

## 📱 Instalación en Móvil

### Android (Chrome/Edge)

1. Abre la app en Chrome
2. Menú (⋮) → "Agregar a pantalla de inicio"
3. Listo! Aparecerá como app nativa

### iOS (Safari)

1. Abre la app en Safari
2. Botón "Compartir"
3. "Añadir a pantalla de inicio"
4. Listo!

## 🎮 Uso

### 1. Conectar a un servidor

- Ingresa los datos del servidor SSH:
  - **Servidor**: IP o hostname
  - **Puerto**: Por defecto 22
  - **Usuario**: Tu usuario SSH
  - **Autenticación**: Contraseña o clave privada

### 2. Teclado virtual

El teclado incluye:
- **Teclas especiales**: Esc, Tab, Flechas
- **Modificadores**: Ctrl, Alt (presiona y luego otra tecla)
- **Comandos rápidos**: ls, cd, pwd, clear, exit, sudo
- **Caracteres especiales**: /, -, ~, |, &, >, <, *

### 3. Comandos útiles

- **Ctrl+C**: Presiona "Ctrl" luego "C", o usa el botón "^C"
- **Ctrl+D**: Botón "^D" para cerrar sesión
- **Limpiar pantalla**: Botón "clear"

## 🔒 Seguridad

- ✅ Las conexiones SSH se mantienen cifradas end-to-end
- ✅ Las contraseñas NO se almacenan localmente
- ✅ Solo se guardan datos de conexión (host, puerto, usuario)
- ✅ Sesiones con timeout automático por inactividad
- ⚠️ **Usa HTTPS en producción** para proteger credenciales en tránsito
- ⚠️ **No expongas el backend públicamente** sin autenticación adicional

## 🐛 Troubleshooting

### La app no se instala como PWA

- Verifica que estés usando HTTPS (excepto en localhost)
- Asegúrate que el service worker se registró correctamente
- En Chrome: DevTools → Application → Service Workers

### No se conecta al servidor SSH

- Verifica que el backend esté ejecutándose
- Revisa la URL del WebSocket en `.env`
- Comprueba que el servidor SSH sea accesible
- Revisa los logs del backend

### Sesión se desconecta al cambiar de app

La app intenta mantener la conexión, pero algunos sistemas operativos pueden matarla:
- **Android**: Deshabilita optimización de batería para la app
- **iOS**: Limita la ejecución en segundo plano (limitación del OS)

### El teclado no aparece

- Verifica que estés conectado al servidor
- En pantallas grandes (>1024px) el teclado se oculta automáticamente
- Toca el toggle "▲ Teclado SSH" para expandirlo

## 🛠️ Tecnologías

### Backend
- **Node.js** - Runtime de JavaScript
- **Express** - Framework web
- **ws** - WebSocket server
- **ssh2** - Cliente SSH para Node.js
- **uuid** - Generación de IDs únicos

### Frontend
- **React** - Librería UI
- **xterm.js** - Emulador de terminal
- **xterm-addon-fit** - Auto-ajuste del terminal
- **PWA** - Service Worker + Web App Manifest

## 📄 Licencia

MIT

## 🤝 Contribuir

Las contribuciones son bienvenidas! Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📞 Soporte

¿Problemas? Abre un [issue](https://github.com/tu-usuario/ssh-mobile/issues)

## 🙏 Agradecimientos

- [xterm.js](https://xtermjs.org/) - Excelente emulador de terminal
- [ssh2](https://github.com/mscdex/ssh2) - Librería SSH robusta
- Comunidad de React y Node.js

---

**Hecho con ❤️ para administradores de sistemas móviles**
