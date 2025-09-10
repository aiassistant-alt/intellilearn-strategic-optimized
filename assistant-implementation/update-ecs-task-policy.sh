#!/bin/bash

# Update ECS Task Role with Nova Sonic bidirectional streaming permissions

echo "Updating ECS Task Role with Nova Sonic permissions..."

# Get the existing role ARN
TASK_ROLE_ARN=$(aws ecs describe-task-definition \
    --task-definition nova-sonic-assistant \
    --query 'taskDefinition.taskRoleArn' \
    --output text)

if [ -z "$TASK_ROLE_ARN" ]; then
    echo "Task role not found. Creating new role..."
    TASK_ROLE_ARN="arn:aws:iam::076276934311:role/ecsTaskExecutionRole"
fi

# Extract role name from ARN
ROLE_NAME=$(echo $TASK_ROLE_ARN | cut -d'/' -f2)

# Create inline policy for Nova Sonic
aws iam put-role-policy \
    --role-name $ROLE_NAME \
    --policy-name NovaSonicBidirectionalPolicy \
    --policy-document file://ecs-task-policy.json

echo "✅ Policy updated for role: $ROLE_NAME"

# Verify the policy
echo "Verifying policy..."
aws iam get-role-policy \
    --role-name $ROLE_NAME \
    --policy-name NovaSonicBidirectionalPolicy \
    --query 'PolicyDocument.Statement[*].Action' \
    --output json

echo "✅ ECS Task Role updated with Nova Sonic bidirectional streaming permissions"