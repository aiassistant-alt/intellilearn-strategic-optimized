#!/usr/bin/env python3
"""
Final test of Nova Sonic with Cognito authentication
"""

import asyncio
import websockets
import json
import base64
import boto3
from botocore.exceptions import ClientError

# Configuration
USER_POOL_ID = "us-east-1_4jx4yzrZ8"
CLIENT_ID = "1juckgedu0gf5qv8fommh486bh"
REGION = "us-east-1"

# Test credentials
TEST_USERNAME = "demo@intellilearn.com"
TEST_PASSWORD = "Demo2025!"

# WebSocket URL
WS_URL = "ws://assistant-impl-alb-1961690535.us-east-1.elb.amazonaws.com/ws"

def authenticate():
    """Authenticate with Cognito"""
    cognito = boto3.client('cognito-idp', region_name=REGION)
    
    try:
        response = cognito.initiate_auth(
            ClientId=CLIENT_ID,
            AuthFlow='USER_PASSWORD_AUTH',
            AuthParameters={
                'USERNAME': TEST_USERNAME,
                'PASSWORD': TEST_PASSWORD
            }
        )
        
        return response['AuthenticationResult']['IdToken']
        
    except ClientError as e:
        print(f"❌ Auth failed: {e}")
        return None

async def test_nova_sonic():
    """Test the complete flow"""
    
    print("🔐 Authenticating...")
    token = authenticate()
    
    if not token:
        print("❌ Authentication failed")
        return
    
    print("✅ Authenticated successfully")
    
    # Create simple test audio (beep sound)
    import numpy as np
    sample_rate = 16000
    duration = 1.0
    frequency = 440
    t = np.linspace(0, duration, int(sample_rate * duration))
    audio_data = (np.sin(2 * np.pi * frequency * t) * 32767 * 0.3).astype(np.int16)
    audio_bytes = audio_data.tobytes()
    
    print(f"🎤 Created test audio: {len(audio_bytes)} bytes")
    
    try:
        print(f"\n🔌 Connecting to: {WS_URL}")
        async with websockets.connect(WS_URL, max_size=10*1024*1024) as websocket:
            print("✅ Connected")
            
            # Get connection confirmation
            response = await websocket.recv()
            data = json.loads(response)
            print(f"📨 {data.get('type')}")
            
            # Initialize session
            await websocket.send(json.dumps({
                "type": "initialize_session",
                "authToken": token,
                "userId": TEST_USERNAME
            }))
            print("📤 Sent session init")
            
            # Wait for session
            for _ in range(10):
                response = await asyncio.wait_for(websocket.recv(), timeout=2.0)
                data = json.loads(response)
                
                if data.get("type") == "session_initialized":
                    session_id = data.get("sessionId")
                    print(f"✅ Session: {session_id}")
                    break
                elif data.get("type") == "error":
                    print(f"❌ Error: {data.get('error')}")
                    return
            
            # Send audio
            audio_b64 = base64.b64encode(audio_bytes).decode()
            await websocket.send(json.dumps({
                "type": "audio_input",
                "audioData": audio_b64,
                "endOfUtterance": True
            }))
            print("📤 Sent audio")
            
            # Wait for response
            print("\n⏳ Waiting for Nova Sonic response...")
            
            import time
            start = time.time()
            got_response = False
            
            while time.time() - start < 30:
                try:
                    response = await asyncio.wait_for(websocket.recv(), timeout=2.0)
                    data = json.loads(response)
                    msg_type = data.get("type")
                    
                    if msg_type == "audio_output":
                        audio_resp = base64.b64decode(data.get("audio", ""))
                        print(f"🔊 Audio response: {len(audio_resp)} bytes")
                        
                        # Save it
                        with open("final_response.pcm", "wb") as f:
                            f.write(audio_resp)
                        print("💾 Saved to final_response.pcm")
                        got_response = True
                        
                    elif msg_type == "transcript":
                        text = data.get("text", "")
                        print(f"📝 Text: {text}")
                        
                    elif msg_type == "inference_complete":
                        print("✅ Complete!")
                        if got_response:
                            print("\n🎉 SUCCESS! Nova Sonic is working!")
                            print("\nTo play the audio response:")
                            print("  ffplay -f s16le -ar 16000 -ac 1 final_response.pcm")
                        break
                        
                    elif msg_type == "error":
                        print(f"❌ Error: {data.get('error')}")
                        break
                        
                except asyncio.TimeoutError:
                    continue
            
            # Close
            await websocket.send(json.dumps({"type": "end_session"}))
            print("\n🔚 Session ended")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    print("=" * 60)
    print("🎯 FINAL NOVA SONIC TEST")
    print("=" * 60)
    
    # Need numpy
    try:
        import numpy
    except ImportError:
        print("Installing numpy...")
        import subprocess
        subprocess.check_call(["pip", "install", "numpy"])
    
    asyncio.run(test_nova_sonic())