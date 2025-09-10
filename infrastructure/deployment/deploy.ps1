# CognIA IntelliLearn - Secure Deployment Script
# Security: Uses environment variables for AWS credentials

Write-Host "🚀 CognIA IntelliLearn - Secure Deployment" -ForegroundColor Cyan
Write-Host "Loading credentials from .env.local..." -ForegroundColor Yellow

# Load environment variables from .env.aws for AWS credentials
if (Test-Path ".env.aws") {
    Get-Content ".env.aws" | ForEach-Object {
        if ($_ -match "^([^#][^=]+)=(.*)$") {
            $name = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($name, $value, "Process")
            Write-Host "✅ Loaded: $name" -ForegroundColor Green
        }
    }
} else {
    Write-Host "❌ ERROR: .env.aws file not found!" -ForegroundColor Red
    Write-Host "Please create .env.aws with your AWS credentials" -ForegroundColor Red
    exit 1
}

# Validate required environment variables
$requiredVars = @(
    "AWS_ACCESS_KEY_ID",
    "AWS_SECRET_ACCESS_KEY",
    "AWS_REGION"
)

foreach ($var in $requiredVars) {
    if (-not [Environment]::GetEnvironmentVariable($var)) {
        Write-Host "❌ ERROR: Missing required environment variable: $var" -ForegroundColor Red
        exit 1
    }
}

Write-Host "✅ All required environment variables are present" -ForegroundColor Green

# Set AWS credentials from environment variables
$env:AWS_ACCESS_KEY_ID = [Environment]::GetEnvironmentVariable("AWS_ACCESS_KEY_ID")
$env:AWS_SECRET_ACCESS_KEY = [Environment]::GetEnvironmentVariable("AWS_SECRET_ACCESS_KEY")     
$env:AWS_DEFAULT_REGION = [Environment]::GetEnvironmentVariable("AWS_REGION")

Write-Host "🔐 Using credentials from environment variables" -ForegroundColor Green
Write-Host "🌎 Region: $env:AWS_DEFAULT_REGION" -ForegroundColor Green

# Build and export
Write-Host "📦 Building application..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}

# Note: Next.js with output: 'export' creates the out/ directory during build
# No separate export step needed

Write-Host "☁️ Syncing to S3..." -ForegroundColor Yellow
aws s3 sync out/ s3://integration-aws-app-076276934311 --acl public-read --delete

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ S3 sync failed!" -ForegroundColor Red
    exit 1
}

Write-Host "🔄 Invalidating CloudFront..." -ForegroundColor Yellow
aws cloudfront create-invalidation --distribution-id CLOUDFRONT_DISTRIBUTION_ID_PLACEHOLDER --paths "/*"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Deployment completed successfully!" -ForegroundColor Green
    Write-Host "🌐 URLs:" -ForegroundColor Green
    Write-Host "   - https://telmoai.mx" -ForegroundColor Green
    Write-Host "   - https://www.telmoai.mx" -ForegroundColor Green
    Write-Host "   - https://d2j7zvp3tz528c.cloudfront.net" -ForegroundColor Green
} else {
    Write-Host "CloudFront invalidation failed, but deployment completed" -ForegroundColor Yellow
} 