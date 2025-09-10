#!/usr/bin/env python3
"""
Test Nova Sonic with real Cognito authentication
"""

import asyncio
import websockets
import json
import base64
import boto3
from botocore.exceptions import ClientError

# Cognito configuration
USER_POOL_ID = "us-east-1_4jx4yzrZ8"
CLIENT_ID = "1juckgedu0gf5qv8fommh486bh"
REGION = "us-east-1"

# Test credentials
TEST_USERNAME = "demo@intellilearn.com"
TEST_PASSWORD = "Demo2025!"

# WebSocket URLs
WS_URL_CLOUDFRONT = "wss://d3m4wrd20w0beh.cloudfront.net/ws"
WS_URL_ALB = "ws://assistant-impl-alb-1961690535.us-east-1.elb.amazonaws.com/ws"

def authenticate_with_cognito(username: str, password: str) -> str:
    """Authenticate with Cognito and get ID token"""
    
    cognito = boto3.client('cognito-idp', region_name=REGION)
    
    try:
        # Authenticate
        response = cognito.initiate_auth(
            ClientId=CLIENT_ID,
            AuthFlow='USER_PASSWORD_AUTH',
            AuthParameters={
                'USERNAME': username,
                'PASSWORD': password
            }
        )
        
        # Get tokens
        id_token = response['AuthenticationResult']['IdToken']
        access_token = response['AuthenticationResult']['AccessToken']
        
        print(f"✅ Authenticated as: {username}")
        print(f"📝 Token type: {response['AuthenticationResult']['TokenType']}")
        print(f"⏱️ Expires in: {response['AuthenticationResult']['ExpiresIn']} seconds")
        
        return id_token
        
    except ClientError as e:
        print(f"❌ Authentication failed: {e}")
        return None

async def test_with_cognito_auth(use_cloudfront=False):
    """Test Nova Sonic with Cognito authentication"""
    
    # Choose WebSocket URL
    ws_url = WS_URL_CLOUDFRONT if use_cloudfront else WS_URL_ALB
    print(f"🔌 Using: {'CloudFront' if use_cloudfront else 'ALB Direct'}")
    print(f"📍 URL: {ws_url}")
    
    # Authenticate with Cognito
    print(f"\n🔐 Authenticating with Cognito...")
    id_token = authenticate_with_cognito(TEST_USERNAME, TEST_PASSWORD)
    
    if not id_token:
        print("❌ Failed to get Cognito token")
        return
    
    print(f"\n🎯 Got ID token (length: {len(id_token)})")
    
    # Load test audio
    try:
        with open('test_audio.pcm', 'rb') as f:
            audio_data = f.read()
        print(f"📁 Loaded test audio: {len(audio_data)} bytes")
    except FileNotFoundError:
        print("⚠️ test_audio.pcm not found, using empty audio")
        audio_data = b'\x00' * 1000
    
    try:
        print(f"\n🌐 Connecting to WebSocket...")
        async with websockets.connect(ws_url, max_size=10*1024*1024) as websocket:
            print("✅ WebSocket connected")
            
            # Wait for connection confirmation
            response = await websocket.recv()
            data = json.loads(response)
            print(f"📨 Server: {data.get('type')}")
            
            # Initialize session with Cognito token
            init_message = {
                "type": "initialize_session",
                "authToken": id_token,
                "userId": TEST_USERNAME
            }
            
            await websocket.send(json.dumps(init_message))
            print("📤 Sent session init with Cognito token")
            
            # Wait for session initialization
            max_wait = 10
            session_initialized = False
            
            for _ in range(max_wait):
                try:
                    response = await asyncio.wait_for(websocket.recv(), timeout=1.0)
                    data = json.loads(response)
                    msg_type = data.get('type')
                    
                    print(f"📨 Response: {msg_type}")
                    
                    if msg_type == "session_initialized":
                        session_id = data.get("sessionId")
                        print(f"✅ Session initialized: {session_id}")
                        session_initialized = True
                        break
                    elif msg_type == "error":
                        print(f"❌ Error: {data.get('error')}")
                        return
                    elif msg_type == "heartbeat":
                        await websocket.send(json.dumps({"type": "pong"}))
                        
                except asyncio.TimeoutError:
                    continue
            
            if not session_initialized:
                print("❌ Session initialization timeout")
                return
            
            # Send test audio
            print(f"\n🎤 Sending audio ({len(audio_data)} bytes)...")
            audio_b64 = base64.b64encode(audio_data).decode()
            
            audio_message = {
                "type": "audio_input",
                "audioData": audio_b64,
                "endOfUtterance": True
            }
            
            await websocket.send(json.dumps(audio_message))
            print("📤 Audio sent, waiting for response...")
            
            # Wait for Nova Sonic response
            response_timeout = 30
            import time
            start = time.time()
            
            while time.time() - start < response_timeout:
                try:
                    response = await asyncio.wait_for(websocket.recv(), timeout=2.0)
                    data = json.loads(response)
                    msg_type = data.get("type")
                    
                    if msg_type == "audio_output":
                        audio_response = base64.b64decode(data.get("audio", ""))
                        print(f"🔊 Audio response received: {len(audio_response)} bytes")
                        
                        # Save response
                        with open("cognito_test_response.pcm", "wb") as f:
                            f.write(audio_response)
                        print("💾 Saved to cognito_test_response.pcm")
                        
                    elif msg_type == "transcript":
                        text = data.get("text", "")
                        print(f"📝 Transcript: {text}")
                        
                    elif msg_type == "inference_complete":
                        print("✅ Inference complete!")
                        print("\n🎉 SUCCESS! Nova Sonic responded!")
                        break
                        
                    elif msg_type == "error":
                        print(f"❌ Error: {data.get('error')}")
                        break
                        
                    elif msg_type == "heartbeat":
                        await websocket.send(json.dumps({"type": "pong"}))
                        
                except asyncio.TimeoutError:
                    continue
            
            # End session
            await websocket.send(json.dumps({"type": "end_session"}))
            print("\n🔚 Session ended")
            
    except Exception as e:
        print(f"❌ Connection error: {e}")

async def main():
    print("=" * 60)
    print("🎯 Nova Sonic with Cognito Authentication Test")
    print("=" * 60)
    
    # Test direct ALB connection first
    print("\n1️⃣ Testing ALB Direct Connection:")
    print("-" * 40)
    await test_with_cognito_auth(use_cloudfront=False)
    
    # Then test CloudFront
    print("\n2️⃣ Testing CloudFront Connection:")
    print("-" * 40)
    await test_with_cognito_auth(use_cloudfront=True)

if __name__ == "__main__":
    asyncio.run(main())