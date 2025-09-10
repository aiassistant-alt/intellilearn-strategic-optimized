# Nova Sonic WebSocket Infrastructure Deployment Script
# Creates Lambda function, API Gateway WebSocket, and DynamoDB tables

Write-Host "Deploying Nova Sonic WebSocket Infrastructure..." -ForegroundColor Green

# Configuration
$LAMBDA_FUNCTION_NAME = "NovaWebSocketHandler"
$LAMBDA_ROLE_NAME = "NovaWebSocketLambdaRole"
$API_GATEWAY_NAME = "NovaWebSocketAPI"
$CONNECTIONS_TABLE = "NovaWebSocketConnections"
$SESSIONS_TABLE = "NovaWebSocketSessions"
$AWS_REGION = "us-east-1"

# Get AWS Account ID
Write-Host "Getting AWS Account ID..." -ForegroundColor Yellow
$ACCOUNT_ID = aws sts get-caller-identity --query Account --output text
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to get AWS Account ID. Check AWS credentials." -ForegroundColor Red
    exit 1
}
Write-Host "AWS Account ID: $ACCOUNT_ID" -ForegroundColor Green

# Step 1: Create IAM Role for Lambda
Write-Host ""
Write-Host "Step 1: Creating IAM Role for Lambda..." -ForegroundColor Yellow

# Create trust policy
$trustPolicy = @'
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
'@

$trustPolicy | Out-File -FilePath "lambda-trust-policy.json" -Encoding UTF8

# Create role
$roleExists = aws iam get-role --role-name $LAMBDA_ROLE_NAME 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Creating IAM role..." -ForegroundColor Cyan
    aws iam create-role --role-name $LAMBDA_ROLE_NAME --assume-role-policy-document file://lambda-trust-policy.json
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "IAM Role created successfully" -ForegroundColor Green
    } else {
        Write-Host "Failed to create IAM role" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "IAM Role already exists" -ForegroundColor Green
}

Remove-Item "lambda-trust-policy.json" -ErrorAction SilentlyContinue

# Attach basic execution policy
Write-Host "Attaching Lambda execution policy..." -ForegroundColor Cyan
aws iam attach-role-policy --role-name $LAMBDA_ROLE_NAME --policy-arn "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"

# Create custom policy for DynamoDB and Bedrock
$customPolicy = @'
{
  "Version": "2012-10-17",
  "Statement": [
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
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "execute-api:ManageConnections"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel",
        "bedrock:InvokeModelWithResponseStream",
        "bedrock:InvokeModelWithBidirectionalStream"
      ],
      "Resource": "*"
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
'@

$customPolicy | Out-File -FilePath "lambda-custom-policy.json" -Encoding UTF8

$policyExists = aws iam get-policy --policy-arn "arn:aws:iam::${ACCOUNT_ID}:policy/NovaWebSocketLambdaCustomPolicy" 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Creating custom policy..." -ForegroundColor Cyan
    aws iam create-policy --policy-name "NovaWebSocketLambdaCustomPolicy" --policy-document file://lambda-custom-policy.json
    aws iam attach-role-policy --role-name $LAMBDA_ROLE_NAME --policy-arn "arn:aws:iam::${ACCOUNT_ID}:policy/NovaWebSocketLambdaCustomPolicy"
}

Remove-Item "lambda-custom-policy.json" -ErrorAction SilentlyContinue

# Wait for role propagation
Write-Host "Waiting for IAM role to propagate..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# Step 2: Create DynamoDB Tables
Write-Host ""
Write-Host "Step 2: Creating DynamoDB Tables..." -ForegroundColor Yellow

# Create Connections table
$connectionsExists = aws dynamodb describe-table --table-name $CONNECTIONS_TABLE 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Creating Connections table..." -ForegroundColor Cyan
    aws dynamodb create-table `
        --table-name $CONNECTIONS_TABLE `
        --attribute-definitions AttributeName=connectionId,AttributeType=S `
        --key-schema AttributeName=connectionId,KeyType=HASH `
        --billing-mode PAY_PER_REQUEST
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Connections table created" -ForegroundColor Green
    } else {
        Write-Host "Failed to create Connections table" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "Connections table already exists" -ForegroundColor Green
}

# Create Sessions table
$sessionsExists = aws dynamodb describe-table --table-name $SESSIONS_TABLE 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Creating Sessions table..." -ForegroundColor Cyan
    aws dynamodb create-table `
        --table-name $SESSIONS_TABLE `
        --attribute-definitions AttributeName=sessionId,AttributeType=S `
        --key-schema AttributeName=sessionId,KeyType=HASH `
        --billing-mode PAY_PER_REQUEST
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Sessions table created" -ForegroundColor Green
    } else {
        Write-Host "Failed to create Sessions table" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "Sessions table already exists" -ForegroundColor Green
}

# Wait for tables
Write-Host "Waiting for DynamoDB tables to be ready..." -ForegroundColor Yellow
aws dynamodb wait table-exists --table-name $CONNECTIONS_TABLE
aws dynamodb wait table-exists --table-name $SESSIONS_TABLE
Write-Host "DynamoDB tables are ready" -ForegroundColor Green

# Step 3: Package and Deploy Lambda
Write-Host ""
Write-Host "Step 3: Packaging and Deploying Lambda Function..." -ForegroundColor Yellow

# Package Lambda
Set-Location "lambda\integration-aws-websocket-handler"

if (Test-Path "integration-aws-websocket-handler.zip") {
    Remove-Item "integration-aws-websocket-handler.zip"
}

Write-Host "Creating deployment package..." -ForegroundColor Cyan
Compress-Archive -Path "index.js", "package.json", "node_modules" -DestinationPath "integration-aws-websocket-handler.zip" -Force

Set-Location "..\..\"

# Create or update Lambda function
$lambdaExists = aws lambda get-function --function-name $LAMBDA_FUNCTION_NAME 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Creating Lambda function..." -ForegroundColor Cyan
    aws lambda create-function `
        --function-name $LAMBDA_FUNCTION_NAME `
        --runtime nodejs18.x `
        --role "arn:aws:iam::${ACCOUNT_ID}:role/${LAMBDA_ROLE_NAME}" `
        --handler index.handler `
        --zip-file fileb://lambda/integration-aws-websocket-handler/integration-aws-websocket-handler.zip `
        --timeout 300 `
        --memory-size 512 `
        --environment "Variables={CONNECTIONS_TABLE=$CONNECTIONS_TABLE,SESSIONS_TABLE=$SESSIONS_TABLE,COGNITO_IDENTITY_POOL_ID=COGNITO_IDENTITY_POOL_ID_PLACEHOLDER,COGNITO_USER_POOL_ID=COGNITO_USER_POOL_ID_PLACEHOLDER,NOVA_SONIC_MODEL_ID=amazon.nova-sonic-v1:0}"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Lambda function created successfully" -ForegroundColor Green
    } else {
        Write-Host "Failed to create Lambda function" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "Lambda function exists, updating code..." -ForegroundColor Green
    aws lambda update-function-code `
        --function-name $LAMBDA_FUNCTION_NAME `
        --zip-file fileb://lambda/integration-aws-websocket-handler/integration-aws-websocket-handler.zip
}

# Get Lambda ARN
$LAMBDA_ARN = aws lambda get-function --function-name $LAMBDA_FUNCTION_NAME --query Configuration.FunctionArn --output text
Write-Host "Lambda ARN: $LAMBDA_ARN" -ForegroundColor Cyan

# Step 4: Create API Gateway WebSocket
Write-Host ""
Write-Host "Step 4: Creating API Gateway WebSocket API..." -ForegroundColor Yellow

$apiExists = aws apigatewayv2 get-apis --query "Items[?Name=='$API_GATEWAY_NAME'].ApiId" --output text
if ([string]::IsNullOrEmpty($apiExists) -or $apiExists -eq "None") {
    Write-Host "Creating WebSocket API..." -ForegroundColor Cyan
    $API_ID = aws apigatewayv2 create-api `
        --name $API_GATEWAY_NAME `
        --protocol-type WEBSOCKET `
        --route-selection-expression "`$request.body.action" `
        --description "Nova Sonic WebSocket API for Intellilearn" `
        --query ApiId --output text
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "WebSocket API created: $API_ID" -ForegroundColor Green
    } else {
        Write-Host "Failed to create WebSocket API" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "WebSocket API already exists" -ForegroundColor Green
    $API_ID = $apiExists
}

Write-Host "API Gateway ID: $API_ID" -ForegroundColor Cyan

# Step 5: Create Integration
Write-Host ""
Write-Host "Step 5: Creating Lambda Integration..." -ForegroundColor Yellow

$integrations = aws apigatewayv2 get-integrations --api-id $API_ID --query "Items" --output json | ConvertFrom-Json
if ($integrations.Count -eq 0) {
    Write-Host "Creating integration..." -ForegroundColor Cyan
    $INTEGRATION_ID = aws apigatewayv2 create-integration `
        --api-id $API_ID `
        --integration-type AWS_PROXY `
        --integration-uri "arn:aws:apigateway:${AWS_REGION}:lambda:path/2015-03-31/functions/${LAMBDA_ARN}/invocations" `
        --query IntegrationId --output text
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Integration created: $INTEGRATION_ID" -ForegroundColor Green
    } else {
        Write-Host "Failed to create integration" -ForegroundColor Red
        exit 1
    }
} else {
    $INTEGRATION_ID = $integrations[0].IntegrationId
    Write-Host "Integration already exists: $INTEGRATION_ID" -ForegroundColor Green
}

# Step 6: Create Routes
Write-Host ""
Write-Host "Step 6: Creating WebSocket Routes..." -ForegroundColor Yellow

$routes = @('$connect', '$disconnect', '$default')
foreach ($route in $routes) {
    $routeExists = aws apigatewayv2 get-routes --api-id $API_ID --query "Items[?RouteKey=='$route'].RouteId" --output text
    if ([string]::IsNullOrEmpty($routeExists) -or $routeExists -eq "None") {
        Write-Host "Creating route: $route" -ForegroundColor Cyan
        aws apigatewayv2 create-route `
            --api-id $API_ID `
            --route-key $route `
            --target "integrations/$INTEGRATION_ID"
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Route created: $route" -ForegroundColor Green
        }
    } else {
        Write-Host "Route $route already exists" -ForegroundColor Green
    }
}

# Step 7: Add Lambda Permission
Write-Host ""
Write-Host "Step 7: Adding Lambda Permission..." -ForegroundColor Yellow

aws lambda add-permission `
    --function-name $LAMBDA_FUNCTION_NAME `
    --statement-id "AllowApiGatewayInvoke" `
    --action lambda:InvokeFunction `
    --principal apigateway.amazonaws.com `
    --source-arn "arn:aws:execute-api:${AWS_REGION}:${ACCOUNT_ID}:${API_ID}/*" 2>$null

Write-Host "Lambda permission configured" -ForegroundColor Green

# Step 8: Create and Deploy Stage
Write-Host ""
Write-Host "Step 8: Creating Production Stage..." -ForegroundColor Yellow

$stageExists = aws apigatewayv2 get-stages --api-id $API_ID --query "Items[?StageName=='prod'].StageName" --output text
if ([string]::IsNullOrEmpty($stageExists) -or $stageExists -eq "None") {
    Write-Host "Creating production stage..." -ForegroundColor Cyan
    aws apigatewayv2 create-stage `
        --api-id $API_ID `
        --stage-name prod `
        --description "Production stage for Nova Sonic WebSocket API"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Production stage created" -ForegroundColor Green
    }
} else {
    Write-Host "Production stage already exists" -ForegroundColor Green
}

# Create deployment
Write-Host "Creating deployment..." -ForegroundColor Cyan
aws apigatewayv2 create-deployment --api-id $API_ID --stage-name prod

# Results
$WEBSOCKET_URL = "wss://${API_ID}.execute-api.${AWS_REGION}.amazonaws.com/prod"

Write-Host ""
Write-Host "INFRASTRUCTURE DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""
Write-Host "DEPLOYMENT SUMMARY:" -ForegroundColor Cyan
Write-Host "  WebSocket URL: $WEBSOCKET_URL" -ForegroundColor White
Write-Host "  API Gateway ID: $API_ID" -ForegroundColor White
Write-Host "  Lambda Function: $LAMBDA_FUNCTION_NAME" -ForegroundColor White
Write-Host "  Lambda ARN: $LAMBDA_ARN" -ForegroundColor White
Write-Host "  DynamoDB Tables: $CONNECTIONS_TABLE, $SESSIONS_TABLE" -ForegroundColor White
Write-Host ""
Write-Host "ADD TO FRONTEND .env.local:" -ForegroundColor Magenta
Write-Host "  NEXT_PUBLIC_NOVA_WEBSOCKET_URL=$WEBSOCKET_URL" -ForegroundColor White
Write-Host ""

# Save configuration
$config = @{
    websocketUrl = $WEBSOCKET_URL
    apiGatewayId = $API_ID
    lambdaFunction = $LAMBDA_FUNCTION_NAME
    lambdaArn = $LAMBDA_ARN
    integrationId = $INTEGRATION_ID
    connectionsTable = $CONNECTIONS_TABLE
    sessionsTable = $SESSIONS_TABLE
    region = $AWS_REGION
    accountId = $ACCOUNT_ID
    deploymentDate = (Get-Date).ToString()
} | ConvertTo-Json -Depth 10

$config | Out-File -FilePath "nova-websocket-infrastructure.json" -Encoding UTF8

Write-Host "Configuration saved to: nova-websocket-infrastructure.json" -ForegroundColor Green
Write-Host ""
Write-Host "Nova Sonic WebSocket Infrastructure is ready!" -ForegroundColor Green
Write-Host ""
Write-Host "NEXT STEPS:" -ForegroundColor Yellow
Write-Host "  1. Update frontend .env.local with WebSocket URL" -ForegroundColor White
Write-Host "  2. Deploy updated frontend" -ForegroundColor White
Write-Host "  3. Test WebSocket connection" -ForegroundColor White