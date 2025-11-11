#!/bin/bash

# Script para generar iconos PWA
# Requiere ImageMagick: sudo apt install imagemagick

cd "$(dirname "$0")/../frontend/public"

# Crear icono base SVG
cat > icon-base.svg << 'EOF'
<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" fill="#1a1a1a" rx="100"/>
  <text x="256" y="320" font-family="monospace" font-size="200" fill="#00ff00" text-anchor="middle" font-weight="bold">SSH</text>
  <rect x="100" y="380" width="312" height="10" fill="#00ff00" rx="5"/>
</svg>
EOF

# Generar iconos si ImageMagick está instalado
if command -v convert &> /dev/null; then
    echo "Generando iconos con ImageMagick..."
    convert -background none icon-base.svg -resize 192x192 logo192.png
    convert -background none icon-base.svg -resize 512x512 logo512.png
    convert -background none icon-base.svg -resize 32x32 favicon.ico
    echo "✓ Iconos generados"
else
    echo "⚠️  ImageMagick no está instalado."
    echo "   Puedes crear los iconos manualmente o instalar ImageMagick:"
    echo "   sudo apt install imagemagick  # Ubuntu/Debian"
    echo "   brew install imagemagick      # macOS"
    echo ""
    echo "   O usa una herramienta online como:"
    echo "   - https://realfavicongenerator.net/"
    echo "   - https://favicon.io/"
fi

echo ""
echo "Archivo SVG base creado: icon-base.svg"
echo "Usa este archivo para generar los iconos en las siguientes dimensiones:"
echo "  - logo192.png (192x192)"
echo "  - logo512.png (512x512)"
echo "  - favicon.ico (32x32)"
