# 🚀 Infrastructure - Intellilearn

## 📋 **QUÉ CONTIENE ESTA CARPETA**

Esta carpeta contiene **todos los scripts de infraestructura, deployment y DevOps** para gestionar la aplicación en AWS.

### 🛠️ **Herramientas DevOps**
- **Scripts de Deployment** - Automatización de despliegues
- **Setup de AWS** - Configuración inicial de recursos
- **Scripts de Seguridad** - Auditorías y limpieza
- **Monitoreo** - Scripts de monitoring y salud

## 📁 **Estructura de Infrastructure**

```
infrastructure/
├── 🚀 deployment/              # DEPLOYMENT Y DESPLIEGUE
│   ├── deploy.sh                   # Deploy principal (Linux/Mac)
│   ├── deploy.ps1                  # Deploy principal (Windows)
│   ├── copy-assets.js              # Copia assets antes del build
│   ├── aws-config.js               # Configuración AWS
│   └── verify-domain-setup.sh     # Verificación de dominio
│
├── ⚙️ aws-setup/               # SETUP INICIAL DE AWS
│   ├── setup-secrets-manager.js   # Configuración Secrets Manager
│   ├── configure-route53-domain.js # Setup DNS
│   ├── fix-cloudfront-access.js   # Permisos CloudFront
│   └── check-cognito-app-client.js # Verificación Cognito
│
├── 🔒 security/                # SEGURIDAD Y AUDITORÍA
│   ├── security-audit.sh          # Auditoría de seguridad
│   ├── security-check.sh          # Verificación de credenciales
│   ├── clean-hardcoded-credentials.sh # Limpieza de credenciales
│   └── safe-cleanup-unused-resources.ps1 # Limpieza segura
│
└── 📊 monitoring/              # MONITOREO Y OPERACIONES
    ├── verify-cognito-user.js      # Verificación de usuarios
    ├── verify-course.js            # Verificación de cursos
    ├── index-course-content.js     # Indexación de contenido
    ├── upload-course-vectors.js    # Subida de vectores
    ├── upload-user-video.js        # Subida de videos
    ├── upload-video.js             # Subida general de videos
    └── delete-old-course.js        # Limpieza de cursos obsoletos
```

## 🎯 **PROPÓSITO DE CADA SECCIÓN**

### 🚀 **deployment/** - Scripts de Despliegue

#### **Scripts Principales**
- **deploy.sh** / **deploy.ps1**: Scripts principales de deployment
  ```bash
  # Build → S3 Upload → CloudFront Invalidation
  npm run build
  aws s3 sync out/ s3://intellilearn-app-076276934311/ --delete
  aws cloudfront create-invalidation --distribution-id EH7P3LG79MJHN --paths "/*"
  ```

#### **Scripts de Soporte**
- **copy-assets.js**: Prepara assets antes del build
- **aws-config.js**: Configuración centralizada AWS
- **verify-domain-setup.sh**: Verifica configuración DNS

### ⚙️ **aws-setup/** - Configuración Inicial

#### **Setup de Servicios**
- **setup-secrets-manager.js**: Crea y configura AWS Secrets Manager
- **configure-route53-domain.js**: Setup de dominio personalizado
- **fix-cloudfront-access.js**: Corrige permisos de CloudFront
- **check-cognito-app-client.js**: Verifica configuración Cognito

### 🔒 **security/** - Seguridad y Auditoría

#### **Scripts de Seguridad**
- **security-audit.sh**: Auditoría completa de seguridad
  - Verifica credenciales hardcodeadas
  - Revisa permisos IAM
  - Valida configuración de servicios
  
- **security-check.sh**: Verificación rápida de credenciales
- **clean-hardcoded-credentials.sh**: Limpia credenciales del código
- **safe-cleanup-unused-resources.ps1**: Limpieza segura de recursos AWS

### 📊 **monitoring/** - Monitoreo y Operaciones

#### **Scripts de Verificación**
- **verify-cognito-user.js**: Verifica usuarios en Cognito
- **verify-course.js**: Valida integridad de cursos

#### **Scripts de Gestión de Contenido**
- **index-course-content.js**: Indexa contenido para búsqueda
- **upload-course-vectors.js**: Sube vectores a S3
- **upload-video.js**: Maneja subida de videos
- **delete-old-course.js**: Limpia cursos obsoletos

## 🔄 **FLUJO DE DEPLOYMENT**

### **Deployment Completo** (deploy.sh)
```bash
1. Pre-build checks         # Verificar configuración
2. npm run build           # Build de Next.js (estático)
3. S3 sync                 # Subir archivos a S3
4. CloudFront invalidation # Limpiar cache CDN
5. Health check           # Verificar deployment
```

### **Setup Inicial** (Primera vez)
```bash
1. setup-secrets-manager.js    # Configurar credenciales seguras
2. configure-route53-domain.js # Setup dominio
3. fix-cloudfront-access.js    # Permisos CloudFront
4. security-audit.sh           # Verificar seguridad
```

## 🌐 **INFRAESTRUCTURA AWS ACTUAL**

### **Recursos Desplegados**
| Recurso | ID/ARN | Propósito |
|---------|--------|-----------|
| **S3 Bucket** | intellilearn-app-076276934311 | Hosting estático |
| **CloudFront** | EH7P3LG79MJHN | CDN global |
| **Cognito User Pool** | us-east-1_wCVGHj3uH | Autenticación |
| **Cognito Identity Pool** | us-east-1:2e649222-65f2-4757-850a-c8a8b8c98ff3 | Credenciales AWS |
| **DynamoDB** | intellilearn-data-prod | Base de datos |
| **Secrets Manager** | intellilearn/api-keys | Credenciales seguras |

### **URLs de Producción**
- **App Principal**: https://dwmuzl0moi5v8.cloudfront.net
- **S3 Direct**: https://intellilearn-app-076276934311.s3.amazonaws.com
- **Test User**: demo@intellilearn.com / Demo2025!

## 🚀 **COMANDOS PRINCIPALES**

### **Deployment**
```bash
# Deploy completo (desde raíz del proyecto)
./infrastructure/deployment/deploy.sh        # Linux/Mac
./infrastructure/deployment/deploy.ps1       # Windows

# Build manual
npm run build
aws s3 sync out/ s3://intellilearn-app-076276934311/ --delete
aws cloudfront create-invalidation --distribution-id EH7P3LG79MJHN --paths "/*"
```

### **Setup Inicial**
```bash
# Configurar Secrets Manager
node infrastructure/aws-setup/setup-secrets-manager.js

# Auditoría de seguridad
bash infrastructure/security/security-audit.sh

# Verificar deployment
bash infrastructure/security/security-check.sh
```

### **Monitoreo**
```bash
# Verificar usuarios
node infrastructure/monitoring/verify-cognito-user.js

# Verificar cursos
node infrastructure/monitoring/verify-course.js

# Subir contenido
node infrastructure/monitoring/upload-course-vectors.js
```

## ⚠️ **CONSIDERACIONES IMPORTANTES**

### **Seguridad**
1. **Nunca** hardcodear credenciales en scripts
2. **Siempre** usar AWS Secrets Manager
3. **Ejecutar** security-audit.sh regularmente
4. **Verificar** permisos IAM mínimos

### **Deployment**
1. **Probar** en desarrollo antes de producción
2. **Hacer backup** antes de cambios grandes
3. **Verificar** health checks post-deployment
4. **Monitorear** métricas después del deploy

### **Costos**
1. **S3**: ~$0.023/GB/mes + requests
2. **CloudFront**: ~$0.085/GB transferido
3. **DynamoDB**: ~$0.25/GB/mes + RCU/WCU
4. **Cognito**: Gratis hasta 50,000 MAU

---

**🚀 Infrastructure**: DevOps automatizado y seguro  
**👨‍💻 Autor**: Luis Arturo Parra - Telmo AI
