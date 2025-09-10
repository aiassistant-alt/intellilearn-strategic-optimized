#!/usr/bin/env python3
"""
Test Nova Sonic with real audio file
"""

import asyncio
import websockets
import json
import base64
import time

# WebSocket URL
WS_URL = "wss://d3m4wrd20w0beh.cloudfront.net/ws"

async def test_with_audio_file():
    """Test Nova Sonic with the generated audio file"""
    
    print(f"🔌 Connecting to: {WS_URL}")
    
    # Load the test audio
    with open('test_audio.pcm', 'rb') as f:
        audio_data = f.read()
    
    print(f"📁 Loaded audio file: {len(audio_data)} bytes")
    
    try:
        async with websockets.connect(WS_URL, max_size=10*1024*1024) as websocket:
            print("✅ Connected to WebSocket")
            
            # Wait for connection confirmation
            response = await websocket.recv()
            data = json.loads(response)
            print(f"📨 Connection: {data.get('type')}")
            
            # Initialize session
            init_message = {
                "type": "initialize_session",
                "authToken": "test-token-123456789",  # Long enough token
                "userId": "test-user"
            }
            
            await websocket.send(json.dumps(init_message))
            print("📤 Sent session initialization")
            
            # Wait for response
            while True:
                response = await websocket.recv()
                data = json.loads(response)
                print(f"📨 Received: {data.get('type')}")
                
                if data.get("type") == "session_initialized":
                    session_id = data.get("sessionId")
                    print(f"✅ Session initialized: {session_id}")
                    break
                elif data.get("type") == "error":
                    print(f"❌ Error: {data.get('error')}")
                    return
                elif data.get("type") == "heartbeat":
                    await websocket.send(json.dumps({"type": "pong"}))
            
            # Send audio in one chunk with end marker
            audio_b64 = base64.b64encode(audio_data).decode()
            
            audio_message = {
                "type": "audio_input",
                "audioData": audio_b64,
                "endOfUtterance": True  # Mark as complete utterance
            }
            
            await websocket.send(json.dumps(audio_message))
            print(f"🎤 Sent audio: {len(audio_data)} bytes")
            
            # Wait for responses
            print("⏳ Waiting for Nova Sonic response...")
            
            response_received = False
            timeout = 60  # 60 seconds timeout
            start_time = time.time()
            
            while time.time() - start_time < timeout:
                try:
                    response = await asyncio.wait_for(websocket.recv(), timeout=2.0)
                    data = json.loads(response)
                    msg_type = data.get("type")
                    
                    print(f"📨 Response type: {msg_type}")
                    
                    if msg_type == "audio_output":
                        audio_response = base64.b64decode(data.get("audio", ""))
                        print(f"🔊 Audio response: {len(audio_response)} bytes")
                        
                        # Save response
                        with open("nova_response.pcm", "wb") as f:
                            f.write(audio_response)
                        print("💾 Saved to nova_response.pcm")
                        
                        # Convert to WAV for playback
                        import wave
                        with wave.open('nova_response.wav', 'wb') as wav:
                            wav.setnchannels(1)
                            wav.setsampwidth(2)
                            wav.setframerate(16000)
                            wav.writeframes(audio_response)
                        print("💾 Saved to nova_response.wav")
                        response_received = True
                        
                    elif msg_type == "transcript":
                        text = data.get("text", "")
                        print(f"📝 Transcript: {text}")
                        
                    elif msg_type == "inference_complete":
                        print("✅ Inference complete!")
                        if response_received:
                            print("\n🎉 SUCCESS! Nova Sonic responded with audio!")
                            print("You can play the response with:")
                            print("  aplay nova_response.wav")
                            print("  or")
                            print("  ffplay nova_response.wav")
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
            print("🔚 Session ended")
            
    except Exception as e:
        print(f"❌ Connection error: {e}")

if __name__ == "__main__":
    print("🎯 Nova Sonic Audio Test with File")
    print("=" * 50)
    asyncio.run(test_with_audio_file())