# 📁 Intellilearn Project Structure

**Author**: Luis Arturo Parra - Telmo AI  
**Updated**: 2025-09-10  
**Purpose**: Organized and clean project structure documentation

## 🏗️ **MAIN STRUCTURE (ACTIVE)**

```
intellilearn-by-telmo-ai/
├── app/                     # ✅ ACTIVE - Next.js 15 App Router
├── components/              # ✅ ACTIVE - React components  
├── lib/                     # ✅ ACTIVE - Core libraries
│   ├── services/           # 🎯 PRIMARY - Active services
│   ├── contexts/           # React contexts
│   └── utils/             # Utility functions
├── public/                  # ✅ ACTIVE - Static assets
├── styles/                  # ✅ ACTIVE - CSS styles
├── hooks/                   # ✅ ACTIVE - React hooks
├── infrastructure/          # ✅ ACTIVE - AWS & deployment
├── docs/                    # ✅ ACTIVE - Documentation
└── aws-services/           # 📦 BACKUP - Alternative services
```

## 🔄 **BACKUP STRUCTURE (REFERENCE)**

```
frontend/                    # 📦 BACKUP - Complete duplicate structure
├── app/                    # Same as /app/ (backup)
├── components/             # Same as /components/ (backup)  
├── public/                 # Same as /public/ (backup)
├── styles/                 # Same as /styles/ (backup)
└── hooks/                  # Same as /hooks/ (backup)
```

## 🎯 **SERVICE ORGANIZATION**

### **Primary Services** (ACTIVE)
- **Location**: `/lib/services/`
- **Usage**: Main application services
- **Files**:
  - `novaConversationalService.ts` - Nova Sonic integration
  - `novaConfigService.ts` - DynamoDB configuration
  - `awsBedrockService.ts` - Bedrock AI services
  - `awsCredentialsService.ts` - AWS authentication
  - `courseService.ts` - Course management
  - `s3ContentService.ts` - S3 storage

### **Backup Services** (REFERENCE)  
- **Location**: `/aws-services/`
- **Usage**: Alternative implementations
- **Purpose**: Backup and reference code

## 📊 **CONFIGURATION**

### **Nova Sonic Configuration**
- **DynamoDB Table**: `intellilearn-nova-config`
- **Service**: `novaConfigService.ts`
- **Location**: `/lib/services/novaConfigService.ts`

### **Build Configuration**
- **Next.js Config**: `next.config.js` (points to active structure)
- **TypeScript**: `tsconfig.json` (includes active paths)
- **Tailwind**: `tailwind.config.js` (scans active folders)

## 🚀 **DEPLOYMENT**

### **Active Deployment**
- **Source**: Root level folders (`/app/`, `/components/`, etc.)
- **Build Output**: `/out/` directory
- **Services**: `/lib/services/` 

### **Scripts**
- **Location**: `/infrastructure/deployment/`
- **Files**: 
  - `deploy.sh` - Linux/Mac deployment
  - `deploy.ps1` - Windows deployment
  - `copy-assets.js` - Asset preparation

## ⚠️ **IMPORTANT NOTES**

1. **Active Development**: Use root level folders
2. **Backup Reference**: `/frontend/` folder for reference only
3. **Service Priority**: `/lib/services/` is primary, `/aws-services/` is backup
4. **Documentation**: Always update this file when structure changes

## 🔧 **MAINTENANCE**

### **Regular Tasks**
- Verify no conflicts between active/backup folders
- Update documentation when adding new services
- Clean `/out/` directory periodically
- Monitor `logsnova.txt` file size

### **Cleanup Commands**
```bash
# Clean build output
rm -rf out/

# Clean dependencies
rm -rf node_modules/
npm install

# Clean logs
rm -f logsnova.txt
```

---

**✅ CONCLUSION**: Current structure is optimized for development with clear separation between active code and backup references.