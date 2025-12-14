#!/bin/bash

# Script de release con versionado para ssh-mobile con ArgoCD
# Uso: ./release.sh [patch|minor|major] "mensaje del commit"

set -e

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Variables
BACKEND_IMAGE="localhost:5000/ssh-mobile-backend"
FRONTEND_IMAGE="localhost:5000/ssh-mobile-frontend"
BACKEND_DEPLOYMENT="k8s/backend-deployment.yaml"
FRONTEND_DEPLOYMENT="k8s/frontend-deployment.yaml"
VERSION_FILE="VERSION"

# Leer versión actual
if [ ! -f "$VERSION_FILE" ]; then
    echo "1.0.0" > "$VERSION_FILE"
fi

CURRENT_VERSION=$(cat "$VERSION_FILE")
print_info "Versión actual: $CURRENT_VERSION"

# Función para incrementar versión
increment_version() {
    local version=$1
    local type=$2

    IFS='.' read -r -a parts <<< "$version"
    local major="${parts[0]}"
    local minor="${parts[1]}"
    local patch="${parts[2]}"

    case "$type" in
        major)
            major=$((major + 1))
            minor=0
            patch=0
            ;;
        minor)
            minor=$((minor + 1))
            patch=0
            ;;
        patch)
            patch=$((patch + 1))
            ;;
        *)
            print_error "Tipo de versión inválido: $type"
            exit 1
            ;;
    esac

    echo "${major}.${minor}.${patch}"
}

# Verificar argumentos
VERSION_TYPE=${1:-patch}
COMMIT_MESSAGE=${2:-"Release"}

if [[ ! "$VERSION_TYPE" =~ ^(patch|minor|major)$ ]]; then
    print_error "Tipo de versión debe ser: patch, minor o major"
    echo ""
    echo "Uso: $0 [patch|minor|major] \"mensaje del commit\""
    echo ""
    echo "Versionado semántico (MAJOR.MINOR.PATCH):"
    echo "  patch  - Correcciones de bugs (1.0.0 -> 1.0.1)"
    echo "  minor  - Nueva funcionalidad compatible (1.0.0 -> 1.1.0)"
    echo "  major  - Cambios incompatibles (1.0.0 -> 2.0.0)"
    exit 1
fi

# Calcular nueva versión
NEW_VERSION=$(increment_version "$CURRENT_VERSION" "$VERSION_TYPE")
print_info "Nueva versión: $NEW_VERSION"

# Verificar que no haya cambios sin commit
if ! git diff-index --quiet HEAD --; then
    print_warning "Tienes cambios sin commit."
    read -p "¿Continuar? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_error "Operación cancelada"
        exit 1
    fi
fi

# 1. Construir imágenes Docker
print_info "Paso 1/5: Construyendo imágenes Docker..."

# Backend
print_info "  Construyendo backend..."
docker build \
    --platform linux/arm64 \
    -t ${BACKEND_IMAGE}:v${NEW_VERSION} \
    -t ${BACKEND_IMAGE}:latest \
    -f backend/Dockerfile \
    ./backend

# Frontend
print_info "  Construyendo frontend..."
docker build \
    --platform linux/arm64 \
    -t ${FRONTEND_IMAGE}:v${NEW_VERSION} \
    -t ${FRONTEND_IMAGE}:latest \
    -f frontend/Dockerfile \
    ./frontend

# 2. Push a registry local
print_info "Paso 2/5: Subiendo imágenes al registry local..."
docker push ${BACKEND_IMAGE}:v${NEW_VERSION}
docker push ${BACKEND_IMAGE}:latest
docker push ${FRONTEND_IMAGE}:v${NEW_VERSION}
docker push ${FRONTEND_IMAGE}:latest

# 3. Actualizar VERSION file
print_info "Paso 3/5: Actualizando archivo VERSION..."
echo "$NEW_VERSION" > "$VERSION_FILE"

# 4. Actualizar deployments
print_info "Paso 4/5: Actualizando deployments..."
sed -i "s|image: ${BACKEND_IMAGE}:v.*|image: ${BACKEND_IMAGE}:v${NEW_VERSION}|g" "$BACKEND_DEPLOYMENT"
sed -i "s|image: ${BACKEND_IMAGE}:latest|image: ${BACKEND_IMAGE}:v${NEW_VERSION}|g" "$BACKEND_DEPLOYMENT"

sed -i "s|image: ${FRONTEND_IMAGE}:v.*|image: ${FRONTEND_IMAGE}:v${NEW_VERSION}|g" "$FRONTEND_DEPLOYMENT"
sed -i "s|image: ${FRONTEND_IMAGE}:latest|image: ${FRONTEND_IMAGE}:v${NEW_VERSION}|g" "$FRONTEND_DEPLOYMENT"

# Cambiar imagePullPolicy
sed -i "s|imagePullPolicy: Always|imagePullPolicy: IfNotPresent|g" "$BACKEND_DEPLOYMENT"
sed -i "s|imagePullPolicy: Always|imagePullPolicy: IfNotPresent|g" "$FRONTEND_DEPLOYMENT"

# 5. Commit y push a Git
print_info "Paso 5/5: Haciendo commit y push..."

git add "$VERSION_FILE" "$BACKEND_DEPLOYMENT" "$FRONTEND_DEPLOYMENT"
git commit -m "release: v${NEW_VERSION} - ${COMMIT_MESSAGE}

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

git push origin main

if [ $? -eq 0 ]; then
    print_info ""
    print_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    print_info "✅ Release v${NEW_VERSION} completado!"
    print_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    print_info ""
    print_info "📦 Backend: ${BACKEND_IMAGE}:v${NEW_VERSION}"
    print_info "📦 Frontend: ${FRONTEND_IMAGE}:v${NEW_VERSION}"
    print_info "🔄 Commit: $(git rev-parse --short HEAD)"
    print_info "📝 Mensaje: ${COMMIT_MESSAGE}"
    print_info ""
    print_warning "ArgoCD sincronizará automáticamente en ~3 minutos"
    print_warning "O puedes forzar sync desde: https://northr3nd.duckdns.org/argocd"
else
    print_error "Error al hacer push a Git"
    exit 1
fi
