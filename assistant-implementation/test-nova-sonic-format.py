#!/usr/bin/env python3
"""
Test Nova Sonic with the correct format
"""

import boto3
import json

# Test Nova Lite (text model) first
bedrock = boto3.client('bedrock-runtime', region_name='us-east-1')

print("Testing Nova Lite (text model)...")
try:
    response = bedrock.converse(
        modelId="amazon.nova-lite-v1:0",
        messages=[{
            "role": "user",
            "content": [{"text": "Hello, how are you?"}]
        }],
        inferenceConfig={
            "maxTokens": 50,
            "temperature": 0.7
        }
    )
    
    print("✅ Nova Lite works!")
    content = response['output']['message']['content'][0]['text']
    print(f"Response: {content}")
    
except Exception as e:
    print(f"❌ Error: {e}")

print("\nChecking Nova Sonic capabilities...")
print("Nova Sonic is a speech-to-speech model that requires:")
print("1. Bidirectional streaming (invoke_model_with_bidirectional_stream)")
print("2. Special event format for audio input/output")
print("3. Session management with start/end events")
