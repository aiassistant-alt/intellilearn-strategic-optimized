# 🚀 Nova Sonic Assistant - Quick Deployment Guide

## Current Status

### ✅ Deployed Resources

1. **ECS Cluster**: `assistant-implementation-cluster`
2. **ECR Repository**: `076276934311.dkr.ecr.us-east-1.amazonaws.com/assistant-implementation`
3. **ALB**: `assistant-impl-alb-1961690535.us-east-1.elb.amazonaws.com`
4. **Target Group**: `assistant-impl-tg`

### 📦 Next Steps to Complete Deployment

#### 1. Build and Push Docker Image (from a machine with Docker)

```bash
# Build image
cd assistant-implementation
docker build -t assistant-implementation:latest .

# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 076276934311.dkr.ecr.us-east-1.amazonaws.com

# Tag and push
docker tag assistant-implementation:latest 076276934311.dkr.ecr.us-east-1.amazonaws.com/assistant-implementation:latest
docker push 076276934311.dkr.ecr.us-east-1.amazonaws.com/assistant-implementation:latest
```

#### 2. Create Task Definition

Save this as `task-definition.json`:

```json
{
  "family": "assistant-implementation-task",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "2048",
  "memory": "4096",
  "containerDefinitions": [
    {
      "name": "assistant-container",
      "image": "076276934311.dkr.ecr.us-east-1.amazonaws.com/assistant-implementation:latest",
      "essential": true,
      "portMappings": [
        {
          "containerPort": 8000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "AWS_REGION",
          "value": "us-east-1"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/assistant-implementation",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs",
          "awslogs-create-group": "true"
        }
      }
    }
  ]
}
```

Register it:
```bash
aws ecs register-task-definition --cli-input-json file://task-definition.json
```

#### 3. Create ECS Service

```bash
aws ecs create-service \
  --cluster assistant-implementation-cluster \
  --service-name assistant-implementation-service \
  --task-definition assistant-implementation-task \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-0ebdd2103f52504b0,subnet-07e63f635dd0aec1f],securityGroups=[sg-006d3f2ede3bd70f8],assignPublicIp=ENABLED}" \
  --load-balancers targetGroupArn=arn:aws:elasticloadbalancing:us-east-1:076276934311:targetgroup/assistant-impl-tg/155f0d4c2d5a88d8,containerName=assistant-container,containerPort=8000
```

#### 4. Update CloudFront

```bash
# Get current distribution config
aws cloudfront get-distribution-config --id E2RVIZOJAJJBRN > dist-config.json

# Edit dist-config.json to add:
# - New origin for ALB: assistant-impl-alb-1961690535.us-east-1.elb.amazonaws.com
# - New behavior for /ws* path pattern routing to ALB origin

# Update distribution
aws cloudfront update-distribution --id E2RVIZOJAJJBRN --cli-input-json file://dist-config.json
```

## 🔗 Current Endpoints

- **ALB**: http://assistant-impl-alb-1961690535.us-east-1.elb.amazonaws.com
- **WebSocket** (after ECS service): ws://assistant-impl-alb-1961690535.us-east-1.elb.amazonaws.com/ws
- **CloudFront**: https://d3m4wrd20w0beh.cloudfront.net

## 📊 Architecture Summary

```
CloudFront (d3m4wrd20w0beh.cloudfront.net)
    ↓
    ├── /* → S3 (Static React App)
    └── /ws → ALB → ECS Fargate (FastAPI WebSocket)
                         ↓
                  Amazon Bedrock Nova Sonic
```

## 🔧 Monitoring

```bash
# Check ECS service status
aws ecs describe-services \
  --cluster assistant-implementation-cluster \
  --services assistant-implementation-service

# Check ALB target health
aws elbv2 describe-target-health \
  --target-group-arn arn:aws:elasticloadbalancing:us-east-1:076276934311:targetgroup/assistant-impl-tg/155f0d4c2d5a88d8

# View ECS logs
aws logs tail /ecs/assistant-implementation --follow
```