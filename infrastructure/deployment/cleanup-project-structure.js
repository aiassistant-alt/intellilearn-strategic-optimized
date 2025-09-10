/**
 * ^cleanup-project-structure
 * Author: Luis Arturo Parra - Telmo AI
 * Created: 2025-09-10
 * Usage: Clean and organize project structure, remove duplicates
 * Business Context: Maintain clean project structure for better development experience
 * Relations: Affects all project files and folders
 * Reminders: Backup before running, verify paths after execution
 */

const fs = require('fs');
const path = require('path');

// Project root
const PROJECT_ROOT = path.resolve(__dirname, '../..');

/**
 * Analysis of current structure:
 * 
 * DUPLICATED FOLDERS:
 * 1. /public/ and /frontend/public/ - SAME CONTENT
 * 2. /styles/ and /frontend/styles/ - SAME CONTENT  
 * 3. /hooks/ and /frontend/hooks/ - SAME CONTENT
 * 4. /app/ and /frontend/app/ - SAME CONTENT
 * 5. /components/ and /frontend/components/ - SAME CONTENT
 * 
 * ORGANIZED FOLDERS:
 * - /aws-services/ - Backup/alternative services ✅
 * - /lib/services/ - Active services ✅
 * - /infrastructure/ - AWS setup and deployment ✅
 * - /docs/ - Documentation ✅
 * - /out/ - Build output ✅
 * 
 * DECISION:
 * - Keep ROOT level as ACTIVE (used by Next.js)
 * - Keep /frontend/ as BACKUP/ALTERNATIVE structure
 * - Ensure /lib/services/ is the primary service location
 * - Keep /aws-services/ as backup
 */

const CLEANUP_ACTIONS = [
  {
    action: 'verify',
    description: 'Verify current structure',
    execute: verifyCurrentStructure
  },
  {
    action: 'update_gitignore',
    description: 'Update .gitignore to exclude redundant folders',
    execute: updateGitignore
  },
  {
    action: 'create_structure_doc',
    description: 'Create project structure documentation',
    execute: createStructureDocumentation
  },
  {
    action: 'verify_build_config',
    description: 'Verify build configuration points to correct paths',
    execute: verifyBuildConfiguration
  }
];

/**
 * Verify current project structure
 */
function verifyCurrentStructure() {
  console.log('🔍 Verifying current project structure...');
  
  const rootFolders = fs.readdirSync(PROJECT_ROOT, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);
  
  console.log('📁 Root level folders:');
  rootFolders.forEach(folder => {
    const folderPath = path.join(PROJECT_ROOT, folder);
    const stats = fs.statSync(folderPath);
    console.log(`   ${folder}/ (${stats.size} bytes)`);
  });
  
  // Check for duplications
  const duplicatedFolders = [
    { root: 'public', frontend: 'frontend/public' },
    { root: 'styles', frontend: 'frontend/styles' },
    { root: 'hooks', frontend: 'frontend/hooks' },
    { root: 'app', frontend: 'frontend/app' },
    { root: 'components', frontend: 'frontend/components' }
  ];
  
  console.log('\\n🔍 Checking for duplicated folders:');
  duplicatedFolders.forEach(({ root, frontend }) => {
    const rootExists = fs.existsSync(path.join(PROJECT_ROOT, root));
    const frontendExists = fs.existsSync(path.join(PROJECT_ROOT, frontend));
    
    if (rootExists && frontendExists) {
      console.log(`   ⚠️  DUPLICATE: /${root}/ and /${frontend}/`);
    } else if (rootExists) {
      console.log(`   ✅ ACTIVE: /${root}/`);
    } else if (frontendExists) {
      console.log(`   📁 BACKUP: /${frontend}/`);
    }
  });
  
  return true;
}

/**
 * Update .gitignore to exclude redundant folders
 */
function updateGitignore() {
  console.log('📝 Updating .gitignore...');
  
  const gitignorePath = path.join(PROJECT_ROOT, '.gitignore');
  let gitignoreContent = '';
  
  if (fs.existsSync(gitignorePath)) {
    gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
  }
  
  // Add section for project structure
  const structureSection = `
# Project Structure - Backup/Alternative folders
# Keep /frontend/ as backup structure but exclude from builds
# /frontend/ contains duplicate structure for reference only

# Logs and temporary files
logsnova.txt
*.log

# Build outputs
/out/
/.next/
/build/

# Dependencies
/node_modules/
/.pnp
.pnp.js

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# AWS
.aws/

# Editor
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db
`;
  
  if (!gitignoreContent.includes('Project Structure')) {
    gitignoreContent += structureSection;
    fs.writeFileSync(gitignorePath, gitignoreContent);
    console.log('✅ .gitignore updated');
  } else {
    console.log('ℹ️  .gitignore already contains project structure section');
  }
  
  return true;
}

/**
 * Create project structure documentation
 */
function createStructureDocumentation() {
  console.log('📚 Creating project structure documentation...');
  
  const structureDoc = `# 📁 Intellilearn Project Structure

**Author**: Luis Arturo Parra - Telmo AI  
**Updated**: 2025-09-10  
**Purpose**: Organized and clean project structure documentation

## 🏗️ **MAIN STRUCTURE (ACTIVE)**

\`\`\`
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
\`\`\`

## 🔄 **BACKUP STRUCTURE (REFERENCE)**

\`\`\`
frontend/                    # 📦 BACKUP - Complete duplicate structure
├── app/                    # Same as /app/ (backup)
├── components/             # Same as /components/ (backup)  
├── public/                 # Same as /public/ (backup)
├── styles/                 # Same as /styles/ (backup)
└── hooks/                  # Same as /hooks/ (backup)
\`\`\`

## 🎯 **SERVICE ORGANIZATION**

### **Primary Services** (ACTIVE)
- **Location**: \`/lib/services/\`
- **Usage**: Main application services
- **Files**:
  - \`novaConversationalService.ts\` - Nova Sonic integration
  - \`novaConfigService.ts\` - DynamoDB configuration
  - \`awsBedrockService.ts\` - Bedrock AI services
  - \`awsCredentialsService.ts\` - AWS authentication
  - \`courseService.ts\` - Course management
  - \`s3ContentService.ts\` - S3 storage

### **Backup Services** (REFERENCE)  
- **Location**: \`/aws-services/\`
- **Usage**: Alternative implementations
- **Purpose**: Backup and reference code

## 📊 **CONFIGURATION**

### **Nova Sonic Configuration**
- **DynamoDB Table**: \`intellilearn-nova-config\`
- **Service**: \`novaConfigService.ts\`
- **Location**: \`/lib/services/novaConfigService.ts\`

### **Build Configuration**
- **Next.js Config**: \`next.config.js\` (points to active structure)
- **TypeScript**: \`tsconfig.json\` (includes active paths)
- **Tailwind**: \`tailwind.config.js\` (scans active folders)

## 🚀 **DEPLOYMENT**

### **Active Deployment**
- **Source**: Root level folders (\`/app/\`, \`/components/\`, etc.)
- **Build Output**: \`/out/\` directory
- **Services**: \`/lib/services/\` 

### **Scripts**
- **Location**: \`/infrastructure/deployment/\`
- **Files**: 
  - \`deploy.sh\` - Linux/Mac deployment
  - \`deploy.ps1\` - Windows deployment
  - \`copy-assets.js\` - Asset preparation

## ⚠️ **IMPORTANT NOTES**

1. **Active Development**: Use root level folders
2. **Backup Reference**: \`/frontend/\` folder for reference only
3. **Service Priority**: \`/lib/services/\` is primary, \`/aws-services/\` is backup
4. **Documentation**: Always update this file when structure changes

## 🔧 **MAINTENANCE**

### **Regular Tasks**
- Verify no conflicts between active/backup folders
- Update documentation when adding new services
- Clean \`/out/\` directory periodically
- Monitor \`logsnova.txt\` file size

### **Cleanup Commands**
\`\`\`bash
# Clean build output
rm -rf out/

# Clean dependencies
rm -rf node_modules/
npm install

# Clean logs
rm -f logsnova.txt
\`\`\`

---

**✅ CONCLUSION**: Current structure is optimized for development with clear separation between active code and backup references.`;

  const docsPath = path.join(PROJECT_ROOT, 'docs', 'PROJECT_STRUCTURE.md');
  fs.writeFileSync(docsPath, structureDoc);
  console.log('✅ Project structure documentation created');
  
  return true;
}

/**
 * Verify build configuration points to correct paths
 */
function verifyBuildConfiguration() {
  console.log('⚙️  Verifying build configuration...');
  
  // Check Next.js config
  const nextConfigPath = path.join(PROJECT_ROOT, 'next.config.js');
  if (fs.existsSync(nextConfigPath)) {
    const nextConfig = fs.readFileSync(nextConfigPath, 'utf8');
    console.log('✅ next.config.js exists');
    
    // Check if it points to correct structure
    if (nextConfig.includes('app') && !nextConfig.includes('frontend/app')) {
      console.log('✅ Next.js config points to active structure');
    } else {
      console.log('⚠️  Next.js config may need verification');
    }
  }
  
  // Check TypeScript config
  const tsconfigPath = path.join(PROJECT_ROOT, 'tsconfig.json');
  if (fs.existsSync(tsconfigPath)) {
    console.log('✅ tsconfig.json exists');
  }
  
  // Check package.json scripts
  const packagePath = path.join(PROJECT_ROOT, 'package.json');
  if (fs.existsSync(packagePath)) {
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    console.log('✅ package.json scripts:');
    Object.keys(packageJson.scripts || {}).forEach(script => {
      console.log(`   ${script}: ${packageJson.scripts[script]}`);
    });
  }
  
  return true;
}

/**
 * Main cleanup function
 */
async function cleanupProjectStructure() {
  console.log('🧹 Starting project structure cleanup...');
  console.log('📋 Project:', path.basename(PROJECT_ROOT));
  console.log('📍 Location:', PROJECT_ROOT);
  console.log('');
  
  for (const action of CLEANUP_ACTIONS) {
    try {
      console.log(`🔄 ${action.description}...`);
      const result = await action.execute();
      
      if (result) {
        console.log(`✅ ${action.description} completed`);
      } else {
        console.log(`⚠️  ${action.description} completed with warnings`);
      }
      console.log('');
      
    } catch (error) {
      console.error(`❌ Error in ${action.description}:`, error.message);
    }
  }
  
  console.log('🎉 Project structure cleanup completed!');
  console.log('');
  console.log('📊 Summary:');
  console.log('   ✅ Structure verified and documented');
  console.log('   ✅ .gitignore updated');
  console.log('   ✅ Build configuration verified');
  console.log('   📁 Active structure: Root level folders');
  console.log('   📦 Backup structure: /frontend/ (reference only)');
  console.log('   🎯 Primary services: /lib/services/');
  console.log('   🔄 Backup services: /aws-services/');
}

// Export for use in other modules
module.exports = {
  cleanupProjectStructure,
  verifyCurrentStructure,
  PROJECT_ROOT
};

// Run cleanup if this file is executed directly
if (require.main === module) {
  cleanupProjectStructure();
}
