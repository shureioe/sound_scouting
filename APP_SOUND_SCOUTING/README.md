# Sound Scouting

Aplicación profesional de scouting de sonido para producciones cinematográficas. Una herramienta completa para técnicos de sonido que necesitan evaluar y documentar ubicaciones para rodajes.

## 🎯 Características Principales

- **Gestión de Proyectos**: Crea y organiza múltiples proyectos de scouting
- **Evaluación de Ubicaciones**: Registra coordenadas GPS, fotos y evaluaciones técnicas
- **Gestión Fotográfica**: Sube y organiza fotos de cada ubicación
- **Reportes Técnicos**: Genera reportes HTML detallados para compartir con el equipo
- **PWA Optimizado**: Funciona como aplicación nativa en dispositivos móviles
- **Offline First**: Sigue funcionando sin conexión a internet
- **Interfaz Intuitiva**: Diseño responsivo optimizado para trabajo en campo

## 🛠️ Stack Tecnológico

- **Frontend**: Next.js 15, React 19, TypeScript
- **Estilos**: Tailwind CSS 4, shadcn/ui
- **Base de Datos**: SQLite con Prisma ORM
- **Almacenamiento**: localStorage + Base de datos persistente
- **PWA**: Service Worker, Manifest optimizado
- **Comunicación**: Socket.IO para tiempo real

## 🚀 Instalación

### Requisitos Previos

- Node.js 18+ 
- npm o yarn

### Configuración del Proyecto

1. **Clonar el repositorio**
   ```bash
   git clone <repository-url>
   cd sound-scouting
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar la base de datos**
   ```bash
   # Generar cliente Prisma
   npx prisma generate
   
   # Crear la base de datos
   npx prisma db push
   ```

4. **Iniciar el servidor de desarrollo**
   ```bash
   npm run dev
   ```

La aplicación estará disponible en `http://localhost:3000`

## 📱 Uso de la Aplicación

### Crear un Proyecto

1. Abre la aplicación y haz clic en "Nuevo Proyecto"
2. Ingresa el nombre del proyecto
3. Comienza a agregar ubicaciones

### Evaluar Ubicaciones

Para cada ubicación puedes:

- **Registrar coordenadas GPS**: La aplicación detecta automáticamente tu ubicación
- **Tomar fotos**: Usa la cámara del dispositivo o selecciona de la galería
- **Evaluar condiciones**: Marca como "Apto", "No Apto" o "Sin Evaluar"
- **Agregar observaciones**: Registra ruidos ambientales y requisitos técnicos
- **Etiquetar**: Añade etiquetas para organización

### Generar Reportes

1. Ve a la página del proyecto
2. Haz clic en "Generar Reporte"
3. Configura los datos del técnico
4. Descarga el reporte en formato HTML

## 🔧 Configuración

### Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
DATABASE_URL="file:./dev.db"
```

### Configuración de PWA

La aplicación está configurada como PWA:

- **Manifest**: `public/manifest.json`
- **Service Worker**: `public/sw.js`
- **Iconos**: Se proveen versiones SVG (`icon-192x192.svg`, `icon-512x512.svg`, `apple-touch-icon.svg`). Si necesitas iconos PNG para compatibilidad total, genera las versiones rasterizadas correspondientes, cópialas a `public/` y descomenta las etiquetas `<link>` en `src/app/layout.tsx`.

### Base de Datos

El esquema de la base de datos se encuentra en `prisma/schema.prisma`:

- `TechnicianConfig`: Datos del técnico
- `Project`: Proyectos de scouting
- `LocationSet`: Ubicaciones evaluadas
- `LocationPhoto`: Fotos de ubicaciones
- `SoundScoutingReport`: Reportes generados

## 📁 Estructura del Proyecto

```
sound-scouting/
├── src/
│   ├── app/                 # Páginas Next.js
│   │   ├── api/            # Rutas API
│   │   ├── project/        # Páginas de proyectos
│   │   ├── report/         # Páginas de reportes
│   │   └── settings/       # Configuración
│   ├── components/         # Componentes React
│   │   ├── ui/            # Componentes shadcn/ui
│   │   └── ...            # Componentes de la aplicación
│   ├── hooks/             # Hooks personalizados
│   └── lib/               # Utilidades y configuración
├── public/                # Archivos estáticos
├── prisma/                # Esquema de base de datos
└── ...                    # Archivos de configuración
```

## 🌐 Despliegue

### Desarrollo

```bash
npm run dev
```

### Producción

```bash
# Construir la aplicación
npm run build

# Iniciar servidor de producción
npm start
```

### Base de Datos en Producción

```bash
# Aplicar migraciones
npx prisma migrate deploy

# Generar cliente Prisma
npx prisma generate
```

## 📱 Instalación en Dispositivos

### Como PWA

1. Abre la aplicación en Chrome o Safari
2. Busca la opción "Añadir a pantalla de inicio"
3. La aplicación se instalará como una app nativa

### Requisitos de PWA

- **iOS**: Safari 11.3+
- **Android**: Chrome 72+
- **Escritorio**: Chrome, Edge, Firefox

## 🔍 Troubleshooting

### Problemas Comunes

**Error de base de datos**
```bash
# Regenerar cliente Prisma
npx prisma generate

# Resetear base de datos
npx prisma db push --force-reset
```

**Problemas con PWA**
- Asegúrate de servir la aplicación sobre HTTPS
- Verifica que los archivos de manifest y service worker sean accesibles
- Limpia la caché del navegador

**Problemas con fotos**
- Verifica los permisos de la cámara
- Asegúrate de tener espacio de almacenamiento suficiente
- Revisa el tamaño máximo de archivos configurado

## 🤝 Contribuir

1. Haz fork del proyecto
2. Crea una rama para tu feature (`git checkout -b feature/amazing-feature`)
3. Commit tus cambios (`git commit -m 'Add amazing feature'`)
4. Push a la rama (`git push origin feature/amazing-feature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo LICENSE para detalles.

## 🙏 Agradecimientos

- Next.js por el framework web
- shadcn/ui por los componentes de UI
- Prisma por el ORM de base de datos
- Tailwind CSS por el sistema de diseño

## 📞 Soporte

Para soporte técnico o reportar issues:

- Crea un issue en GitHub
- Revisa la documentación
- Contacta al equipo de desarrollo

---

**Sound Scouting** - La herramienta definitiva para scouting de sonido en producciones cinematográficas.