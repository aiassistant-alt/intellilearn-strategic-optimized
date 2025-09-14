# 🎓 Intellilearn - AI-Powered Educational Platform

**Author**: Luis Arturo Parra - Telmo AI  
**Version**: 4.0.0 - Ultra Optimized & Secure  
**Updated**: September 14, 2025  

## 🌟 Overview

Intellilearn is a cutting-edge educational platform that combines **Nova Sonic voice AI**, **AWS S3 Vectors semantic search**, and **intelligent course generation** to deliver personalized learning experiences. The platform features real-time voice interactions, AI-generated courses, and advanced semantic content discovery.

## 🚀 Live Platform

- **🌍 Production URL**: https://dwmuzl0moi5v8.cloudfront.net
- **👤 Demo Credentials**: demo@intellilearn.com / Demo2025!
- **🎤 Voice AI**: Nova Sonic bidirectional streaming (100% operational)
- **🔐 Security**: AWS Secrets Manager + Cognito Identity Pool

## 🏗️ Architecture

### Core Technologies
- **Frontend**: Next.js 15 + React 19 + TypeScript + TailwindCSS
- **Voice AI**: Amazon Nova Sonic v1 (bidirectional streaming)
- **Authentication**: AWS Cognito (User Pool + Identity Pool)
- **Storage**: AWS S3 + DynamoDB + S3 Vectors
- **AI Models**: Bedrock (Titan Text Express v1, Titan Embed Text v1)
- **Orchestration**: AWS Step Functions
- **CDN**: CloudFront (EH7P3LG79MJHN)

### AWS Infrastructure (Account: 076276934311)
```
Region: us-east-1
├── S3 Buckets
│   ├── intellilearn-app-076276934311 (Static hosting)
│   ├── intellilearn-courses-dev (Course storage)
│   └── intellilearn-vectors-076276934311 (Vector storage)
├── CloudFront: EH7P3LG79MJHN
├── Cognito User Pool: us-east-1_wCVGHj3uH
├── Identity Pool: us-east-1:2e649222-65f2-4757-850a-c8a8b8c98ff3
├── Secrets Manager: intellilearn/api-keys
├── DynamoDB: intellilearn-data-prod
└── S3 Vectors: intellilearn-vectors (courses-semantic-index)
```

## 🎯 Key Features

### 🎤 Nova Sonic Voice AI
- **Bidirectional streaming** with ultra-low latency (<250ms)
- **Voice Activity Detection** (VAD) with RMS threshold 0.015
- **Automatic audio playback** with PCM16 @ 16kHz → 24kHz
- **Session management** with automatic cleanup
- **Barge-in mechanism** for natural conversations

### 🧠 Intelligent Course Generation
- **4-Role AI System**: Course Planner, Curriculum Designer, Exercise Designer, Assessment Specialist
- **RAG-Enhanced Content**: Semantic search before generation
- **Duplicate Detection**: Automatic similarity checking
- **CEFR Level Validation**: Pedagogical guardrails
- **Auto-Correction**: Level adjustment if validation fails
- **Multi-language Support**: English, Spanish, French

### 🔍 S3 Vectors Semantic Search
- **Vector Storage**: 4 vectors per course (outline, curriculum, exercises, assessments)
- **Semantic Queries**: Natural language content discovery
- **Metadata Filtering**: By CEFR level, language, skill focus, quality
- **Content Reuse**: Intelligent replication across languages
- **Analytics**: Curricular coverage and drift detection

## 📚 Course Generation Lifecycle

### Input Parameters
```json
{
  "language": "English|Spanish|French",
  "level": "A1|A2|B1|B2|C1|C2",
  "courseType": "General English|Business|Academic",
  "duration": {"weeks": 8, "hoursPerWeek": 3}
}
```

### Generation Flow
```
1. 🔍 RAG Search → Find similar content
2. 📝 Course Planner → Generate outline with RAG enhancement
3. 🔄 Duplicate Check → Verify uniqueness (>95% similarity = variation)
4. 🎯 Level Validation → CEFR compliance check
5. 🔧 Auto-Correction → Adjust if level mismatch
6. 📊 Vector Storage → Store outline embedding
7. 🎓 Curriculum Designer → Generate detailed lessons with RAG
8. 🏋️ Exercise Designer → Create interactive exercises
9. 📊 Assessment Specialist → Design evaluations with Nova Sonic criteria
10. 💾 Course Storage → Save to S3 with complete metadata
11. 📧 Completion Notification → Notify stakeholders
```

### Output Structure
```
📁 s3://intellilearn-courses-dev/courses/{language}/{level}/
└── course-{language}-{level}-{date}.json
    ├── metadata (courseId, timestamps, config)
    ├── outlineResult (Course Planner output)
    ├── curriculumResult (Curriculum Designer output)
    ├── exercisesResult (Exercise Designer output)
    ├── assessmentsResult (Assessment Specialist output)
    └── vectorResults (S3 Vectors integration data)

📊 S3 Vectors: intellilearn-vectors/courses-semantic-index
├── outline-{language}-{level}-{courseId}
├── curriculum-{language}-{level}-{courseId}
├── exercises-{language}-{level}-{courseId}
└── assessments-{language}-{level}-{courseId}
```

## 🛠️ Development

### Prerequisites
- Node.js 18+
- AWS CLI configured
- s3vectors-embed-cli installed

### Installation
```bash
git clone <repository>
cd intellilearn-by-telmo-ai
npm install
```

### Environment Setup
```bash
# Development
cp .env.example .env.local
# Configure AWS credentials and API keys

# Production uses AWS Secrets Manager
```

### Development Server
```bash
npm run dev
# Opens http://localhost:3000
```

### Build & Deploy
```bash
# Build optimized bundle (6.6 MiB)
npm run build

# Deploy to production
aws s3 sync out/ s3://intellilearn-app-076276934311/ --delete
aws cloudfront create-invalidation --distribution-id EH7P3LG79MJHN --paths "/*"
```

## 🔧 Configuration

### Nova Sonic Parameters
```javascript
const NOVA_CONFIG = {
  VAD_THRESHOLD: 0.015,           // RMS threshold
  SILENCE_DETECTION: 2000,        // ms
  INITIAL_SILENCE: 4000,          // ms
  AUDIO_FORMAT: "PCM16",          // 16kHz mono
  OUTPUT_FORMAT: "PCM16",         // 24kHz
  FRAME_PROCESSING: 30,           // ms chunks
  MODEL: "amazon.nova-sonic-v1:0",
  VOICE: "Matthew",
  TEMPERATURE: 0.7,
  MAX_TOKENS: 1024
};
```

### S3 Vectors Configuration
```javascript
const S3_VECTORS_CONFIG = {
  BUCKET: "intellilearn-vectors",
  INDEX: "courses-semantic-index",
  DIMENSIONS: 1536,
  SIMILARITY: "cosine",
  MODEL: "amazon.titan-embed-text-v1"
};
```

## 📊 Performance Metrics

- **Build Size**: 6.6 MiB (optimized)
- **First Load JS**: ~100 KB
- **Voice Latency**: <250ms (p95)
- **CloudFront Cache**: 99.9% hit rate
- **Course Generation**: ~2 minutes average
- **Vector Search**: <100ms response time

## 🔒 Security

- **Zero Hardcoded Credentials**: All via AWS Secrets Manager
- **IAM Least Privilege**: Minimal permissions per service
- **Automatic Token Refresh**: Cognito Identity Pool pattern
- **Encrypted Storage**: S3 + DynamoDB encryption at rest
- **HTTPS Only**: CloudFront SSL/TLS termination

## 🧪 Testing

### Voice AI Testing
```bash
# Test with demo credentials
# Navigate to: https://dwmuzl0moi5v8.cloudfront.net
# Login: demo@intellilearn.com / Demo2025!
# Click voice button and start conversation
```

### Course Generation Testing
```bash
# Execute Step Function
aws stepfunctions start-execution \
  --state-machine-arn arn:aws:states:us-east-1:076276934311:stateMachine:intellilearn-visual-course-generator \
  --input '{"language":"English","level":"A2","courseType":"General English","duration":{"weeks":8,"hoursPerWeek":3}}'
```

### S3 Vectors Testing
```bash
# Query semantic content
s3vectors-embed query \
  --vector-bucket-name intellilearn-vectors \
  --index-name courses-semantic-index \
  --query-input "A2 grammar lessons" \
  --k 5
```

## 📈 Monitoring & Analytics

### CloudWatch Metrics
- Lambda execution duration
- Step Function success/failure rates
- S3 Vectors query performance
- Nova Sonic session metrics

### Application Logs
- `[VAD]` - Voice activity detection
- `[NOVA]` - Protocol events
- `[AwsBedrockService]` - AI model calls
- `📥` - Stream processing
- `🔊` - Audio playback status
- `✅` - Successful operations
- `❌` - Errors with context

## 🚀 Deployment

### Production Deployment
```bash
# Automated deployment
./infrastructure/deployment/deploy.sh

# Manual deployment
npm run build
aws s3 sync out/ s3://intellilearn-app-076276934311/ --delete
aws cloudfront create-invalidation --distribution-id EH7P3LG79MJHN --paths "/*"
```

### Infrastructure Updates
```bash
# Update Step Function
aws stepfunctions update-state-machine \
  --state-machine-arn arn:aws:states:us-east-1:076276934311:stateMachine:intellilearn-visual-course-generator \
  --definition file://course-generator/src/step-functions/enhanced-visual-course-generation-s3vectors.json

# Deploy Lambda functions
cd course-generator/src/lambda/
# Package and deploy s3vectors-search and s3vectors-store
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is proprietary software owned by Telmo AI.

## 📞 Support

- **Lead Developer**: Luis Arturo Parra
- **Company**: Telmo AI
- **Email**: support@telmoai.mx
- **Documentation**: See `/docs` directory for detailed technical documentation

---

**🎖️ Intellilearn v4.0.0** - Ultra Optimized & Secure Educational Platform with AI-Powered Course Generation and Semantic Search Capabilities.