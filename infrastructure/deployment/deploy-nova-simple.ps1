# Simplified Nova Sonic WebSocket Lambda Deploy Script

Write-Host "🚀 Deploying Nova Sonic WebSocket Lambda (Simplified)..." -ForegroundColor Green

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
    Write-Host "❌ Failed to get AWS Account ID. Check AWS credentials." -ForegroundColor Red
    exit 1
}
Write-Host "✅ AWS Account ID: $ACCOUNT_ID" -ForegroundColor Green

# Check if Lambda function already exists
Write-Host "🔍 Checking if Lambda function exists..." -ForegroundColor Yellow
$lambdaExists = aws lambda get-function --function-name $LAMBDA_FUNCTION_NAME 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "⚠️ Lambda function already exists. Updating..." -ForegroundColor Yellow
    
    # Update existing function
    Write-Host "📦 Updating Lambda function code..." -ForegroundColor Yellow
    aws lambda update-function-code `
        --function-name $LAMBDA_FUNCTION_NAME `
        --zip-file fileb://lambda/integration-aws-websocket-handler/integration-aws-websocket-handler.zip
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Lambda function updated successfully" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to update Lambda function" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "❌ Lambda function does not exist. Please run the full deployment script first." -ForegroundColor Red
    Write-Host "📝 Manual steps required:" -ForegroundColor Yellow
    Write-Host "   1. Create IAM role for Lambda" -ForegroundColor White
    Write-Host "   2. Create DynamoDB tables" -ForegroundColor White
    Write-Host "   3. Create Lambda function" -ForegroundColor White
    Write-Host "   4. Create API Gateway WebSocket API" -ForegroundColor White
    exit 1
}

# Package Lambda function first
Write-Host "📦 Packaging Lambda function..." -ForegroundColor Yellow
Set-Location "lambda\integration-aws-websocket-handler"

# Create deployment package
if (Test-Path "integration-aws-websocket-handler.zip") {
    Remove-Item "integration-aws-websocket-handler.zip"
}

# Create zip file
Compress-Archive -Path "index.js", "package.json", "node_modules" -DestinationPath "integration-aws-websocket-handler.zip" -Force

# Return to root directory
Set-Location "..\..\"

# Update Lambda environment variables
Write-Host "🔧 Updating Lambda environment variables..." -ForegroundColor Yellow
aws lambda update-function-configuration `
    --function-name $LAMBDA_FUNCTION_NAME `
    --environment Variables="{CONNECTIONS_TABLE=$CONNECTIONS_TABLE,SESSIONS_TABLE=$SESSIONS_TABLE,COGNITO_IDENTITY_POOL_ID=COGNITO_IDENTITY_POOL_ID_PLACEHOLDER,COGNITO_USER_POOL_ID=COGNITO_USER_POOL_ID_PLACEHOLDER,NOVA_SONIC_MODEL_ID=amazon.nova-sonic-v1:0}"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Environment variables updated" -ForegroundColor Green
} else {
    Write-Host "⚠️ Failed to update environment variables (function may still work)" -ForegroundColor Yellow
}

# Get API Gateway info
Write-Host "🌐 Getting API Gateway information..." -ForegroundColor Yellow
$API_ID = aws apigatewayv2 get-apis --query "Items[?Name=='$API_GATEWAY_NAME'].ApiId" --output text

if ([string]::IsNullOrEmpty($API_ID) -or $API_ID -eq "None") {
    Write-Host "❌ API Gateway not found. WebSocket API needs to be created manually." -ForegroundColor Red
    Write-Host "📝 Manual steps required:" -ForegroundColor Yellow
    Write-Host "   1. Create WebSocket API in API Gateway" -ForegroundColor White
    Write-Host "   2. Create routes: `$connect, `$disconnect, `$default" -ForegroundColor White
    Write-Host "   3. Create integration with Lambda function" -ForegroundColor White
    Write-Host "   4. Deploy to 'prod' stage" -ForegroundColor White
} else {
    Write-Host "✅ API Gateway found: $API_ID" -ForegroundColor Green
    
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
    Write-Host ""
    Write-Host "🌐 UPDATE YOUR FRONTEND:" -ForegroundColor Magenta
    Write-Host "   Add to .env.local: NEXT_PUBLIC_NOVA_WEBSOCKET_URL='$WEBSOCKET_URL'" -ForegroundColor White
    Write-Host ""
    
    # Save configuration
    $config = @{
        websocketUrl = $WEBSOCKET_URL
        apiGatewayId = $API_ID
        lambdaFunction = $LAMBDA_FUNCTION_NAME
        deploymentDate = (Get-Date).ToString()
    } | ConvertTo-Json -Depth 10
    
    $config | Out-File -FilePath "nova-websocket-config.json" -Encoding UTF8
    Write-Host "💾 Configuration saved to: nova-websocket-config.json" -ForegroundColor Green
}

Write-Host ""
Write-Host "🚀 Lambda function is ready for use!" -ForegroundColor Green