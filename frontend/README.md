# 🎨 Frontend - Intellilearn

## 📋 **QUÉ CONTIENE ESTA CARPETA**

Esta carpeta contiene **todos los componentes del Frontend** - la interfaz de usuario que ven los usuarios.

### 🛠️ **Tecnologías Principales**
- **Next.js 15** - Framework React para aplicaciones web
- **React 19** - Biblioteca para interfaces de usuario
- **TypeScript** - JavaScript con tipos estáticos
- **TailwindCSS** - Framework CSS utility-first
- **Diseño Neumórfico** - Estilo visual moderno y elegante

## 📁 **Estructura del Frontend**

```
frontend/
├── 📄 app/                    # PÁGINAS (Next.js App Router)
│   ├── auth/                  # Páginas de login/registro
│   ├── dashboard/            # Dashboard principal y subpáginas
│   ├── layout.tsx            # Layout principal de la app
│   └── page.tsx              # Página de inicio
│
├── 🧩 components/            # COMPONENTES REACT
│   ├── common/               # Componentes reutilizables
│   ├── course/              # Componentes específicos de cursos
│   ├── dashboard/           # Componentes del dashboard
│   ├── landingPage/         # Componentes de la landing page
│   └── layouts/             # Layouts reutilizables
│
├── 🪝 hooks/                 # CUSTOM HOOKS
│   ├── useCourse.ts         # Hook para gestión de cursos
│   └── useNovaWebSocket.ts  # Hook para Nova Sonic WebSocket
│
├── 🎨 styles/                # ESTILOS CSS
│   ├── globals.css          # Estilos globales
│   ├── dark-mode.css        # Tema oscuro
│   └── light-mode.css       # Tema claro
│
└── 📁 public/                # ASSETS ESTÁTICOS
    ├── assets/              # Imágenes, iconos, videos
    ├── audio-worklet.js     # WebWorker para audio
    └── theme-handler.js     # Manejador de temas
```

## 🎯 **PROPÓSITO DE CADA SECCIÓN**

### 📄 **app/** - Páginas de la Aplicación
- **auth/**: Páginas de inicio de sesión y registro
- **dashboard/**: Panel principal con analytics, cursos, perfil, etc.
- Usa **Next.js App Router** (la forma moderna de manejar rutas)

### 🧩 **components/** - Componentes Reutilizables
- **common/**: Botones, modales, sidebar, header (usados en toda la app)
- **course/**: Todo lo relacionado con cursos y Nova Sonic Voice
- **dashboard/**: Componentes específicos del dashboard
- **layouts/**: Estructuras de página reutilizables

### 🪝 **hooks/** - Lógica Reutilizable
- Custom hooks que encapsulan lógica compleja
- Conectan componentes con servicios AWS
- Gestionan estado y efectos secundarios

### 🎨 **styles/** - Apariencia Visual
- **Diseño Neumórfico**: Sombras y profundidad elegantes
- **Dark/Light Mode**: Soporte completo para ambos temas
- **TailwindCSS**: Para utilidades de styling

### 📁 **public/** - Archivos Estáticos
- Imágenes, iconos, videos que se sirven directamente
- Scripts especiales como audio-worklet para Nova Sonic
- Manejadores de tema y favicon

## 🔄 **CÓMO FUNCIONA CON AWS**

El Frontend **NO tiene servidor propio**. Se genera como archivos estáticos y se despliega en:

```
Frontend (Build estático) → AWS S3 → AWS CloudFront → Usuario
```

### 🔗 **Conexión con Servicios AWS**
- **Autenticación**: Conecta con AWS Cognito via `/aws-services/auth/`
- **IA**: Usa Nova Sonic y Claude via `/aws-services/ai/`
- **Storage**: Sube archivos via `/aws-services/storage/`
- **Database**: Lee/escribe datos via `/aws-services/database/`

## 🚀 **COMANDOS DE DESARROLLO**

```bash
# Ejecutar desde la RAÍZ del proyecto (no desde /frontend/)
npm run dev          # Servidor de desarrollo
npm run build        # Build para producción
npm run lint         # Verificar código
```

## ⚠️ **IMPORTANTE**

1. **NO ejecutar desde /frontend/**: Los comandos se ejecutan desde la raíz
2. **Imports relativos**: Usar rutas relativas para imports entre componentes
3. **Servicios AWS**: No importar directamente, usar hooks
4. **Estilos**: Usar TailwindCSS + clases neumórficas predefinidas

---

**🎨 Frontend**: Interfaz de usuario elegante y moderna  
**👨‍💻 Autor**: Luis Arturo Parra - Telmo AI
