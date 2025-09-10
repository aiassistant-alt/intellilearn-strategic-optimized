#!/usr/bin/env python3
"""
Direct test of Nova Sonic using the correct format
"""

import boto3
import json
import base64
import time

def test_nova_sonic_direct():
    """Test Nova Sonic with the simplest possible approach"""
    
    print("🎯 Testing Nova Sonic directly...")
    
    # Initialize Bedrock client
    bedrock = boto3.client(
        'bedrock-runtime',
        region_name='us-east-1'
    )
    
    # Load test audio
    try:
        with open('test_audio.pcm', 'rb') as f:
            audio_data = f.read()
        print(f"📁 Loaded audio: {len(audio_data)} bytes")
    except:
        # Create silent audio if file doesn't exist
        audio_data = b'\x00' * 1000
        print("📁 Using silent test audio")
    
    # Convert to base64
    audio_b64 = base64.b64encode(audio_data).decode('utf-8')
    
    try:
        # Method 1: Try invoke_model with the correct format
        print("\n1️⃣ Testing invoke_model...")
        
        request_body = {
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {
                            "text": "Hello, can you hear me? Please respond."
                        }
                    ]
                }
            ],
            "inferenceConfig": {
                "maxTokens": 100,
                "temperature": 0.7
            }
        }
        
        response = bedrock.invoke_model(
            modelId="amazon.nova-lite-v1:0",  # Try Nova Lite first
            contentType='application/json',
            accept='application/json',
            body=json.dumps(request_body)
        )
        
        result = json.loads(response['body'].read())
        print("✅ Response received:")
        print(json.dumps(result, indent=2))
        
    except Exception as e:
        print(f"❌ invoke_model failed: {e}")
        
        # Method 2: Try streaming
        print("\n2️⃣ Testing invoke_model_with_response_stream...")
        
        try:
            stream_body = {
                "event": {
                    "sessionStart": {
                        "inferenceConfiguration": {
                            "maxTokens": 100,
                            "temperature": 0.7
                        }
                    }
                }
            }
            
            response = bedrock.invoke_model_with_response_stream(
                modelId="amazon.nova-sonic-v1:0",
                contentType='application/json',
                accept='application/json',
                body=json.dumps(stream_body)
            )
            
            print("✅ Stream started")
            
            # Read stream
            for event in response.get('body', []):
                chunk = event.get('chunk', {})
                if 'bytes' in chunk:
                    data = chunk['bytes'].decode('utf-8')
                    print(f"📨 Chunk: {data[:100]}...")
                    
        except Exception as e2:
            print(f"❌ Streaming failed: {e2}")

def test_converse_api():
    """Test using the Converse API"""
    
    print("\n3️⃣ Testing Converse API...")
    
    bedrock = boto3.client(
        'bedrock-runtime',
        region_name='us-east-1'
    )
    
    try:
        response = bedrock.converse(
            modelId="us.amazon.nova-lite-v1:0",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "text": "Write a short poem about learning"
                        }
                    ]
                }
            ],
            inferenceConfig={
                "maxTokens": 100,
                "temperature": 0.7
            }
        )
        
        print("✅ Converse API response:")
        print(json.dumps(response, indent=2, default=str))
        
    except Exception as e:
        print(f"❌ Converse API failed: {e}")

if __name__ == "__main__":
    print("=" * 60)
    print("NOVA SONIC DIRECT TEST")
    print("=" * 60)
    
    # Test direct invocation
    test_nova_sonic_direct()
    
    # Test Converse API
    test_converse_api()
    
    print("\n" + "=" * 60)
    print("Test complete!")
    print("=" * 60)