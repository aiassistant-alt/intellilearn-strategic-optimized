#!/bin/bash

# Install AWS SDK for Nova Sonic from GitHub
echo "Installing AWS SDK for Nova Sonic..."

# The SDK might not be publicly available yet
# For now, we'll use the standard boto3 approach

# Check if the experimental SDK is available
pip install git+https://github.com/aws/aws-sdk-python.git@bedrock-runtime 2>/dev/null || {
    echo "Experimental SDK not available, using standard boto3"
    pip install boto3 botocore
}

echo "SDK installation complete"