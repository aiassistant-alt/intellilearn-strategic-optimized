# 🚀 Nova Sonic FastAPI Assistant

Real-time voice conversation service using Amazon Bedrock Nova Sonic, deployed on AWS ECS Fargate.

## 📋 Quick Start

### Prerequisites
- AWS CLI configured
- Docker installed
- Python 3.11+

### Local Development
```bash
# Install dependencies
pip install -r requirements.txt

# Run locally
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Deploy to AWS
```bash
# Build and push Docker image
docker build -t assistant-implementation .
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 076276934311.dkr.ecr.us-east-1.amazonaws.com
docker tag assistant-implementation:latest 076276934311.dkr.ecr.us-east-1.amazonaws.com/assistant-implementation:latest
docker push 076276934311.dkr.ecr.us-east-1.amazonaws.com/assistant-implementation:latest

# Update ECS service
aws ecs update-service --cluster assistant-implementation-cluster --service assistant-implementation-service --force-new-deployment
```

## 🔗 Endpoints

- **Health**: `GET /health`
- **WebSocket**: `WS /ws`
- **Metrics**: `GET /metrics`

## 📊 Architecture

```
WebSocket Client → ALB → ECS Fargate → Nova Sonic
                            ↓
                    ElastiCache Redis
```

## 🔧 Configuration

All configuration is done through environment variables:

- `AWS_REGION`: AWS region (default: us-east-1)
- `REDIS_HOST`: Redis endpoint (optional)
- `ENVIRONMENT`: Environment name (production/development)

## 📈 Monitoring

```bash
# View logs
aws logs tail /ecs/assistant-implementation --follow

# Check service status
aws ecs describe-services --cluster assistant-implementation-cluster --services assistant-implementation-service

# Monitor targets
aws elbv2 describe-target-health --target-group-arn arn:aws:elasticloadbalancing:us-east-1:076276934311:targetgroup/assistant-impl-tg/155f0d4c2d5a88d8
```

## 🧪 Testing

```python
# Test WebSocket connection
import asyncio
import websockets

async def test():
    uri = "ws://assistant-impl-alb-1961690535.us-east-1.elb.amazonaws.com/ws"
    async with websockets.connect(uri) as ws:
        await ws.send('{"type":"initialize_session","authToken":"test"}')
        response = await ws.recv()
        print(response)

asyncio.run(test())
```

## 📝 API Documentation

### WebSocket Messages

#### Initialize Session
```json
{
  "type": "initialize_session",
  "authToken": "jwt_token"
}
```

#### Audio Input
```json
{
  "type": "audio_input",
  "sessionId": "session_id",
  "audioData": "base64_encoded_pcm"
}
```

#### Text Input
```json
{
  "type": "text_input",
  "sessionId": "session_id",
  "text": "Hello Nova Sonic"
}
```

## 🚀 Performance

- **Latency**: <250ms p95
- **Concurrent Sessions**: 500+ tested
- **Memory**: ~1.2GB per container
- **CPU**: ~15% average usage

## 📞 Support

For issues or questions, check the main documentation at `/ARCHITECTURE_MASTER.md`