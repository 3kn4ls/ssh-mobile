#!/bin/bash

set -e

echo "🚀 Desplegando SSH Mobile Client a k3s..."

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Variables
REGISTRY="localhost:5000"
BACKEND_IMAGE="ssh-mobile-backend"
FRONTEND_IMAGE="ssh-mobile-frontend"
TAG="latest"

# Función para mostrar errores
error_exit() {
    echo -e "${RED}❌ Error: $1${NC}" 1>&2
    exit 1
}

# Función para mostrar progreso
info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Función para mostrar éxito
success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# 1. Construir imagen del backend
info "Construyendo imagen del backend..."
docker build \
    --platform linux/arm64 \
    -t ${BACKEND_IMAGE}:${TAG} \
    -f backend/Dockerfile \
    backend/ || error_exit "Falló la construcción del backend"

success "Backend construido"

# 2. Construir imagen del frontend
info "Construyendo imagen del frontend..."
docker build \
    --platform linux/arm64 \
    -t ${FRONTEND_IMAGE}:${TAG} \
    -f frontend/Dockerfile \
    frontend/ || error_exit "Falló la construcción del frontend"

success "Frontend construido"

# 3. Etiquetar imágenes para el registry local
info "Etiquetando imágenes para registry local..."
docker tag ${BACKEND_IMAGE}:${TAG} ${REGISTRY}/${BACKEND_IMAGE}:${TAG}
docker tag ${FRONTEND_IMAGE}:${TAG} ${REGISTRY}/${FRONTEND_IMAGE}:${TAG}

# 4. Push al registry local de k3s
info "Subiendo imágenes al registry de k3s..."
docker push ${REGISTRY}/${BACKEND_IMAGE}:${TAG} || error_exit "Falló el push del backend"
docker push ${REGISTRY}/${FRONTEND_IMAGE}:${TAG} || error_exit "Falló el push del frontend"

success "Imágenes subidas al registry"

# 5. Aplicar configuración de Kubernetes
info "Aplicando manifiestos de Kubernetes..."
sudo kubectl apply -f k8s/all-in-one.yaml || error_exit "Falló la aplicación de manifiestos"

success "Manifiestos aplicados"

# 6. Reiniciar deployments para forzar pull de nuevas imágenes
info "Reiniciando deployments..."
sudo kubectl rollout restart deployment/ssh-mobile-backend -n default || error_exit "Falló reinicio del backend"
sudo kubectl rollout restart deployment/ssh-mobile-frontend -n default || error_exit "Falló reinicio del frontend"

# 7. Esperar a que los deployments estén listos
info "Esperando a que los deployments estén listos..."
sudo kubectl rollout status deployment/ssh-mobile-backend -n default --timeout=300s || error_exit "Timeout esperando backend"
sudo kubectl rollout status deployment/ssh-mobile-frontend -n default --timeout=300s || error_exit "Timeout esperando frontend"

success "Deployments listos"

# 8. Mostrar estado
echo ""
info "Estado de los pods:"
sudo kubectl get pods -l app=ssh-mobile-backend -n default
sudo kubectl get pods -l app=ssh-mobile-frontend -n default

echo ""
info "Estado de los servicios:"
sudo kubectl get svc -l app=ssh-mobile-backend -n default
sudo kubectl get svc -l app=ssh-mobile-frontend -n default

echo ""
info "Estado del Ingress:"
sudo kubectl get ingress ssh-mobile-ingress -n default

echo ""
success "🎉 Despliegue completado exitosamente!"
echo ""
echo -e "${GREEN}La aplicación está disponible en:${NC}"
echo -e "${BLUE}🌐 https://northr3nd.duckdns.org/ssh${NC}"
echo ""
echo -e "${BLUE}Para ver los logs:${NC}"
echo "  Backend:  sudo kubectl logs -f -l app=ssh-mobile-backend"
echo "  Frontend: sudo kubectl logs -f -l app=ssh-mobile-frontend"
