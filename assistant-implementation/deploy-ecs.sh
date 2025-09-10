#!/bin/bash

# Nova Sonic Assistant - ECS Fargate Deployment Script
# Deploys FastAPI WebSocket server to ECS with ALB

set -e

echo "🚀 Deploying Nova Sonic Assistant to ECS Fargate..."

# Configuration
AWS_REGION="us-east-1"
AWS_ACCOUNT_ID="076276934311"
ECR_REPOSITORY="assistant-implementation"
ECS_CLUSTER="assistant-implementation-cluster"
ECS_SERVICE="assistant-implementation-service"
TASK_DEFINITION="assistant-implementation-task"
ALB_NAME="assistant-implementation-alb"
TARGET_GROUP_NAME="assistant-implementation-tg"
VPC_ID="vpc-0669ed9fa3324dfac"
SUBNET_IDS="subnet-0ebdd2103f52504b0,subnet-07e63f635dd0aec1f"

# Step 1: Create ECR repository if not exists
echo "📦 Creating ECR repository..."
aws ecr describe-repositories --repository-names $ECR_REPOSITORY --region $AWS_REGION 2>/dev/null || \
aws ecr create-repository \
    --repository-name $ECR_REPOSITORY \
    --region $AWS_REGION \
    --image-scanning-configuration scanOnPush=true

# Step 2: Build and push Docker image
echo "🔨 Building Docker image..."
docker build -t $ECR_REPOSITORY:latest .

echo "🔐 Logging into ECR..."
aws ecr get-login-password --region $AWS_REGION | \
docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

echo "📤 Pushing image to ECR..."
docker tag $ECR_REPOSITORY:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY:latest
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY:latest

# Step 3: Create ECS cluster if not exists
echo "☁️ Creating ECS cluster..."
aws ecs describe-clusters --clusters $ECS_CLUSTER --region $AWS_REGION 2>/dev/null || \
aws ecs create-cluster \
    --cluster-name $ECS_CLUSTER \
    --region $AWS_REGION \
    --capacity-providers FARGATE FARGATE_SPOT \
    --default-capacity-provider-strategy capacityProvider=FARGATE,weight=1

# Step 4: Create task execution role
echo "🔑 Creating IAM roles..."
cat > trust-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "ecs-tasks.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

aws iam create-role \
    --role-name assistant-implementation-execution-role \
    --assume-role-policy-document file://trust-policy.json \
    --region $AWS_REGION 2>/dev/null || echo "Role already exists"

aws iam attach-role-policy \
    --role-name assistant-implementation-execution-role \
    --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy

# Create task role with Bedrock permissions
aws iam create-role \
    --role-name assistant-implementation-task-role \
    --assume-role-policy-document file://trust-policy.json \
    --region $AWS_REGION 2>/dev/null || echo "Role already exists"

cat > bedrock-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel",
        "bedrock:InvokeModelWithResponseStream"
      ],
      "Resource": "arn:aws:bedrock:$AWS_REGION::foundation-model/amazon.nova-sonic-v1:0"
    },
    {
      "Effect": "Allow",
      "Action": [
        "cognito-idp:GetUser",
        "cognito-idp:AdminGetUser"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "elasticache:DescribeCacheClusters",
        "elasticache:DescribeCacheNodes"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "*"
    }
  ]
}
EOF

aws iam put-role-policy \
    --role-name assistant-implementation-task-role \
    --policy-name assistant-bedrock-policy \
    --policy-document file://bedrock-policy.json

# Step 5: Create task definition
echo "📋 Creating task definition..."
cat > task-definition.json << EOF
{
  "family": "$TASK_DEFINITION",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "2048",
  "memory": "4096",
  "executionRoleArn": "arn:aws:iam::$AWS_ACCOUNT_ID:role/assistant-implementation-execution-role",
  "taskRoleArn": "arn:aws:iam::$AWS_ACCOUNT_ID:role/assistant-implementation-task-role",
  "containerDefinitions": [
    {
      "name": "assistant-container",
      "image": "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY:latest",
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
          "value": "$AWS_REGION"
        },
        {
          "name": "ENVIRONMENT",
          "value": "production"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/assistant-implementation",
          "awslogs-region": "$AWS_REGION",
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

aws ecs register-task-definition \
    --cli-input-json file://task-definition.json \
    --region $AWS_REGION

# Step 6: Create ALB and target group
echo "🔄 Creating Application Load Balancer..."

# Create security group for ALB
ALB_SG_ID=$(aws ec2 create-security-group \
    --group-name assistant-implementation-alb-sg \
    --description "Security group for Assistant ALB" \
    --vpc-id $VPC_ID \
    --region $AWS_REGION \
    --query 'GroupId' \
    --output text 2>/dev/null || \
    aws ec2 describe-security-groups \
    --filters "Name=group-name,Values=assistant-implementation-alb-sg" \
    --query 'SecurityGroups[0].GroupId' \
    --output text)

# Allow HTTP/HTTPS and WebSocket traffic
aws ec2 authorize-security-group-ingress \
    --group-id $ALB_SG_ID \
    --protocol tcp \
    --port 80 \
    --cidr 0.0.0.0/0 \
    --region $AWS_REGION 2>/dev/null || true

aws ec2 authorize-security-group-ingress \
    --group-id $ALB_SG_ID \
    --protocol tcp \
    --port 443 \
    --cidr 0.0.0.0/0 \
    --region $AWS_REGION 2>/dev/null || true

# Create target group with WebSocket support
TARGET_GROUP_ARN=$(aws elbv2 create-target-group \
    --name $TARGET_GROUP_NAME \
    --protocol HTTP \
    --port 8000 \
    --vpc-id $VPC_ID \
    --target-type ip \
    --health-check-path /health \
    --health-check-interval-seconds 30 \
    --health-check-timeout-seconds 5 \
    --healthy-threshold-count 2 \
    --unhealthy-threshold-count 3 \
    --matcher HttpCode=200 \
    --region $AWS_REGION \
    --query 'TargetGroups[0].TargetGroupArn' \
    --output text 2>/dev/null || \
    aws elbv2 describe-target-groups \
    --names $TARGET_GROUP_NAME \
    --query 'TargetGroups[0].TargetGroupArn' \
    --output text)

# Enable stickiness for WebSocket
aws elbv2 modify-target-group-attributes \
    --target-group-arn $TARGET_GROUP_ARN \
    --attributes \
        Key=stickiness.enabled,Value=true \
        Key=stickiness.type,Value=lb_cookie \
        Key=stickiness.lb_cookie.duration_seconds,Value=86400 \
    --region $AWS_REGION

# Create ALB
ALB_ARN=$(aws elbv2 create-load-balancer \
    --name $ALB_NAME \
    --subnets $SUBNET_IDS \
    --security-groups $ALB_SG_ID \
    --scheme internet-facing \
    --type application \
    --ip-address-type ipv4 \
    --region $AWS_REGION \
    --query 'LoadBalancers[0].LoadBalancerArn' \
    --output text 2>/dev/null || \
    aws elbv2 describe-load-balancers \
    --names $ALB_NAME \
    --query 'LoadBalancers[0].LoadBalancerArn' \
    --output text)

# Create listener
aws elbv2 create-listener \
    --load-balancer-arn $ALB_ARN \
    --protocol HTTP \
    --port 80 \
    --default-actions Type=forward,TargetGroupArn=$TARGET_GROUP_ARN \
    --region $AWS_REGION 2>/dev/null || echo "Listener already exists"

# Step 7: Create ECS service
echo "🚀 Creating ECS service..."

# Create security group for ECS tasks
ECS_SG_ID=$(aws ec2 create-security-group \
    --group-name assistant-implementation-ecs-sg \
    --description "Security group for Assistant ECS tasks" \
    --vpc-id $VPC_ID \
    --region $AWS_REGION \
    --query 'GroupId' \
    --output text 2>/dev/null || \
    aws ec2 describe-security-groups \
    --filters "Name=group-name,Values=assistant-implementation-ecs-sg" \
    --query 'SecurityGroups[0].GroupId' \
    --output text)

# Allow traffic from ALB
aws ec2 authorize-security-group-ingress \
    --group-id $ECS_SG_ID \
    --protocol tcp \
    --port 8000 \
    --source-group $ALB_SG_ID \
    --region $AWS_REGION 2>/dev/null || true

# Create service
aws ecs create-service \
    --cluster $ECS_CLUSTER \
    --service-name $ECS_SERVICE \
    --task-definition $TASK_DEFINITION \
    --desired-count 2 \
    --launch-type FARGATE \
    --network-configuration "awsvpcConfiguration={subnets=[$SUBNET_IDS],securityGroups=[$ECS_SG_ID],assignPublicIp=ENABLED}" \
    --load-balancers targetGroupArn=$TARGET_GROUP_ARN,containerName=assistant-container,containerPort=8000 \
    --health-check-grace-period-seconds 60 \
    --region $AWS_REGION 2>/dev/null || \
    aws ecs update-service \
    --cluster $ECS_CLUSTER \
    --service $ECS_SERVICE \
    --task-definition $TASK_DEFINITION \
    --desired-count 2 \
    --force-new-deployment \
    --region $AWS_REGION

# Step 8: Configure auto-scaling
echo "📊 Configuring auto-scaling..."

# Register scalable target
aws application-autoscaling register-scalable-target \
    --service-namespace ecs \
    --resource-id service/$ECS_CLUSTER/$ECS_SERVICE \
    --scalable-dimension ecs:service:DesiredCount \
    --min-capacity 2 \
    --max-capacity 10 \
    --region $AWS_REGION 2>/dev/null || true

# Create scaling policy based on CPU
aws application-autoscaling put-scaling-policy \
    --policy-name assistant-cpu-scaling \
    --service-namespace ecs \
    --resource-id service/$ECS_CLUSTER/$ECS_SERVICE \
    --scalable-dimension ecs:service:DesiredCount \
    --policy-type TargetTrackingScaling \
    --target-tracking-scaling-policy-configuration '{
        "TargetValue": 70.0,
        "PredefinedMetricSpecification": {
            "PredefinedMetricType": "ECSServiceAverageCPUUtilization"
        },
        "ScaleInCooldown": 300,
        "ScaleOutCooldown": 60
    }' \
    --region $AWS_REGION 2>/dev/null || true

# Create scaling policy based on concurrent connections (custom metric)
aws application-autoscaling put-scaling-policy \
    --policy-name assistant-connection-scaling \
    --service-namespace ecs \
    --resource-id service/$ECS_CLUSTER/$ECS_SERVICE \
    --scalable-dimension ecs:service:DesiredCount \
    --policy-type TargetTrackingScaling \
    --target-tracking-scaling-policy-configuration '{
        "TargetValue": 500.0,
        "CustomizedMetricSpecification": {
            "MetricName": "ActiveConnections",
            "Namespace": "AssistantImplementation",
            "Statistic": "Average"
        },
        "ScaleInCooldown": 300,
        "ScaleOutCooldown": 60
    }' \
    --region $AWS_REGION 2>/dev/null || true

# Get ALB DNS
ALB_DNS=$(aws elbv2 describe-load-balancers \
    --load-balancer-arns $ALB_ARN \
    --query 'LoadBalancers[0].DNSName' \
    --output text)

echo "✅ Deployment complete!"
echo "📍 ALB Endpoint: http://$ALB_DNS"
echo "🔗 WebSocket Endpoint: ws://$ALB_DNS/ws"
echo ""
echo "Next steps:"
echo "1. Update CloudFront to route /ws/* to ALB: $ALB_DNS"
echo "2. Configure ElastiCache Redis endpoint in task definition"
echo "3. Set up CloudWatch dashboards for monitoring"
echo "4. Test WebSocket connection: wscat -c ws://$ALB_DNS/ws"

# Cleanup temp files
rm -f trust-policy.json bedrock-policy.json task-definition.json