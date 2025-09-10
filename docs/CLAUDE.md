# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
```bash
npm run dev          # Start development server on localhost:3000
npm run build        # Build for production (Next.js static export)
npm run lint         # Run ESLint
npm start            # Start production server
```

### Deployment
```bash
# Main deployment scripts
./infrastructure/deployment/deploy.sh    # Deploy to AWS (Linux/Mac) - Builds, syncs to S3, invalidates CloudFront
./infrastructure/deployment/deploy.ps1   # Deploy to AWS (Windows)

# Alternative migration scripts  
npm run deploy       # Run migration/deploy-to-aws.sh
npm run setup        # Run migration/setup-complete-infrastructure.sh
npm run update-config # Update project configs with Python script
```

### Asset Management
```bash
npm run prepare-assets    # Copy necessary assets before build (runs infrastructure/deployment/copy-assets.js)
npm run prebuild         # Automatically runs before build
```

## Architecture Overview

### Tech Stack
- **Frontend**: Next.js 15, React 19, TypeScript, TailwindCSS with neumorphic design
- **Voice AI**: Amazon Nova Sonic v1 with bidirectional WebSocket streaming
- **Authentication**: AWS Cognito (User Pool + Identity Pool)
- **Storage**: AWS S3 (static hosting + content storage)
- **Database**: AWS DynamoDB (8 specialized tables)
- **CDN**: AWS CloudFront
- **Secrets**: AWS Secrets Manager

### Key Services Architecture

#### Voice AI System
- **lib/services/novaConversationalService.ts**: Core bidirectional streaming engine
- **lib/services/awsBedrockService.ts**: Bedrock API integration with Secrets Manager
- **components/course/VoiceSessionViewerNew.tsx**: Neumorphic voice UI component
- Uses PCM16 audio at 16kHz, processes 30ms chunks
- WebSocket latency <250ms (p95)

#### Authentication Flow
- **lib/services/awsCredentialsService.ts**: Cognito Identity Pool management
- **lib/services/cognitoAuthService.ts**: User authentication
- Automatic token refresh with fromCognitoIdentityPool() pattern
- Zero hardcoded credentials - all stored in AWS Secrets Manager

#### Content Management
- **lib/services/courseService.ts**: DynamoDB course operations
- **lib/services/s3ContentService.ts**: Presigned URL generation
- **lib/services/aiContentService.ts**: AI-powered content generation

### Project Structure
```
/app                    # Next.js App Router pages
  /auth                 # Authentication flow
  /dashboard            # Protected dashboard pages
/components             # React components
  /common              # Shared components (FloatingAssistant, Sidebar)
  /course              # Course-specific components (VoiceSessionViewerNew)
  /modules             # Feature modules
/lib                   # Core libraries and services
  /services            # AWS service integrations
  /contexts            # React contexts
/hooks                 # Custom React hooks (useCourse, useAuth)
/public                # Static assets including audio-worklet.js
/infrastructure        # Deployment and infrastructure
  /deployment          # Deploy scripts and AWS setup
/aws-services          # AWS service configurations
/frontend              # Additional frontend resources
/docs                  # Project documentation
```

### AWS Resources
- **Region**: us-east-1
- **Account**: 076276934311
- **Cognito User Pool**: us-east-1_wCVGHj3uH
- **Identity Pool**: us-east-1:2e649222-65f2-4757-850a-c8a8b8c98ff3
- **CloudFront Distribution**: EH7P3LG79MJHN
- **S3 Bucket**: intellilearn-app-076276934311

### TypeScript Configuration
- **Path Aliases**: 
  - `@/*` → root directory
  - `@frontend/*` → frontend directory
  - `@aws-services/*` → aws-services directory
  - `@infrastructure/*` → infrastructure directory
  - `@docs/*` → docs directory
- **Target**: ES2017
- **Strict Mode**: Enabled

### Security Practices
- All sensitive credentials stored in AWS Secrets Manager
- IAM roles with least privilege principle
- Cognito Identity Pool for temporary AWS credentials
- No hardcoded API keys or tokens in codebase
- AWS credentials loaded from `.env.aws` file (not committed)

### Voice AI Configuration
- Model: amazon.nova-sonic-v1:0
- Voice: Matthew
- VAD Threshold: 0.015 RMS
- Silence Detection: 2000ms
- Temperature: 0.7, Max Tokens: 1024

## Important Notes

### Build Output
- Next.js builds to `/out` directory for static export
- The `.next` directory contains build cache
- Static files are deployed to S3 bucket

### Testing 
- No test framework currently configured
- Manual testing via deployed application

### Code Patterns
- Neumorphic design system throughout UI components
- Strategic logging service for debugging (lib/services/strategicLogger.ts)
- Bidirectional WebSocket streaming for voice interactions
- Presigned URLs for secure S3 content access

### Common Tasks
When modifying voice AI features, key files to review:
- `lib/services/novaConversationalService.ts` - Core voice engine
- `components/course/VoiceSessionViewerNew.tsx` - Voice UI
- `public/audio-worklet.js` - Audio processing
- `hooks/useCourse.ts` - Course state management