# ☁️ AWS Services - Intellilearn

## 📋 **QUÉ CONTIENE ESTA CARPETA**

Esta carpeta contiene **todos los servicios AWS Serverless** que actúan como el "backend" de la aplicación.

### 🛠️ **Arquitectura Serverless**
- **AWS Cognito** - Autenticación y autorización
- **AWS Bedrock** - IA (Nova Sonic Voice + Claude 3)
- **AWS S3** - Almacenamiento de archivos
- **AWS DynamoDB** - Base de datos NoSQL
- **AWS Secrets Manager** - Gestión segura de credenciales

## 📁 **Estructura de AWS Services**

```
aws-services/
├── 🔐 auth/                    # AUTENTICACIÓN AWS COGNITO
│   ├── awsCredentialsService.ts    # Gestión de credenciales temporales
│   └── cognitoAuthService.ts       # Login/logout/registro usuarios
│
├── 🤖 ai/                      # INTELIGENCIA ARTIFICIAL
│   ├── awsBedrockService.ts        # Claude 3 para chat
│   ├── novaConversationalService.ts # Nova Sonic Voice AI
│   └── aiContentService.ts         # Generación de contenido IA
│
├── 💾 storage/                 # ALMACENAMIENTO S3
│   └── s3ContentService.ts         # Subida/descarga archivos
│
├── 🗄️ database/               # BASE DE DATOS DYNAMODB
│   └── courseService.ts            # CRUD de cursos y datos
│
├── 🛠️ utils/                  # UTILIDADES AWS
│   ├── strategicLogger.ts          # Sistema de logs optimizado
│   ├── vectorizationService.ts     # Vectorización de contenido
│   └── progressService.ts          # Seguimiento de progreso
│
└── ⚙️ config/                 # CONFIGURACIÓN
    └── config.ts                   # Variables de configuración AWS
```

## 🎯 **PROPÓSITO DE CADA SERVICIO**

### 🔐 **auth/** - Autenticación
- **awsCredentialsService.ts**: Obtiene tokens temporales de AWS
- **cognitoAuthService.ts**: Maneja login, logout, registro de usuarios
- **Cognito Identity Pool**: Convierte tokens de usuario en credenciales AWS

### 🤖 **ai/** - Inteligencia Artificial
- **awsBedrockService.ts**: Chat con Claude 3 (Haiku/Sonnet)
- **novaConversationalService.ts**: **MOTOR PRINCIPAL** de Nova Sonic Voice
- **aiContentService.ts**: Genera contenido educativo con IA

### 💾 **storage/** - Almacenamiento
- **s3ContentService.ts**: Subida de archivos, URLs firmadas, gestión de buckets
- **3 Buckets S3**: app (estático), content (archivos), vectors (embeddings)

### 🗄️ **database/** - Base de Datos
- **courseService.ts**: CRUD completo para cursos, lecciones, usuarios
- **8 Tablas DynamoDB**: Cursos, usuarios, progreso, sesiones, etc.

### 🛠️ **utils/** - Utilidades
- **strategicLogger.ts**: Sistema de logs que evita spam en consola
- **vectorizationService.ts**: Convierte texto en vectores para búsqueda
- **progressService.ts**: Tracking de progreso del estudiante

### ⚙️ **config/** - Configuración
- **config.ts**: Centraliza todas las variables de configuración AWS

## 🔄 **FLUJO DE DATOS SERVERLESS**

```
Frontend → AWS Cognito (Auth) → AWS Services → Response
    ↓
1. Usuario hace login → Cognito devuelve token
2. Token se convierte en credenciales AWS temporales  
3. Frontend llama servicios AWS directamente
4. AWS procesa y devuelve datos
5. Frontend actualiza UI
```

## 🚀 **SERVICIOS AWS EN USO**

### **Cuenta AWS**: 076276934311
### **Región**: us-east-1

| Servicio | Propósito | Configuración |
|----------|-----------|---------------|
| **Cognito User Pool** | us-east-1_wCVGHj3uH | Autenticación usuarios |
| **Cognito Identity Pool** | us-east-1:2e649222-65f2-4757-850a-c8a8b8c98ff3 | Credenciales AWS |
| **S3 Buckets** | intellilearn-app-076276934311 | Hosting + storage |
| **DynamoDB** | intellilearn-data-prod | Base de datos |
| **Bedrock** | Nova Sonic + Claude 3 | IA conversacional |
| **CloudFront** | EH7P3LG79MJHN | CDN global |
| **Secrets Manager** | intellilearn/api-keys | Credenciales seguras |

## 🔑 **CREDENCIALES Y SEGURIDAD**

### ✅ **PATRÓN SEGURO IMPLEMENTADO**
1. **Zero Hardcoded**: No hay credenciales en código
2. **AWS Secrets Manager**: Todas las API keys en vault seguro
3. **Cognito Identity Pool**: Credenciales temporales automáticas
4. **Token Refresh**: Renovación automática de tokens
5. **Least Privilege**: Permisos mínimos necesarios

### 🔄 **Flujo de Autenticación**
```
1. Usuario → Login → Cognito User Pool
2. Cognito → ID Token → Frontend
3. Frontend → fromCognitoIdentityPool() → Credenciales AWS
4. AWS Services ← Credenciales temporales ← Frontend
```

## 🧩 **INTEGRACIÓN CON FRONTEND**

### **NO importar directamente desde Frontend**
```typescript
// ❌ MAL - No hacer esto
import { courseService } from '../aws-services/database/courseService'

// ✅ BIEN - Usar hooks
import { useCourse } from '../hooks/useCourse'
```

### **Usar Custom Hooks como intermediarios**
- Los hooks abstraen la complejidad de AWS
- Manejan loading states y errores
- Proporcionan datos reactivos al Frontend

## ⚠️ **IMPORTANTE**

1. **Servicios Serverless**: No hay servidores que mantener
2. **Costos**: Solo pagas por uso (requests/storage/compute)
3. **Escalabilidad**: Auto-scaling automático
4. **Latencia**: <200ms para la mayoría de operaciones
5. **Disponibilidad**: 99.9% SLA de AWS

---

**☁️ AWS Services**: Backend serverless potente y escalable  
**👨‍💻 Autor**: Luis Arturo Parra - Telmo AI
