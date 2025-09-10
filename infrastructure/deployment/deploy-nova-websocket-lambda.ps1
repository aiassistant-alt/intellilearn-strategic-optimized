# Deploy Nova Sonic WebSocket Lambda to AWS
# Creates Lambda function, API Gateway WebSocket, and DynamoDB tables

Write-Host "🚀 Deploying Nova Sonic WebSocket Lambda..." -ForegroundColor Green

# Configuration
$LAMBDA_FUNCTION_NAME = "NovaWebSocketHandler"
$LAMBDA_ROLE_NAME = "NovaWebSocketLambdaRole"
$API_GATEWAY_NAME = "NovaWebSocketAPI"
$CONNECTIONS_TABLE = "NovaWebSocketConnections"
$SESSIONS_TABLE = "NovaWebSocketSessions"
$AWS_REGION = "us-east-1"

# Get AWS Account ID
Write-Host "📋 Getting AWS Account ID..." -ForegroundColor Yellow
$ACCOUNT_ID = aws sts get-caller-identity --query Account --output text
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to get AWS Account ID" -ForegroundColor Red
    exit 1
}
Write-Host "✅ AWS Account ID: $ACCOUNT_ID" -ForegroundColor Green

# Create IAM Role for Lambda
Write-Host "🔐 Creating IAM Role for Lambda..." -ForegroundColor Yellow

$LAMBDA_TRUST_POLICY = @"
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
"@

# Create role if it doesn't exist
$roleExists = aws iam get-role --role-name $LAMBDA_ROLE_NAME 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Creating new IAM role..." -ForegroundColor Cyan
    $LAMBDA_TRUST_POLICY | Out-File -FilePath "lambda-trust-policy.json" -Encoding UTF8
    aws iam create-role --role-name $LAMBDA_ROLE_NAME --assume-role-policy-document file://lambda-trust-policy.json
    Remove-Item "lambda-trust-policy.json"
} else {
    Write-Host "✅ IAM Role already exists" -ForegroundColor Green
}

# Create IAM Policy for Lambda
Write-Host "📝 Creating IAM Policy..." -ForegroundColor Yellow

$LAMBDA_POLICY = @"
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:PutItem",
        "dynamodb:GetItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:Scan",
        "dynamodb:Query"
      ],
      "Resource": [
        "arn:aws:dynamodb:${AWS_REGION}:${ACCOUNT_ID}:table/${CONNECTIONS_TABLE}",
        "arn:aws:dynamodb:${AWS_REGION}:${ACCOUNT_ID}:table/${SESSIONS_TABLE}"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "execute-api:ManageConnections"
      ],
      "Resource": "arn:aws:execute-api:*:*:*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel",
        "bedrock:InvokeModelWithResponseStream",
        "bedrock:InvokeModelWithBidirectionalStream"
      ],
      "Resource": "arn:aws:bedrock:*::foundation-model/amazon.nova-sonic-v1:0"
    },
    {
      "Effect": "Allow",
      "Action": [
        "cognito-identity:GetCredentialsForIdentity",
        "cognito-identity:GetId"
      ],
      "Resource": "*"
    }
  ]
}
"@

$LAMBDA_POLICY | Out-File -FilePath "lambda-policy.json" -Encoding UTF8
$policyExists = aws iam get-policy --policy-arn "arn:aws:iam::${ACCOUNT_ID}:policy/NovaWebSocketLambdaPolicy" 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Creating new IAM policy..." -ForegroundColor Cyan
    aws iam create-policy --policy-name "NovaWebSocketLambdaPolicy" --policy-document file://lambda-policy.json
    aws iam attach-role-policy --role-name $LAMBDA_ROLE_NAME --policy-arn "arn:aws:iam::${ACCOUNT_ID}:policy/NovaWebSocketLambdaPolicy"
} else {
    Write-Host "✅ IAM Policy already exists" -ForegroundColor Green
}
Remove-Item "lambda-policy.json"

# Wait for role to be ready
Write-Host "⏳ Waiting for IAM role to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Create DynamoDB Tables
Write-Host "📊 Creating DynamoDB Tables..." -ForegroundColor Yellow

# Connections table
$connectionsTableExists = aws dynamodb describe-table --table-name $CONNECTIONS_TABLE 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Creating Connections table..." -ForegroundColor Cyan
    aws dynamodb create-table `
        --table-name $CONNECTIONS_TABLE `
        --attribute-definitions AttributeName=connectionId,AttributeType=S `
        --key-schema AttributeName=connectionId,KeyType=HASH `
        --billing-mode PAY_PER_REQUEST `
        --table-class STANDARD `
        --deletion-protection-enabled false
} else {
    Write-Host "✅ Connections table already exists" -ForegroundColor Green
}

# Sessions table
$sessionsTableExists = aws dynamodb describe-table --table-name $SESSIONS_TABLE 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Creating Sessions table..." -ForegroundColor Cyan
    aws dynamodb create-table `
        --table-name $SESSIONS_TABLE `
        --attribute-definitions AttributeName=sessionId,AttributeType=S `
        --key-schema AttributeName=sessionId,KeyType=HASH `
        --billing-mode PAY_PER_REQUEST `
        --table-class STANDARD `
        --deletion-protection-enabled false
} else {
    Write-Host "✅ Sessions table already exists" -ForegroundColor Green
}

# Wait for tables to be ready
Write-Host "⏳ Waiting for DynamoDB tables to be ready..." -ForegroundColor Yellow
aws dynamodb wait table-exists --table-name $CONNECTIONS_TABLE
aws dynamodb wait table-exists --table-name $SESSIONS_TABLE
Write-Host "✅ DynamoDB tables are ready" -ForegroundColor Green

# Package Lambda function
Write-Host "📦 Packaging Lambda function..." -ForegroundColor Yellow
Set-Location "lambda\integration-aws-websocket-handler"

# Install dependencies
if (Test-Path "node_modules") {
    Remove-Item -Recurse -Force "node_modules"
}
npm install --production

# Create deployment package
if (Test-Path "integration-aws-websocket-handler.zip") {
    Remove-Item "integration-aws-websocket-handler.zip"
}

# Using PowerShell Compress-Archive instead of zip command
Compress-Archive -Path "index.js", "package.json", "node_modules" -DestinationPath "integration-aws-websocket-handler.zip"

# Return to root directory
Set-Location "..\..\"

# Deploy Lambda function
Write-Host "🚀 Deploying Lambda function..." -ForegroundColor Yellow

$lambdaExists = aws lambda get-function --function-name $LAMBDA_FUNCTION_NAME 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Creating new Lambda function..." -ForegroundColor Cyan
    aws lambda create-function `
        --function-name $LAMBDA_FUNCTION_NAME `
        --runtime nodejs18.x `
        --role "arn:aws:iam::${ACCOUNT_ID}:role/${LAMBDA_ROLE_NAME}" `
        --handler index.handler `
        --zip-file fileb://lambda/integration-aws-websocket-handler/integration-aws-websocket-handler.zip `
        --timeout 300 `
        --memory-size 512 `
        --environment Variables=`{CONNECTIONS_TABLE=$CONNECTIONS_TABLE,SESSIONS_TABLE=$SESSIONS_TABLE,COGNITO_IDENTITY_POOL_ID=COGNITO_IDENTITY_POOL_ID_PLACEHOLDER,COGNITO_USER_POOL_ID=COGNITO_USER_POOL_ID_PLACEHOLDER,NOVA_SONIC_MODEL_ID=amazon.nova-sonic-v1:0`}
} else {
    Write-Host "Updating existing Lambda function..." -ForegroundColor Cyan
    aws lambda update-function-code `
        --function-name $LAMBDA_FUNCTION_NAME `
        --zip-file fileb://lambda/integration-aws-websocket-handler/integration-aws-websocket-handler.zip
        
    aws lambda update-function-configuration `
        --function-name $LAMBDA_FUNCTION_NAME `
        --environment Variables=`{CONNECTIONS_TABLE=$CONNECTIONS_TABLE,SESSIONS_TABLE=$SESSIONS_TABLE,COGNITO_IDENTITY_POOL_ID=COGNITO_IDENTITY_POOL_ID_PLACEHOLDER,COGNITO_USER_POOL_ID=COGNITO_USER_POOL_ID_PLACEHOLDER,NOVA_SONIC_MODEL_ID=amazon.nova-sonic-v1:0`}
}

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to deploy Lambda function" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Lambda function deployed successfully" -ForegroundColor Green

# Get Lambda function ARN
$LAMBDA_ARN = aws lambda get-function --function-name $LAMBDA_FUNCTION_NAME --query Configuration.FunctionArn --output text

Write-Host "📋 Lambda ARN: $LAMBDA_ARN" -ForegroundColor Cyan

# Create API Gateway WebSocket API
Write-Host "🌐 Creating API Gateway WebSocket API..." -ForegroundColor Yellow

$apiExists = aws apigatewayv2 get-apis --query "Items[?Name=='$API_GATEWAY_NAME'].ApiId" --output text 2>$null
if ([string]::IsNullOrEmpty($apiExists) -or $apiExists -eq "None") {
    Write-Host "Creating new WebSocket API..." -ForegroundColor Cyan
    $API_ID = aws apigatewayv2 create-api `
        --name $API_GATEWAY_NAME `
        --protocol-type WEBSOCKET `
        --route-selection-expression '$request.body.action' `
        --description "Nova Sonic WebSocket API for Intellilearn" `
        --query ApiId --output text
} else {
    Write-Host "✅ WebSocket API already exists" -ForegroundColor Green
    $API_ID = $apiExists
}

Write-Host "📋 API Gateway ID: $API_ID" -ForegroundColor Cyan

# Create Lambda Integration
Write-Host "🔗 Creating Lambda Integration..." -ForegroundColor Yellow

$integrationExists = aws apigatewayv2 get-integrations --api-id $API_ID --query "Items[?IntegrationType=='AWS_PROXY'].IntegrationId" --output text 2>$null
if ([string]::IsNullOrEmpty($integrationExists) -or $integrationExists -eq "None") {
    Write-Host "Creating new integration..." -ForegroundColor Cyan
    $INTEGRATION_ID = aws apigatewayv2 create-integration `
        --api-id $API_ID `
        --integration-type AWS_PROXY `
        --integration-uri "arn:aws:apigateway:${AWS_REGION}:lambda:path/2015-03-31/functions/${LAMBDA_ARN}/invocations" `
        --query IntegrationId --output text
} else {
    Write-Host "✅ Integration already exists" -ForegroundColor Green
    $INTEGRATION_ID = $integrationExists
}

Write-Host "📋 Integration ID: $INTEGRATION_ID" -ForegroundColor Cyan

# Create Routes
Write-Host "🛤️ Creating WebSocket Routes..." -ForegroundColor Yellow

$routes = @('$connect', '$disconnect', '$default')
foreach ($route in $routes) {
    $routeExists = aws apigatewayv2 get-routes --api-id $API_ID --query "Items[?RouteKey=='$route'].RouteId" --output text 2>$null
    if ([string]::IsNullOrEmpty($routeExists) -or $routeExists -eq "None") {
        Write-Host "Creating route: $route" -ForegroundColor Cyan
        aws apigatewayv2 create-route `
            --api-id $API_ID `
            --route-key $route `
            --target "integrations/$INTEGRATION_ID"
    } else {
        Write-Host "✅ Route $route already exists" -ForegroundColor Green
    }
}

# Add Lambda permission for API Gateway
Write-Host "🔐 Adding Lambda permission for API Gateway..." -ForegroundColor Yellow
aws lambda add-permission `
    --function-name $LAMBDA_FUNCTION_NAME `
    --statement-id "AllowApiGatewayInvoke" `
    --action lambda:InvokeFunction `
    --principal apigateway.amazonaws.com `
    --source-arn "arn:aws:execute-api:${AWS_REGION}:${ACCOUNT_ID}:${API_ID}/*" 2>$null

# Create and deploy stage
Write-Host "🚀 Creating and deploying stage..." -ForegroundColor Yellow

$stageExists = aws apigatewayv2 get-stages --api-id $API_ID --query "Items[?StageName=='prod'].StageName" --output text 2>$null
if ([string]::IsNullOrEmpty($stageExists) -or $stageExists -eq "None") {
    Write-Host "Creating production stage..." -ForegroundColor Cyan
    aws apigatewayv2 create-stage `
        --api-id $API_ID `
        --stage-name prod `
        --description "Production stage for Nova Sonic WebSocket API"
} else {
    Write-Host "✅ Production stage already exists" -ForegroundColor Green
}

# Create deployment
Write-Host "📤 Creating deployment..." -ForegroundColor Yellow
aws apigatewayv2 create-deployment --api-id $API_ID --stage-name prod

# Get WebSocket URL
$WEBSOCKET_URL = "wss://${API_ID}.execute-api.${AWS_REGION}.amazonaws.com/prod"

Write-Host ""
Write-Host "🎉 DEPLOYMENT SUCCESSFUL!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host ""
Write-Host "📋 DEPLOYMENT DETAILS:" -ForegroundColor Cyan
Write-Host "   🔗 WebSocket URL: $WEBSOCKET_URL" -ForegroundColor White
Write-Host "   🆔 API Gateway ID: $API_ID" -ForegroundColor White
Write-Host "   📦 Lambda Function: $LAMBDA_FUNCTION_NAME" -ForegroundColor White
Write-Host "   📊 DynamoDB Tables: $CONNECTIONS_TABLE, $SESSIONS_TABLE" -ForegroundColor White
Write-Host ""
Write-Host "📝 NEXT STEPS:" -ForegroundColor Yellow
Write-Host "   1. Update frontend .env.local with WebSocket URL" -ForegroundColor White
Write-Host "   2. Test WebSocket connection" -ForegroundColor White
Write-Host "   3. Deploy updated frontend" -ForegroundColor White
Write-Host ""
Write-Host "🌐 UPDATE YOUR .env.local FILE:" -ForegroundColor Magenta
Write-Host "   NEXT_PUBLIC_NOVA_WEBSOCKET_URL=$WEBSOCKET_URL" -ForegroundColor White
Write-Host ""

# Save configuration to file
$config = @{
    websocketUrl = $WEBSOCKET_URL
    apiGatewayId = $API_ID
    lambdaFunction = $LAMBDA_FUNCTION_NAME
    lambdaArn = $LAMBDA_ARN
    connectionsTable = $CONNECTIONS_TABLE
    sessionsTable = $SESSIONS_TABLE
    region = $AWS_REGION
    deploymentDate = (Get-Date).ToString()
} | ConvertTo-Json -Depth 10

$config | Out-File -FilePath "nova-websocket-deployment.json" -Encoding UTF8

Write-Host "💾 Configuration saved to: nova-websocket-deployment.json" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 Nova Sonic WebSocket API is ready for use!" -ForegroundColor Green