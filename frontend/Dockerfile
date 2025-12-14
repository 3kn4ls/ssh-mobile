# Stage 1: Build React application
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar código fuente
COPY . .

# Build para producción
# PUBLIC_URL=/ssh configura las rutas base para que funcione en /ssh
# REACT_APP_WS_URL configura la URL del WebSocket
ENV PUBLIC_URL=/ssh
ENV REACT_APP_WS_URL=wss://northr3nd.duckdns.org/ssh/ws
RUN npm run build

# Stage 2: Servir con Nginx
FROM nginx:alpine

# Copiar configuración de nginx
COPY nginx.conf /etc/nginx/nginx.conf

# Copiar build de React desde stage anterior
COPY --from=builder /app/build /usr/share/nginx/html

# Exponer puerto 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
