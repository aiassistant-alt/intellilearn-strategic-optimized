#!/usr/bin/env python3
"""
Prueba directa del streaming bidireccional de Nova Sonic
"""

import os
import asyncio
import base64
import json
import uuid
import time
import numpy as np

# Configurar credenciales AWS
os.environ['AWS_DEFAULT_REGION'] = 'us-east-1'

print("Testing Nova Sonic Bidirectional Streaming...")

try:
    # Intentar importar el SDK experimental
    from aws_sdk_bedrock_runtime.client import BedrockRuntimeClient, InvokeModelWithBidirectionalStreamOperationInput
    from aws_sdk_bedrock_runtime.models import InvokeModelWithBidirectionalStreamInputChunk, BidirectionalInputPayloadPart
    from aws_sdk_bedrock_runtime.config import Config, HTTPAuthSchemeResolver, SigV4AuthScheme
    from smithy_aws_core.credentials_resolvers.environment import EnvironmentCredentialsResolver
    
    print("✅ SDK experimental importado correctamente")
    SDK_AVAILABLE = True
    
except ImportError as e:
    print(f"❌ SDK experimental no disponible: {e}")
    print("\nInstalando SDK experimental...")
    import subprocess
    
    # Intentar instalar
    try:
        subprocess.check_call(["pip", "install", "aws_sdk_bedrock_runtime"])
        print("✅ SDK instalado, reinicie el script")
    except:
        print("❌ No se pudo instalar el SDK")
        print("\nNOTA: El SDK requiere Python 3.12+")
        import sys
        print(f"Tu versión de Python: {sys.version}")
    
    SDK_AVAILABLE = False

async def test_bidirectional():
    """Probar streaming bidireccional real"""
    
    if not SDK_AVAILABLE:
        print("\n⚠️ SDK no disponible, usando fallback con boto3...")
        
        # Fallback con boto3 estándar
        import boto3
        
        bedrock = boto3.client('bedrock-runtime', region_name='us-east-1')
        
        # Generar audio de prueba
        sample_rate = 16000
        duration = 0.5
        t = np.linspace(0, duration, int(sample_rate * duration))
        audio_signal = np.sin(2 * np.pi * 440 * t) * 0.3
        audio_bytes = (audio_signal * 32767).astype(np.int16).tobytes()
        
        print(f"\n📊 Audio de prueba: {len(audio_bytes)} bytes")
        
        # Probar con invoke_model_with_response_stream
        try:
            print("\n🔄 Probando streaming con boto3...")
            
            # Nova Sonic requiere un formato específico
            request = {
                "modelId": "amazon.nova-sonic-v1:0",
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {"text": "Hello, this is a test"}
                        ]
                    }
                ],
                "system": [
                    {"text": "You are a helpful assistant"}
                ],
                "inferenceConfig": {
                    "maxTokens": 100,
                    "temperature": 0.7
                }
            }
            
            start_time = time.perf_counter()
            
            response = bedrock.invoke_model_with_response_stream(
                modelId="amazon.nova-sonic-v1:0",
                contentType='application/json',
                accept='application/json',
                body=json.dumps(request)
            )
            
            print("✅ Stream iniciado")
            
            # Leer respuesta
            chunks_received = 0
            for event in response.get('body', []):
                chunks_received += 1
                if 'chunk' in event:
                    chunk_bytes = event['chunk'].get('bytes', b'')
                    if chunk_bytes:
                        print(f"📦 Chunk {chunks_received}: {len(chunk_bytes)} bytes")
            
            latency = (time.perf_counter() - start_time) * 1000
            print(f"\n⏱️ Latencia total: {latency:.2f}ms")
            
        except Exception as e:
            print(f"❌ Error con streaming: {e}")
            
            # Probar converse API como fallback
            print("\n🔄 Probando converse API...")
            try:
                response = bedrock.converse(
                    modelId="amazon.nova-lite-v1:0",  # Usar Nova Lite para texto
                    messages=[
                        {
                            "role": "user",
                            "content": [{"text": "Test message"}]
                        }
                    ],
                    inferenceConfig={
                        "maxTokens": 50,
                        "temperature": 0.7
                    }
                )
                print("✅ Converse API funciona (solo texto)")
                
            except Exception as e2:
                print(f"❌ Converse API error: {e2}")
    
    else:
        print("\n✅ Usando SDK experimental para streaming bidireccional real")
        
        # Configurar cliente
        config = Config(
            endpoint_uri="https://bedrock-runtime.us-east-1.amazonaws.com",
            region="us-east-1",
            aws_credentials_identity_resolver=EnvironmentCredentialsResolver(),
            http_auth_scheme_resolver=HTTPAuthSchemeResolver(),
            http_auth_schemes={"aws.auth#sigv4": SigV4AuthScheme()}
        )
        
        client = BedrockRuntimeClient(config=config)
        print("✅ Cliente inicializado")
        
        # Iniciar stream bidireccional
        stream = await client.invoke_model_with_bidirectional_stream(
            InvokeModelWithBidirectionalStreamOperationInput(model_id="amazon.nova-sonic-v1:0")
        )
        
        print("✅ Stream bidireccional iniciado")
        
        # IDs únicos
        prompt_name = str(uuid.uuid4())
        content_name = str(uuid.uuid4())
        audio_content_name = str(uuid.uuid4())
        
        # Enviar sessionStart
        session_start = json.dumps({
            "event": {
                "sessionStart": {
                    "inferenceConfiguration": {
                        "maxTokens": 1024,
                        "temperature": 0.7,
                        "topP": 0.9
                    }
                }
            }
        })
        
        event = InvokeModelWithBidirectionalStreamInputChunk(
            value=BidirectionalInputPayloadPart(bytes_=session_start.encode('utf-8'))
        )
        await stream.input_stream.send(event)
        print("📤 sessionStart enviado")
        
        # Enviar promptStart
        prompt_start = json.dumps({
            "event": {
                "promptStart": {
                    "promptName": prompt_name,
                    "audioOutputConfiguration": {
                        "mediaType": "audio/lpcm",
                        "sampleRateHertz": 16000,
                        "sampleSizeBits": 16,
                        "channelCount": 1,
                        "voiceId": "matthew",
                        "encoding": "base64",
                        "audioType": "SPEECH"
                    }
                }
            }
        })
        
        event = InvokeModelWithBidirectionalStreamInputChunk(
            value=BidirectionalInputPayloadPart(bytes_=prompt_start.encode('utf-8'))
        )
        await stream.input_stream.send(event)
        print("📤 promptStart enviado")
        
        # Generar y enviar audio
        sample_rate = 16000
        duration = 0.5
        t = np.linspace(0, duration, int(sample_rate * duration))
        audio_signal = np.sin(2 * np.pi * 440 * t) * 0.3
        audio_bytes = (audio_signal * 32767).astype(np.int16).tobytes()
        audio_b64 = base64.b64encode(audio_bytes).decode('utf-8')
        
        # audioInput
        audio_input = json.dumps({
            "event": {
                "audioInput": {
                    "promptName": prompt_name,
                    "contentName": audio_content_name,
                    "content": audio_b64
                }
            }
        })
        
        start_time = time.perf_counter()
        
        event = InvokeModelWithBidirectionalStreamInputChunk(
            value=BidirectionalInputPayloadPart(bytes_=audio_input.encode('utf-8'))
        )
        await stream.input_stream.send(event)
        print(f"📤 audioInput enviado: {len(audio_bytes)} bytes")
        
        # Leer respuestas
        print("\n⏳ Esperando respuestas...")
        
        responses = []
        timeout = 10
        start = time.time()
        
        while time.time() - start < timeout:
            output = await stream.await_output()
            result = await output[1].receive()
            
            if result.value and result.value.bytes_:
                response_time = (time.perf_counter() - start_time) * 1000
                response_data = result.value.bytes_.decode('utf-8')
                json_data = json.loads(response_data)
                
                if 'event' in json_data:
                    event_type = list(json_data['event'].keys())[0]
                    print(f"📨 {event_type} en {response_time:.2f}ms")
                    responses.append((event_type, response_time))
                    
                    if event_type == 'audioOutput':
                        audio_content = json_data['event']['audioOutput'].get('content', '')
                        if audio_content:
                            audio_resp = base64.b64decode(audio_content)
                            print(f"   🔊 Audio recibido: {len(audio_resp)} bytes")
                    
                    elif event_type == 'completionEnd':
                        print("✅ Respuesta completa")
                        break
        
        # Cerrar stream
        await stream.input_stream.close()
        
        # Estadísticas
        if responses:
            first_response = responses[0][1]
            print(f"\n📊 LATENCIA:")
            print(f"  Primera respuesta: {first_response:.2f}ms")
            
            audio_responses = [r for r in responses if r[0] == 'audioOutput']
            if audio_responses:
                print(f"  Primer audio: {audio_responses[0][1]:.2f}ms")

if __name__ == "__main__":
    print("=" * 60)
    print("NOVA SONIC BIDIRECTIONAL STREAMING TEST")
    print("=" * 60)
    
    # Verificar Python
    import sys
    print(f"\n🐍 Python version: {sys.version}")
    
    if sys.version_info < (3, 12):
        print("⚠️  ADVERTENCIA: SDK experimental requiere Python 3.12+")
    
    # Ejecutar prueba
    asyncio.run(test_bidirectional())