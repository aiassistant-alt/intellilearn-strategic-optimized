# 🎓 CognIA IntelliLearn

**Plataforma educativa avanzada con Nova Sonic Voice AI y arquitectura AWS**

## ✨ Características principales

- 🎤 **Nova Sonic Voice AI** - Conversaciones de voz bidireccionales en tiempo real (FUNCIONAL ✅)
- 🎨 **Diseño neumórfico** completo con soporte dark/light mode
- 🔐 **AWS Cognito** para autenticación segura (Identity Pool configurado)
- 🤖 **Amazon Bedrock** con Claude 3 y Nova Sonic integrados
- 📚 **Sistema de cursos dinámico** con contenido generativo
- 📊 **Dashboard completo** con analytics en tiempo real
- 📱 **Responsive design** optimizado para todos los dispositivos
- ☁️ **Infraestructura AWS** completa y escalable

## 🎯 Stack tecnológico

### Frontend
- **Next.js 15** + React 19 + TypeScript
- **TailwindCSS** + Diseño neumórfico personalizado
- **Web Audio API** + AudioWorklet para Nova Sonic
- **React Hook Form** + validación personalizada

### Backend & Cloud (AWS Account: 076276934311)
- **AWS Cognito** - Autenticación completa (User Pool + Identity Pool)
- **AWS Bedrock** - Nova Sonic + Claude 3 (Haiku/Sonnet)
- **AWS S3** - 3 buckets (app, vectors, content) 
- **AWS DynamoDB** - 8 tablas especializadas
- **AWS CloudFront** - CDN global
- **AWS Secrets Manager** - API keys seguras

### DevOps
- **Manual Deployment** con scripts bash/PowerShell
- **AWS S3** + **CloudFront** hosting estático
- **Build automático** con validación

## 🌐 URLs del proyecto

- **🌍 Aplicación**: https://dwmuzl0moi5v8.cloudfront.net
- **☁️ S3 Bucket**: `intellilearn-app-076276934311`
- **🚀 CloudFront**: `EH7P3LG79MJHN`
- **👤 Test User**: demo@intellilearn.com / Demo2025!

## 🏗️ Arquitectura AWS

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Next.js App   │───▶│   CloudFront     │───▶│     S3 Static   │
│   (Frontend)    │    │      CDN         │    │     Hosting     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │
         ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   AWS Cognito   │◀───│  Bedrock Nova    │───▶│   DynamoDB      │
│ (Auth + Tokens) │    │   Sonic Voice    │    │   (8 Tables)    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 🚀 Estado del Proyecto (Septiembre 10, 2025)

### ✅ COMPLETADO Y FUNCIONAL
1. **Nova Sonic Voice AI** - Sin errores de WebSocket ✅
2. **Autenticación AWS** - Cognito completamente configurado ✅
3. **Infraestructura** - Todos los recursos AWS operativos ✅
4. **Frontend** - Interfaz neumórfica responsive ✅
5. **Despliegue** - CloudFront + S3 funcionando ✅
6. **Limpieza** - 4,500+ archivos obsoletos archivados + 2.04GB + deps npm ✅

### 🔧 FIXES APLICADOS (Sept 2025)
- **WebSocket State Management**: Error "CLOSING or CLOSED state" resuelto
- **Stream Validation**: Validación de estado antes de enviar eventos
- **Audio Input Protection**: Verificación de sesión activa
- **Generator Safety**: Async generator con múltiples checkpoints

### 🎯 Comandos de Desarrollo
```bash
# Desarrollo
npm run dev        # Servidor local (localhost:3000)
npm run build      # Build producción (6.6 MiB, 109 archivos)
npm run lint       # Validación ESLint
npm start          # Servidor producción

# Deployment
./deploy.sh        # Deploy a AWS (Linux/Mac)
./deploy.ps1       # Deploy a AWS (Windows)

# AWS Direct Commands
aws s3 sync out/ s3://intellilearn-app-076276934311/ --delete
aws cloudfront create-invalidation --distribution-id EH7P3LG79MJHN --paths "/*"
```

### 📁 Estructura del Proyecto
```
/app                 # Next.js App Router pages
  /auth              # Flujo de autenticación
  /dashboard         # Páginas protegidas del dashboard
/components          # Componentes React reutilizables
  /common            # Componentes compartidos (FloatingAssistant, Sidebar)
  /course            # Componentes específicos de cursos
  /modules           # Módulos de características (auth, dashboard)
/lib                 # Librerías core y servicios
  /services          # Integraciones AWS (Cognito, Bedrock, S3)
/styles              # CSS global y neumórfico
/public              # Assets estáticos
/archive             # Archivos obsoletos organizados (91 archivos)
```

### 🛠️ Configuración de Desarrollo

#### Variables de Entorno (`.env.local`)
```bash
NEXT_PUBLIC_AWS_REGION=us-east-1
NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_wCVGHj3uH
NEXT_PUBLIC_COGNITO_CLIENT_ID=3je10g7unn142aimabthsps5q
NEXT_PUBLIC_COGNITO_IDENTITY_POOL_ID=us-east-1:2e649222-65f2-4757-850a-c8a8b8c98ff3
```

#### Credenciales AWS (`.env.aws`)
```bash
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
```

## 🎤 Nova Sonic Voice AI - FUNCIONAL ✅

### Características Técnicas
- **Modelo**: amazon.nova-sonic-v1:0
- **Voz**: Matthew
- **Audio**: PCM16 @ 16kHz → 24kHz
- **Temperatura**: 0.7, Max Tokens: 1024
- **Streaming**: Bidireccional tiempo real

### Estado de Integración
- ✅ Credenciales Cognito válidas
- ✅ Stream bidireccional establecido
- ✅ Audio capture VAD funcionando
- ✅ Sin errores de WebSocket
- ✅ Contexto educativo integrado

## 🔐 Recursos AWS (Cuenta: 076276934311)

### Cognito Configuration
- **User Pool**: us-east-1_wCVGHj3uH
- **Client ID**: 3je10g7unn142aimabthsps5q
- **Identity Pool**: us-east-1:2e649222-65f2-4757-850a-c8a8b8c98ff3

### Storage & Compute
- **S3 Buckets**: 
  - `intellilearn-app-076276934311` (Static hosting)
  - `intellilearn-vectors-076276934311` (Vector storage)
  - `intellilearn-content-076276934311` (Content storage)
- **CloudFront**: EH7P3LG79MJHN
- **DynamoDB**: intellilearn-data-prod + 7 tablas específicas
- **Secrets**: intellilearn/nova-sonic-config, intellilearn/api-keys
- **VPC**: vpc-0669ed9fa3324dfac

### IAM Roles
- `intellilearn-authenticated-role` - Usuarios autenticados (Bedrock, DynamoDB, S3)
- `intellilearn-unauthenticated-role` - Usuarios no autenticados (limitado)

## 📊 Métricas del Proyecto

### Organización de Código (Septiembre 10, 2025) - ULTRA OPTIMIZADA ✅
- **Archivos Activos**: 8 esenciales en root + 8 directorios core
- **Archivos Archivados**: 4,500+ archivos organizados en `/archive/`
- **Espacio Liberado**: 2.04GB + dependencias npm (4 eliminadas)
- **Dependencias Limpiadas**: @aws-sdk/client-lambda, aws-amplify, @next/font, autoprefixer
- **Servicios Optimizados**: Legacy voice services, auth duplicados, configs obsoletos
- **Estructura**: Máxima optimización - Solo código productivo y activo

### Performance Métricas
- **Build Size**: 6.6 MiB, 109 archivos
- **CloudFront**: Cache invalidado automáticamente  
- **WebSocket Latency**: <250ms (p95)
- **Voice Detection**: <30ms latency
- **Silence Detection**: 2 segundos
- **Audio Processing**: PCM16 30ms chunks

### Deployment Statistics
- **Último Deploy**: Septiembre 10, 2025
- **Build Time**: ~20 segundos
- **S3 Sync**: Automático con `--delete`
- **CloudFront**: Invalidación automática

## 🔧 Troubleshooting & Fixes

### Problemas Resueltos (Sept 2025)
1. **InvalidIdentityPoolConfigurationException**: Fixed IAM trust policy placeholder
2. **WebSocket CLOSING/CLOSED state**: Added stream state validation
3. **Cognito token expiration**: Automatic detection and refresh
4. **Audio queue overflow**: Cycle infinite fix implemented
5. **Nova Sonic authentication**: Complete Cognito Identity Pool setup

### Debugging Patterns
- `[VAD]` - Voice activity detection con valores RMS
- `[NOVA]` - Protocol events (promptStart, contentEnd, etc.)
- `📥` - Stream processing events
- `🔊` - Audio playback status
- `❌` - Errores con contexto completo
- `✅` - Operaciones exitosas

### Emergency Commands
```bash
# Check ECS status (if using WebSocket service)
aws ecs describe-services --cluster assistant-implementation-cluster --services assistant-implementation-service

# Check CloudFront
aws cloudfront get-distribution --id EH7P3LG79MJHN

# Force cache clear
aws cloudfront create-invalidation --distribution-id EH7P3LG79MJHN --paths "/*"

# Rollback deployment
git checkout HEAD~1
npm run build
./deploy.sh
```

---

**🏢 Desarrollado por Luis Arturo Parra - Telmo AI**  
**📧 Soporte**: support@telmoai.mx  
**🌟 Versión**: 4.0.0 - Ultra Optimizado, Seguro y Productivo  
**🤖 AI Assistant**: Especializado en Intellilearn con experiencia productiva  
**🎯 Estado**: 100% Funcional, Desplegado y Optimizado
