#!/bin/bash

# Cleanup Script for Lambda WebSocket Resources
# Removes old Lambda-based WebSocket implementation

echo "🧹 Cleaning up Lambda WebSocket resources..."

AWS_REGION="us-east-1"

# Step 1: Delete API Gateway WebSocket API
echo "🔌 Removing API Gateway WebSocket..."
API_ID="az79e1erja"

# Get deployments
DEPLOYMENTS=$(aws apigatewayv2 get-deployments \
    --api-id $API_ID \
    --region $AWS_REGION \
    --query 'Items[].DeploymentId' \
    --output text 2>/dev/null)

# Delete deployments
for DEPLOYMENT_ID in $DEPLOYMENTS; do
    echo "Deleting deployment: $DEPLOYMENT_ID"
    aws apigatewayv2 delete-deployment \
        --api-id $API_ID \
        --deployment-id $DEPLOYMENT_ID \
        --region $AWS_REGION 2>/dev/null || true
done

# Delete routes
ROUTES=$(aws apigatewayv2 get-routes \
    --api-id $API_ID \
    --region $AWS_REGION \
    --query 'Items[].RouteId' \
    --output text 2>/dev/null)

for ROUTE_ID in $ROUTES; do
    echo "Deleting route: $ROUTE_ID"
    aws apigatewayv2 delete-route \
        --api-id $API_ID \
        --route-id $ROUTE_ID \
        --region $AWS_REGION 2>/dev/null || true
done

# Delete integrations
INTEGRATIONS=$(aws apigatewayv2 get-integrations \
    --api-id $API_ID \
    --region $AWS_REGION \
    --query 'Items[].IntegrationId' \
    --output text 2>/dev/null)

for INTEGRATION_ID in $INTEGRATIONS; do
    echo "Deleting integration: $INTEGRATION_ID"
    aws apigatewayv2 delete-integration \
        --api-id $API_ID \
        --integration-id $INTEGRATION_ID \
        --region $AWS_REGION 2>/dev/null || true
done

# Delete API
echo "Deleting WebSocket API..."
aws apigatewayv2 delete-api \
    --api-id $API_ID \
    --region $AWS_REGION 2>/dev/null || echo "API already deleted or not found"

# Step 2: Delete Lambda functions
echo "🔧 Removing Lambda functions..."

LAMBDA_FUNCTIONS=(
    "nova-sonic-websocket-handler"
    "integration-aws-websocket-handler"
    "integration-aws-voice-streaming"
    "integration-aws-keep-warm"
)

for FUNCTION_NAME in "${LAMBDA_FUNCTIONS[@]}"; do
    echo "Deleting Lambda function: $FUNCTION_NAME"
    aws lambda delete-function \
        --function-name $FUNCTION_NAME \
        --region $AWS_REGION 2>/dev/null || echo "Function $FUNCTION_NAME not found"
done

# Step 3: Delete DynamoDB tables (optional - comment out if you want to keep data)
echo "📊 Removing DynamoDB tables..."
DYNAMODB_TABLES=(
    "NovaWebSocketConnections"
    "NovaWebSocketSessions"
    "integration-aws-websocket-connections"
)

for TABLE_NAME in "${DYNAMODB_TABLES[@]}"; do
    echo "Deleting DynamoDB table: $TABLE_NAME"
    aws dynamodb delete-table \
        --table-name $TABLE_NAME \
        --region $AWS_REGION 2>/dev/null || echo "Table $TABLE_NAME not found"
done

# Step 4: Delete IAM roles and policies
echo "🔑 Removing IAM roles..."
IAM_ROLES=(
    "nova-sonic-lambda-role"
    "integration-aws-lambda-websocket-role"
)

for ROLE_NAME in "${IAM_ROLES[@]}"; do
    echo "Deleting IAM role: $ROLE_NAME"
    
    # Detach managed policies
    ATTACHED_POLICIES=$(aws iam list-attached-role-policies \
        --role-name $ROLE_NAME \
        --query 'AttachedPolicies[].PolicyArn' \
        --output text 2>/dev/null)
    
    for POLICY_ARN in $ATTACHED_POLICIES; do
        aws iam detach-role-policy \
            --role-name $ROLE_NAME \
            --policy-arn $POLICY_ARN 2>/dev/null || true
    done
    
    # Delete inline policies
    INLINE_POLICIES=$(aws iam list-role-policies \
        --role-name $ROLE_NAME \
        --query 'PolicyNames[]' \
        --output text 2>/dev/null)
    
    for POLICY_NAME in $INLINE_POLICIES; do
        aws iam delete-role-policy \
            --role-name $ROLE_NAME \
            --policy-name $POLICY_NAME 2>/dev/null || true
    done
    
    # Delete role
    aws iam delete-role \
        --role-name $ROLE_NAME 2>/dev/null || echo "Role $ROLE_NAME not found"
done

# Step 5: Delete CloudWatch Log Groups
echo "📝 Removing CloudWatch log groups..."
LOG_GROUPS=(
    "/aws/lambda/nova-sonic-websocket-handler"
    "/aws/lambda/integration-aws-websocket-handler"
    "/aws/lambda/integration-aws-voice-streaming"
    "/aws/lambda/integration-aws-keep-warm"
)

for LOG_GROUP in "${LOG_GROUPS[@]}"; do
    echo "Deleting log group: $LOG_GROUP"
    aws logs delete-log-group \
        --log-group-name $LOG_GROUP \
        --region $AWS_REGION 2>/dev/null || echo "Log group $LOG_GROUP not found"
done

# Step 6: Update environment variables in frontend
echo "🔧 Updating frontend configuration..."
ENV_FILE="/home/themaster/Desktop/Cognia-Intellilearn-main/sherlock-ai-aws-infrastructure/Cognia-Intellilearn/.env.local"

if [ -f "$ENV_FILE" ]; then
    # Comment out old WebSocket URL
    sed -i 's/^NEXT_PUBLIC_WEBSOCKET_ENDPOINT/#NEXT_PUBLIC_WEBSOCKET_ENDPOINT/g' $ENV_FILE
    sed -i 's/^NEXT_PUBLIC_NOVA_WEBSOCKET_URL/#NEXT_PUBLIC_NOVA_WEBSOCKET_URL/g' $ENV_FILE
    
    # Add new ALB WebSocket URL (will be updated after ECS deployment)
    echo "" >> $ENV_FILE
    echo "# New ECS/ALB WebSocket endpoint (update after deployment)" >> $ENV_FILE
    echo "# NEXT_PUBLIC_NOVA_WEBSOCKET_URL=wss://your-alb-domain.com/ws" >> $ENV_FILE
fi

echo "✅ Lambda WebSocket cleanup complete!"
echo ""
echo "Resources removed:"
echo "- API Gateway WebSocket API: $API_ID"
echo "- Lambda functions for WebSocket handling"
echo "- DynamoDB tables for connections/sessions"
echo "- IAM roles and policies"
echo "- CloudWatch log groups"
echo ""
echo "Next steps:"
echo "1. Deploy the new FastAPI service to ECS: ./deploy-ecs.sh"
echo "2. Update CloudFront to route WebSocket traffic to ALB"
echo "3. Update frontend with new WebSocket URL"