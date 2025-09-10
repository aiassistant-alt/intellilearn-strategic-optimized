#!/usr/bin/env python3
"""
Test Nova Sonic directly via ALB
"""

import asyncio
import websockets
import json
import base64

# Direct ALB URL
WS_URL = "ws://assistant-impl-alb-1961690535.us-east-1.elb.amazonaws.com/ws"

async def test_alb_direct():
    """Test WebSocket directly on ALB"""
    
    print(f"🔌 Connecting directly to ALB: {WS_URL}")
    
    # Load test audio
    with open('test_audio.pcm', 'rb') as f:
        audio_data = f.read()
    
    try:
        async with websockets.connect(WS_URL, max_size=10*1024*1024) as websocket:
            print("✅ Connected to ALB WebSocket")
            
            # Wait for connection
            response = await websocket.recv()
            data = json.loads(response)
            print(f"📨 {data}")
            
            # Initialize session
            await websocket.send(json.dumps({
                "type": "initialize_session",
                "authToken": "test-token-direct",
                "userId": "test"
            }))
            
            # Wait for initialization
            response = await websocket.recv()
            data = json.loads(response)
            print(f"📨 Session: {data.get('type')}")
            
            if data.get("type") == "session_initialized":
                session_id = data.get("sessionId")
                print(f"✅ Session ID: {session_id}")
                
                # Send audio
                audio_b64 = base64.b64encode(audio_data).decode()
                await websocket.send(json.dumps({
                    "type": "audio_input",
                    "audioData": audio_b64,
                    "endOfUtterance": True
                }))
                print(f"🎤 Sent {len(audio_data)} bytes of audio")
                
                # Wait for response
                timeout = 30
                import time
                start = time.time()
                
                while time.time() - start < timeout:
                    try:
                        response = await asyncio.wait_for(websocket.recv(), 2.0)
                        data = json.loads(response)
                        msg_type = data.get("type")
                        
                        if msg_type == "audio_output":
                            audio_resp = base64.b64decode(data.get("audio", ""))
                            print(f"🔊 Got audio response: {len(audio_resp)} bytes")
                            with open("alb_response.pcm", "wb") as f:
                                f.write(audio_resp)
                            print("💾 Saved to alb_response.pcm")
                            
                        elif msg_type == "transcript":
                            print(f"📝 Text: {data.get('text')}")
                            
                        elif msg_type == "inference_complete":
                            print("✅ Complete!")
                            break
                            
                        elif msg_type == "error":
                            print(f"❌ Error: {data.get('error')}")
                            break
                            
                    except asyncio.TimeoutError:
                        continue
                        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    print("🎯 Direct ALB Test")
    print("=" * 40)
    asyncio.run(test_alb_direct())
