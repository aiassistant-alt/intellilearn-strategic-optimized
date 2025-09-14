#!/bin/bash

# Enable Bedrock Models Script
# Author: Luis Arturo Parra - Telmo AI
# Created: 2025-01-13

echo "🔓 Enabling Bedrock Models for Intellilearn Course Generator"
echo "=" | tr -d '\n' | head -c 60 && echo

# Check if AWS CLI is configured
if ! aws sts get-caller-identity --output json > /dev/null 2>&1; then
    echo "❌ AWS CLI not configured. Please run 'aws configure' first."
    exit 1
fi

# Get account ID and region
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
REGION="us-east-1"

echo "📍 Account: $ACCOUNT_ID"
echo "📍 Region: $REGION"
echo

# Models to enable
MODELS=(
    "amazon.titan-text-express-v1"
    "amazon.titan-embed-text-v1"
    "anthropic.claude-3-haiku-20240307-v1:0"
)

echo "🎯 Models to enable:"
for model in "${MODELS[@]}"; do
    echo "  - $model"
done
echo

# Check current model access
echo "🔍 Checking current model access..."
for model in "${MODELS[@]}"; do
    echo -n "  $model: "
    if aws bedrock-runtime invoke-model \
        --region $REGION \
        --model-id $model \
        --body '{"inputText": "test", "textGenerationConfig": {"maxTokenCount": 10}}' \
        --cli-binary-format raw-in-base64-out /tmp/test.json > /dev/null 2>&1; then
        echo "✅ Enabled"
    else
        echo "❌ Not enabled"
    fi
done
echo

echo "💡 To enable models, you need to:"
echo "1. Go to AWS Bedrock Console: https://console.aws.amazon.com/bedrock/"
echo "2. Navigate to 'Model access' in the left sidebar"
echo "3. Click 'Enable specific models'"
echo "4. Select the following models:"
for model in "${MODELS[@]}"; do
    echo "   ✓ $model"
done
echo "5. Click 'Save changes'"
echo

echo "🔗 Direct link to Bedrock Model Access:"
echo "https://$REGION.console.aws.amazon.com/bedrock/home?region=$REGION#/modelaccess"
echo

echo "⏳ After enabling models, run this script again to verify access."
echo "🚀 Then test course generation with: node scripts/quick-test.js"
