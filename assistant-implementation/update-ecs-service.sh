#!/bin/bash

# Update ECS service with new image

echo "📦 Updating ECS service with Nova Sonic Python 3.12..."

# Variables
CLUSTER_NAME="assistant-implementation-cluster"
SERVICE_NAME="assistant-implementation-service"
TASK_FAMILY="assistant-implementation"
REGION="us-east-1"
IMAGE_URI="076276934311.dkr.ecr.us-east-1.amazonaws.com/assistant-implementation:latest"

# Force new deployment
echo "🔄 Forcing new deployment..."
aws ecs update-service \
    --cluster $CLUSTER_NAME \
    --service $SERVICE_NAME \
    --force-new-deployment \
    --region $REGION

echo "⏳ Waiting for service to stabilize..."
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
    --query 'services[0].{Status:status,RunningCount:runningCount,DesiredCount:desiredCount,PendingCount:pendingCount}' \
    --output table

# Get ALB DNS
ALB_DNS=$(aws elbv2 describe-load-balancers \
    --names assistant-impl-alb \
    --query 'LoadBalancers[0].DNSName' \
    --output text 2>/dev/null || echo "ALB not found")

echo ""
echo "✅ Deployment complete!"
echo "🔗 WebSocket endpoint: ws://$ALB_DNS/ws"
echo ""
echo "Test with: wscat -c ws://$ALB_DNS/ws"