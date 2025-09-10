#!/usr/bin/env python3
"""
Test Nova Sonic format with Bedrock
"""

import boto3
import json
import base64

# Initialize Bedrock client
bedrock = boto3.client('bedrock-runtime', region_name='us-east-1')

# Test with correct format
def test_nova_format():
    try:
        # Create a simple text prompt first
        response = bedrock.converse(
            modelId="amazon.nova-sonic-v1:0",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "text": "Hello, can you hear me?"
                        }
                    ]
                }
            ],
            inferenceConfig={
                "maxTokens": 100,
                "temperature": 0.7
            }
        )
        
        print("✅ Text format works!")
        print(json.dumps(response, indent=2, default=str))
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    print("Testing Nova Sonic format...")
    test_nova_format()
