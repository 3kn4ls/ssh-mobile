# Despliegue en k3s

Este documento describe cómo desplegar SSH Mobile Client en el cluster k3s local.

## 🚀 Despliegue Rápido

```bash
./deploy.sh
```

Este script automatizado realiza:
1. ✅ Construcción de imágenes Docker (backend y frontend)
2. ✅ Subida al registry local de k3s (`localhost:5000`)
3. ✅ Aplicación de manifiestos de Kubernetes
4. ✅ Reinicio de deployments
5. ✅ Verificación del estado

## 📦 Arquitectura de Despliegue

### Backend (Node.js + WebSocket)
- **Imagen**: `localhost:5000/ssh-mobile-backend:latest`
- **Puerto**: 3001
- **Réplicas**: 1
- **Recursos**:
  - Request: 128Mi RAM, 100m CPU
  - Limit: 256Mi RAM, 500m CPU
- **Health checks**: Liveness y Readiness en `/health`

### Frontend (React + Nginx)
- **Imagen**: `localhost:5000/ssh-mobile-frontend:latest`
- **Puerto**: 80
- **Réplicas**: 2
- **Recursos**:
  - Request: 64Mi RAM, 50m CPU
  - Limit: 128Mi RAM, 200m CPU
- **Health checks**: Liveness y Readiness en `/health`

### Ingress (Traefik)
- **Host**: `northr3nd.duckdns.org`
- **Path Frontend**: `/ssh`
- **Path Backend**: `/ssh/ws`
- **TLS**: Sí (cert-manager con Let's Encrypt)

## 🌐 URLs de Acceso

- **Aplicación Web**: https://northr3nd.duckdns.org/ssh
- **WebSocket**: wss://northr3nd.duckdns.org/ssh/ws

## 📁 Estructura de Archivos

```
ssh-mobile/
├── backend/
│   ├── Dockerfile              # Imagen Node.js con usuario no-root
│   ├── server.js               # Servidor WebSocket + SSH proxy
│   └── package.json
├── frontend/
│   ├── Dockerfile              # Multi-stage: Build React + Nginx
│   ├── nginx.conf              # Configuración para path prefix /ssh
│   ├── src/
│   └── package.json
├── k8s/
│   ├── all-in-one.yaml         # Todos los recursos en un archivo
│   ├── backend-deployment.yaml # Deployment del backend
│   ├── backend-service.yaml    # Service del backend
│   ├── frontend-deployment.yaml # Deployment del frontend
│   ├── frontend-service.yaml   # Service del frontend
│   └── ingress.yaml            # Ingress con TLS
└── deploy.sh                   # Script de despliegue automatizado
```

## 🔧 Comandos Útiles

### Ver estado de los pods
```bash
sudo kubectl get pods -l app=ssh-mobile-backend
sudo kubectl get pods -l app=ssh-mobile-frontend
```

### Ver logs
```bash
# Backend
sudo kubectl logs -f -l app=ssh-mobile-backend

# Frontend
sudo kubectl logs -f -l app=ssh-mobile-frontend
```

### Ver servicios
```bash
sudo kubectl get svc -l app=ssh-mobile-backend
sudo kubectl get svc -l app=ssh-mobile-frontend
```

### Ver ingress
```bash
sudo kubectl get ingress ssh-mobile-ingress
sudo kubectl describe ingress ssh-mobile-ingress
```

### Reiniciar deployments
```bash
sudo kubectl rollout restart deployment/ssh-mobile-backend
sudo kubectl rollout restart deployment/ssh-mobile-frontend
```

### Escalar réplicas
```bash
# Escalar frontend a 3 réplicas
sudo kubectl scale deployment/ssh-mobile-frontend --replicas=3

# Escalar backend a 2 réplicas
sudo kubectl scale deployment/ssh-mobile-backend --replicas=2
```

### Eliminar el despliegue
```bash
sudo kubectl delete -f k8s/all-in-one.yaml
```

## 🔍 Troubleshooting

### Pods no inician
```bash
# Ver eventos
sudo kubectl describe pod <pod-name>

# Ver logs completos
sudo kubectl logs <pod-name>
```

### Error de imagen
```bash
# Verificar registry local
curl http://localhost:5000/v2/_catalog

# Re-construir y subir imágenes
./deploy.sh
```

### Ingress no funciona
```bash
# Verificar configuración de Traefik
sudo kubectl get ingress -A
sudo kubectl describe ingress ssh-mobile-ingress

# Verificar certificado TLS
sudo kubectl get certificate -A
```

### WebSocket no conecta
```bash
# Verificar logs del backend
sudo kubectl logs -f -l app=ssh-mobile-backend

# Verificar que el path /ssh/ws llega al backend
sudo kubectl exec -it <frontend-pod-name> -- wget -O- http://ssh-mobile-backend:3001/health
```

## 🔄 Actualización de la Aplicación

Cuando hagas cambios en el código:

```bash
# Opción 1: Usar el script de despliegue (recomendado)
./deploy.sh

# Opción 2: Manual
# 1. Construir imágenes
docker build --platform linux/arm64 -t ssh-mobile-backend:latest -f backend/Dockerfile backend/
docker build --platform linux/arm64 -t ssh-mobile-frontend:latest -f frontend/Dockerfile frontend/

# 2. Etiquetar
docker tag ssh-mobile-backend:latest localhost:5000/ssh-mobile-backend:latest
docker tag ssh-mobile-frontend:latest localhost:5000/ssh-mobile-frontend:latest

# 3. Subir al registry
docker push localhost:5000/ssh-mobile-backend:latest
docker push localhost:5000/ssh-mobile-frontend:latest

# 4. Reiniciar pods
sudo kubectl rollout restart deployment/ssh-mobile-backend
sudo kubectl rollout restart deployment/ssh-mobile-frontend
```

## 📊 Monitoreo

### Health checks
```bash
# Backend
curl http://localhost:3001/health  # Desde dentro del cluster

# Frontend
curl http://ssh-mobile-frontend/health  # Desde dentro del cluster
```

### Métricas de recursos
```bash
# Ver uso de recursos
sudo kubectl top pods -l app=ssh-mobile-backend
sudo kubectl top pods -l app=ssh-mobile-frontend
```

## 🔐 Seguridad

- ✅ Contenedores corren con usuario no-root
- ✅ TLS/HTTPS habilitado con cert-manager
- ✅ Recursos limitados para prevenir consumo excesivo
- ✅ Health checks para detección temprana de fallos
- ✅ Ingress configurado con Traefik

## 📝 Notas

- El frontend está configurado para funcionar bajo el path `/ssh`
- El WebSocket del backend está en `/ssh/ws`
- Las imágenes se construyen para arquitectura ARM64 (Raspberry Pi)
- El registry local de k3s está en `localhost:5000`
- Los certificados TLS se renuevan automáticamente con cert-manager

## 🆘 Soporte

Para problemas o preguntas, revisa:
1. Los logs de los pods
2. Los eventos de Kubernetes (`kubectl describe`)
3. La configuración del Ingress
4. El estado del registry local
