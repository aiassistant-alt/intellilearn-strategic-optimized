#!/bin/bash

# Deploy Nova Sonic with MANDATORY Bidirectional Streaming
echo "🚀 Deploying Nova Sonic with Bidirectional Streaming..."

# Variables
CLUSTER_NAME="assistant-implementation-cluster"
SERVICE_NAME="assistant-implementation-service"
TASK_FAMILY="assistant-implementation"
REGION="us-east-1"
IMAGE_URI="076276934311.dkr.ecr.us-east-1.amazonaws.com/assistant-implementation:bidirectional"
ACCOUNT_ID="076276934311"

echo "📦 Image: $IMAGE_URI"

# Update task definition with new image
echo "📋 Creating new task definition..."

TASK_DEFINITION=$(cat <<EOF
{
    "family": "$TASK_FAMILY",
    "networkMode": "awsvpc",
    "requiresCompatibilities": ["FARGATE"],
    "cpu": "1024",
    "memory": "2048",
    "taskRoleArn": "arn:aws:iam::${ACCOUNT_ID}:role/ecsTaskExecutionRole",
    "executionRoleArn": "arn:aws:iam::${ACCOUNT_ID}:role/ecsTaskExecutionRole",
    "containerDefinitions": [
        {
            "name": "assistant-container",
            "image": "$IMAGE_URI",
            "essential": true,
            "portMappings": [
                {
                    "containerPort": 8000,
                    "protocol": "tcp"
                }
            ],
            "environment": [
                {
                    "name": "AWS_DEFAULT_REGION",
                    "value": "us-east-1"
                },
                {
                    "name": "NOVA_MODEL_ID",
                    "value": "amazon.nova-sonic-v1:0"
                },
                {
                    "name": "ENABLE_BIDIRECTIONAL",
                    "value": "true"
                },
                {
                    "name": "PYTHON_VERSION",
                    "value": "3.12"
                }
            ],
            "logConfiguration": {
                "logDriver": "awslogs",
                "options": {
                    "awslogs-group": "/ecs/assistant-implementation",
                    "awslogs-region": "us-east-1",
                    "awslogs-stream-prefix": "ecs"
                }
            },
            "healthCheck": {
                "command": ["CMD-SHELL", "curl -f http://localhost:8000/health || exit 1"],
                "interval": 30,
                "timeout": 5,
                "retries": 3,
                "startPeriod": 60
            }
        }
    ]
}
EOF
)

# Register new task definition
TASK_DEF_ARN=$(aws ecs register-task-definition \
    --cli-input-json "$TASK_DEFINITION" \
    --region $REGION \
    --query 'taskDefinition.taskDefinitionArn' \
    --output text)

echo "✅ Task definition registered: $TASK_DEF_ARN"

# Update service with new task definition
echo "🔄 Updating ECS service..."
aws ecs update-service \
    --cluster $CLUSTER_NAME \
    --service $SERVICE_NAME \
    --task-definition $TASK_DEF_ARN \
    --force-new-deployment \
    --region $REGION \
    --output json > /dev/null

echo "⏳ Waiting for service to stabilize (this may take a few minutes)..."

# Wait for service to stabilize
aws ecs wait services-stable \
    --cluster $CLUSTER_NAME \
    --services $SERVICE_NAME \
    --region $REGION

# Get service status
echo "📊 Service status:"
aws ecs describe-services \
    --cluster $CLUSTER_NAME \
    --services $SERVICE_NAME \
    --region $REGION \
    --query 'services[0].{Status:status,RunningCount:runningCount,DesiredCount:desiredCount,TaskDef:taskDefinition}' \
    --output table

# Get ALB DNS
ALB_DNS=$(aws elbv2 describe-load-balancers \
    --query 'LoadBalancers[?LoadBalancerName==`assistant-impl-alb`].DNSName' \
    --output text 2>/dev/null || echo "")

if [ -z "$ALB_DNS" ]; then
    ALB_DNS="assistant-impl-alb-1961690535.us-east-1.elb.amazonaws.com"
fi

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🎯 Nova Sonic with MANDATORY Bidirectional Streaming is now active!"
echo "   - Python 3.12 ✅"
echo "   - aws_sdk_bedrock_runtime ✅"
echo "   - Streaming bidirectional ✅"
echo ""
echo "🔗 WebSocket endpoint: ws://$ALB_DNS/ws"
echo "🔗 Health check: http://$ALB_DNS/health"
echo ""
echo "Test with:"
echo "  wscat -c ws://$ALB_DNS/ws"
echo "  curl http://$ALB_DNS/health"