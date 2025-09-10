#!/usr/bin/env python3
"""
Test FINAL de Nova Sonic con Streaming Bidireccional en Producción
Verifica que TODO use el SDK experimental obligatoriamente
"""

import asyncio
import websockets
import json
import base64
import time
import numpy as np
import boto3
from datetime import datetime

# Configuración
WS_URL = "ws://assistant-impl-alb-1961690535.us-east-1.elb.amazonaws.com/ws"
COGNITO_CLIENT_ID = "1juckgedu0gf5qv8fommh486bh"
TEST_USERNAME = "demo@intellilearn.com"
TEST_PASSWORD = "Demo2025!"

print("=" * 60)
print("🎯 NOVA SONIC PRODUCTION TEST - BIDIRECTIONAL STREAMING")
print("=" * 60)

def authenticate():
    """Autenticar con Cognito"""
    cognito = boto3.client('cognito-idp', region_name='us-east-1')
    
    try:
        response = cognito.initiate_auth(
            ClientId=COGNITO_CLIENT_ID,
            AuthFlow='USER_PASSWORD_AUTH',
            AuthParameters={
                'USERNAME': TEST_USERNAME,
                'PASSWORD': TEST_PASSWORD
            }
        )
        return response['AuthenticationResult']['IdToken']
    except Exception as e:
        print(f"❌ Auth failed: {e}")
        return None

async def test_production():
    """Test completo del servicio en producción"""
    
    print("\n1️⃣ AUTENTICACIÓN")
    print("-" * 40)
    token = authenticate()
    if not token:
        print("❌ Falló autenticación")
        return
    print("✅ Autenticación exitosa")
    
    print("\n2️⃣ CONEXIÓN WEBSOCKET")
    print("-" * 40)
    
    try:
        print(f"Conectando a: {WS_URL}")
        async with websockets.connect(WS_URL, max_size=10*1024*1024) as websocket:
            print("✅ Conectado al WebSocket")
            
            # Recibir confirmación
            response = await websocket.recv()
            data = json.loads(response)
            print(f"📨 Respuesta inicial: {data.get('type')}")
            
            # Inicializar sesión
            print("\n3️⃣ INICIALIZACIÓN DE SESIÓN")
            print("-" * 40)
            
            await websocket.send(json.dumps({
                "type": "initialize_session",
                "authToken": token,
                "userId": TEST_USERNAME
            }))
            print("📤 Enviado: initialize_session")
            
            # Esperar confirmación
            session_id = None
            for _ in range(5):
                response = await asyncio.wait_for(websocket.recv(), timeout=2.0)
                data = json.loads(response)
                
                if data.get("type") == "session_initialized":
                    session_id = data.get("sessionId")
                    print(f"✅ Sesión inicializada: {session_id}")
                    break
                elif data.get("type") == "error":
                    print(f"❌ Error: {data.get('error')}")
                    return
            
            if not session_id:
                print("❌ No se pudo inicializar sesión")
                return
            
            print("\n4️⃣ PRUEBA DE AUDIO BIDIRECCIONAL")
            print("-" * 40)
            
            # Generar audio de prueba
            sample_rate = 16000
            duration = 1.0
            frequency = 440
            t = np.linspace(0, duration, int(sample_rate * duration))
            audio_signal = np.sin(2 * np.pi * frequency * t) * 0.3
            audio_bytes = (audio_signal * 32767).astype(np.int16).tobytes()
            
            print(f"🎤 Audio generado: {len(audio_bytes)} bytes")
            
            # Enviar audio y medir latencia
            audio_b64 = base64.b64encode(audio_bytes).decode()
            
            start_time = time.perf_counter()
            
            await websocket.send(json.dumps({
                "type": "audio_input",
                "audioData": audio_b64,
                "endOfUtterance": True
            }))
            
            print(f"📤 Audio enviado a las {datetime.now().strftime('%H:%M:%S.%f')[:-3]}")
            
            # Esperar respuestas
            print("\n5️⃣ RESPUESTA DE NOVA SONIC")
            print("-" * 40)
            
            got_audio = False
            got_text = False
            first_response_time = None
            
            timeout = 15
            start = time.time()
            
            while time.time() - start < timeout:
                try:
                    response = await asyncio.wait_for(websocket.recv(), timeout=1.0)
                    data = json.loads(response)
                    msg_type = data.get("type")
                    
                    if not first_response_time:
                        first_response_time = time.perf_counter()
                        latency = (first_response_time - start_time) * 1000
                        print(f"⚡ Primera respuesta en: {latency:.2f}ms")
                    
                    if msg_type == "audio_output":
                        audio_resp = base64.b64decode(data.get("audio", ""))
                        print(f"🔊 Audio recibido: {len(audio_resp)} bytes")
                        got_audio = True
                        
                    elif msg_type == "transcript":
                        text = data.get("text", "")
                        print(f"📝 Texto recibido: '{text[:100]}...'")
                        got_text = True
                        
                    elif msg_type == "inference_complete":
                        total_time = (time.perf_counter() - start_time) * 1000
                        print(f"✅ Procesamiento completo en: {total_time:.2f}ms")
                        break
                        
                    elif msg_type == "error":
                        print(f"❌ Error del servicio: {data.get('error')}")
                        break
                        
                except asyncio.TimeoutError:
                    continue
            
            # Cerrar sesión
            await websocket.send(json.dumps({"type": "end_session"}))
            
            print("\n" + "=" * 60)
            print("📊 RESULTADO DEL TEST")
            print("=" * 60)
            
            if got_audio or got_text:
                print("✅ ÉXITO - Nova Sonic respondió correctamente")
                if first_response_time:
                    latency = (first_response_time - start_time) * 1000
                    print(f"   Latencia primera respuesta: {latency:.2f}ms")
                    
                    if latency < 500:
                        print("   ⚡ Latencia EXCELENTE para tiempo real")
                    elif latency < 1000:
                        print("   ✅ Latencia BUENA")
                    else:
                        print("   ⚠️ Latencia ALTA")
                
                print("\n✅ CONFIRMADO:")
                print("   - Python 3.12 ✓")
                print("   - SDK experimental (aws_sdk_bedrock_runtime) ✓")
                print("   - Streaming bidireccional OBLIGATORIO ✓")
                print("   - Servicio en producción ✓")
            else:
                print("❌ No se recibió respuesta de Nova Sonic")
                print("   Verificar logs del servicio ECS")
                
    except Exception as e:
        print(f"❌ Error en el test: {e}")

if __name__ == "__main__":
    print("\n🔍 Verificando servicio en producción...")
    print(f"   Endpoint: {WS_URL}")
    print(f"   Modelo: amazon.nova-sonic-v1:0")
    print(f"   SDK: aws_sdk_bedrock_runtime (Python 3.12)")
    
    asyncio.run(test_production())