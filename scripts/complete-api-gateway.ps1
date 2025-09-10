# Complete API Gateway WebSocket setup for Nova Sonic

Write-Host "Creating API Gateway WebSocket for Nova Sonic..." -ForegroundColor Green

$LAMBDA_ARN = "arn:aws:lambda:us-east-1:076276934311:function:NovaWebSocketHandler"
$AWS_REGION = "us-east-1"
$ACCOUNT_ID = "076276934311"

# Create API Gateway WebSocket
Write-Host "Creating WebSocket API..." -ForegroundColor Yellow
$API_ID = aws apigatewayv2 create-api `
    --name "NovaWebSocketAPI" `
    --protocol-type WEBSOCKET `
    --route-selection-expression "`$request.body.action" `
    --description "Nova Sonic WebSocket API for Intellilearn" `
    --query ApiId --output text

if ($LASTEXITCODE -eq 0) {
    Write-Host "WebSocket API created successfully: $API_ID" -ForegroundColor Green
} else {
    Write-Host "Failed to create WebSocket API" -ForegroundColor Red
    exit 1
}

# Create Integration
Write-Host "Creating Lambda integration..." -ForegroundColor Yellow
$INTEGRATION_ID = aws apigatewayv2 create-integration `
    --api-id $API_ID `
    --integration-type AWS_PROXY `
    --integration-uri "arn:aws:apigateway:${AWS_REGION}:lambda:path/2015-03-31/functions/${LAMBDA_ARN}/invocations" `
    --query IntegrationId --output text

if ($LASTEXITCODE -eq 0) {
    Write-Host "Integration created successfully: $INTEGRATION_ID" -ForegroundColor Green
} else {
    Write-Host "Failed to create integration" -ForegroundColor Red
    exit 1
}

# Create routes
$routes = @('$connect', '$disconnect', '$default')
foreach ($route in $routes) {
    Write-Host "Creating route: $route" -ForegroundColor Cyan
    aws apigatewayv2 create-route `
        --api-id $API_ID `
        --route-key $route `
        --target "integrations/$INTEGRATION_ID"
}

# Add Lambda permission
Write-Host "Adding Lambda permission for API Gateway..." -ForegroundColor Yellow
aws lambda add-permission `
    --function-name "NovaWebSocketHandler" `
    --statement-id "AllowApiGatewayInvoke" `
    --action lambda:InvokeFunction `
    --principal apigateway.amazonaws.com `
    --source-arn "arn:aws:execute-api:${AWS_REGION}:${ACCOUNT_ID}:${API_ID}/*"

# Create stage
Write-Host "Creating production stage..." -ForegroundColor Yellow
aws apigatewayv2 create-stage `
    --api-id $API_ID `
    --stage-name prod `
    --description "Production stage for Nova Sonic WebSocket API"

# Deploy
Write-Host "Creating deployment..." -ForegroundColor Yellow
aws apigatewayv2 create-deployment --api-id $API_ID --stage-name prod

# Results
$WEBSOCKET_URL = "wss://${API_ID}.execute-api.${AWS_REGION}.amazonaws.com/prod"

Write-Host ""
Write-Host "API GATEWAY WEBSOCKET DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""
Write-Host "WEBSOCKET URL: $WEBSOCKET_URL" -ForegroundColor Cyan
Write-Host "API GATEWAY ID: $API_ID" -ForegroundColor Cyan
Write-Host ""
Write-Host "ADD TO FRONTEND .env.local:" -ForegroundColor Magenta
Write-Host "NEXT_PUBLIC_NOVA_WEBSOCKET_URL=$WEBSOCKET_URL" -ForegroundColor White
Write-Host ""

# Save config
$config = @{
    websocketUrl = $WEBSOCKET_URL
    apiGatewayId = $API_ID
    lambdaArn = $LAMBDA_ARN
    integrationId = $INTEGRATION_ID
    deploymentDate = (Get-Date).ToString()
} | ConvertTo-Json

$config | Out-File -FilePath "nova-websocket-config.json" -Encoding UTF8
Write-Host "Configuration saved to: nova-websocket-config.json" -ForegroundColor Green