# 🏗️ Intellilearn - Arquitectura y Organización del Proyecto

## 📊 **CLASIFICACIÓN DE COMPONENTES**

### 🎨 **FRONTEND (Next.js Static App)**
```
/frontend/
├── /app/                    # Next.js App Router
│   ├── /auth/              # Páginas de autenticación
│   ├── /dashboard/         # Dashboard principal
│   └── layout.tsx          # Layout principal
├── /components/            # Componentes React
│   ├── /ui/               # Componentes UI básicos
│   ├── /course/           # Componentes específicos de cursos
│   ├── /dashboard/        # Componentes del dashboard
│   └── /common/           # Componentes compartidos
├── /hooks/                # React Custom Hooks
├── /styles/               # CSS y estilos
└── /public/               # Assets estáticos
```

### ☁️ **AWS SERVICES (Serverless Architecture)**
```
/aws-services/
├── /lib/
│   ├── /auth/             # AWS Cognito integration
│   ├── /ai/               # AWS Bedrock (Nova Sonic, Claude)
│   ├── /storage/          # AWS S3 services
│   ├── /database/         # AWS DynamoDB services
│   └── /utils/            # AWS utilities y helpers
└── /config/               # AWS configuration
```

### 🚀 **DEPLOYMENT & INFRASTRUCTURE**
```
/infrastructure/
├── /deployment/           # Scripts de despliegue
├── /aws-setup/           # Scripts de setup AWS
├── /security/            # Scripts de seguridad y auditoría
└── /monitoring/          # Scripts de monitoreo
```

## 🔄 **ARQUITECTURA TÉCNICA**

### **Stack Principal:**
- **Frontend**: Next.js 15 (Static Export) → S3 + CloudFront
- **Auth**: AWS Cognito (User Pool + Identity Pool)
- **AI**: AWS Bedrock (Nova Sonic + Claude 3)
- **Storage**: AWS S3 (3 buckets especializados)
- **Database**: AWS DynamoDB (8 tablas)
- **Secrets**: AWS Secrets Manager
- **CDN**: AWS CloudFront

### **Flujo de Datos:**
```
Usuario → Frontend (S3/CloudFront) → AWS Cognito → AWS Bedrock/DynamoDB → Response
```

## 📁 **NUEVA ESTRUCTURA PROPUESTA**

```
intellilearn-by-telmo-ai/
├── 🎨 frontend/                    # TODO LO RELACIONADO CON UI/UX
│   ├── app/                        # Next.js pages
│   ├── components/                 # React components  
│   ├── hooks/                      # Custom hooks
│   ├── styles/                     # CSS/TailwindCSS
│   └── public/                     # Static assets
│
├── ☁️ aws-services/                # SERVICIOS SERVERLESS AWS
│   ├── auth/                       # Cognito services
│   ├── ai/                         # Bedrock services
│   ├── storage/                    # S3 services
│   ├── database/                   # DynamoDB services
│   └── utils/                      # AWS utilities
│
├── 🚀 infrastructure/              # DEVOPS Y DEPLOYMENT
│   ├── deployment/                 # Deploy scripts
│   ├── aws-setup/                  # Infrastructure setup
│   ├── security/                   # Security scripts
│   └── monitoring/                 # Monitoring tools
│
└── 📚 docs/                        # DOCUMENTACIÓN
    ├── api/                        # API documentation
    ├── deployment/                 # Deployment guides
    └── architecture/               # Architecture docs
```

## 🎯 **BENEFICIOS DE LA REORGANIZACIÓN**

1. **🔍 Claridad**: Separación clara entre Frontend, AWS Services, Infrastructure
2. **👥 Colaboración**: Equipos pueden trabajar independientemente
3. **🛠️ Mantenibilidad**: Código organizado por responsabilidad
4. **📖 Documentación**: Estructura autodocumentada
5. **🚀 Escalabilidad**: Fácil adición de nuevos servicios

## ⚠️ **CONSIDERACIONES IMPORTANTES**

- **No hay Backend tradicional**: Todo es serverless con AWS
- **Next.js como Frontend**: Genera build estático para S3
- **AWS Services**: Actúan como "backend" distribuido
- **Scripts de Infraestructura**: Críticos para deployment

---

**📅 Actualizado**: 2025-09-10  
**👨‍💻 Autor**: Luis Arturo Parra - Telmo AI
