# 🤝 Guía de Contribución

¡Gracias por tu interés en contribuir a SSH Mobile Client!

## 🚀 Cómo contribuir

### 1. Fork y Clone

```bash
# Fork en GitHub, luego:
git clone https://github.com/tu-usuario/ssh-mobile.git
cd ssh-mobile
```

### 2. Crear rama

```bash
git checkout -b feature/mi-nueva-caracteristica
# o
git checkout -b fix/arreglar-bug
```

### 3. Instalar dependencias

```bash
npm run install:all
```

### 4. Hacer cambios

Desarrolla tu feature o arregla el bug. Asegúrate de:

- ✅ Seguir el estilo de código existente
- ✅ Comentar código complejo
- ✅ Actualizar documentación si es necesario
- ✅ Probar en móvil si afecta UI

### 5. Commit

Usa mensajes descriptivos:

```bash
git add .
git commit -m "feat: añadir soporte para autenticación de 2 factores"
# o
git commit -m "fix: corregir reconexión en iOS Safari"
```

Convención de commits:
- `feat:` - Nueva característica
- `fix:` - Corrección de bug
- `docs:` - Cambios en documentación
- `style:` - Cambios de formato (sin afectar código)
- `refactor:` - Refactorización de código
- `perf:` - Mejoras de rendimiento
- `test:` - Añadir o modificar tests
- `chore:` - Cambios en build, deps, etc.

### 6. Push y Pull Request

```bash
git push origin feature/mi-nueva-caracteristica
```

Luego abre un Pull Request en GitHub con:
- Descripción clara de los cambios
- Screenshots si afecta UI
- Referencia a issues relacionados

## 📋 Áreas de contribución

### Ideas de features

- [ ] Soporte para autenticación de 2 factores
- [ ] Transferencia de archivos (SFTP)
- [ ] Múltiples sesiones simultáneas en tabs
- [ ] Temas personalizables
- [ ] Snippets de comandos guardados
- [ ] Túneles SSH (port forwarding)
- [ ] Sincronización de conexiones entre dispositivos
- [ ] Modo landscape optimizado
- [ ] Grabación de sesiones
- [ ] Búsqueda en historial de terminal

### Mejoras conocidas

- Optimizar rendimiento en terminales con mucha salida
- Mejorar gestión de memoria en sesiones largas
- Añadir tests unitarios e integración
- Soporte para teclados físicos externos
- Mejoras de accesibilidad

## 🧪 Testing

### Manual

```bash
# Iniciar en modo desarrollo
npm run dev

# Probar en:
- Chrome móvil (Android DevTools)
- Safari móvil (iOS Simulator)
- Diferentes tamaños de pantalla
```

### Checklist de testing

- [ ] Conexión SSH funciona
- [ ] Teclado virtual responde correctamente
- [ ] Reconexión automática funciona
- [ ] PWA se instala correctamente
- [ ] Funciona en segundo plano
- [ ] Responsive en diferentes pantallas
- [ ] No hay errores en consola

## 🎨 Estilo de código

### JavaScript/React

- Usar componentes funcionales con hooks
- Preferir `const` sobre `let`
- Usar nombres descriptivos
- Comentar lógica compleja

```javascript
// ✅ Bueno
const handleKeyPress = (key) => {
  if (terminal) {
    terminal.sendKey(key);
  }
};

// ❌ Evitar
const h = (k) => {
  if (t) t.s(k);
};
```

### CSS

- Usar nombres de clase descriptivos
- Mobile-first approach
- Agrupar propiedades relacionadas

```css
/* ✅ Bueno */
.terminal-container {
  /* Layout */
  display: flex;
  flex-direction: column;

  /* Tamaño */
  width: 100%;
  height: 100vh;

  /* Colores */
  background-color: #1e1e1e;
}
```

## 📝 Documentación

Al añadir nuevas características, actualiza:

- README.md - Si afecta uso básico
- DEPLOYMENT.md - Si afecta despliegue
- Comentarios en código - Para lógica compleja

## 🐛 Reportar bugs

Abre un issue con:

1. **Descripción**: Qué ocurrió
2. **Pasos para reproducir**:
   - Paso 1
   - Paso 2
   - ...
3. **Comportamiento esperado**: Qué debería ocurrir
4. **Screenshots**: Si es visual
5. **Entorno**:
   - SO: Android 13 / iOS 16
   - Navegador: Chrome 120 / Safari 17
   - Versión de la app: 1.0.0

## ❓ Preguntas

¿Tienes dudas? Abre un issue con la etiqueta `question`.

## 📜 Código de conducta

- Se respetuoso y profesional
- Acepta críticas constructivas
- Enfócate en lo que es mejor para el proyecto
- Sé paciente con otros colaboradores

## 🙏 Agradecimientos

Todo contribuidor será añadido a la lista de agradecimientos en el README.

---

¡Gracias por hacer SSH Mobile Client mejor para todos! 🚀
