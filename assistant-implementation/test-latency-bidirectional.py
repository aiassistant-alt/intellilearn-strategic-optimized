#!/usr/bin/env python3
"""
Prueba de latencia REAL con streaming bidireccional de Nova Sonic
Usando SDK experimental con Python 3.12
"""

import os
import asyncio
import base64
import json
import uuid
import time
import numpy as np
from datetime import datetime

# Configurar credenciales AWS (use environment variables or AWS credentials file)
# os.environ['AWS_ACCESS_KEY_ID'] = 'your-access-key-id'
# os.environ['AWS_SECRET_ACCESS_KEY'] = 'your-secret-access-key'
os.environ['AWS_DEFAULT_REGION'] = 'us-east-1'

# Importar SDK experimental
from aws_sdk_bedrock_runtime.client import BedrockRuntimeClient, InvokeModelWithBidirectionalStreamOperationInput
from aws_sdk_bedrock_runtime.models import InvokeModelWithBidirectionalStreamInputChunk, BidirectionalInputPayloadPart
from aws_sdk_bedrock_runtime.config import Config, HTTPAuthSchemeResolver, SigV4AuthScheme
from smithy_aws_core.credentials_resolvers.environment import EnvironmentCredentialsResolver

print("=" * 60)
print("🎯 NOVA SONIC BIDIRECTIONAL LATENCY TEST")
print("=" * 60)

async def test_latency():
    """Medir latencia real con streaming bidireccional"""
    
    # Configurar cliente
    config = Config(
        endpoint_uri="https://bedrock-runtime.us-east-1.amazonaws.com",
        region="us-east-1",
        aws_credentials_identity_resolver=EnvironmentCredentialsResolver(),
        http_auth_scheme_resolver=HTTPAuthSchemeResolver(),
        http_auth_schemes={"aws.auth#sigv4": SigV4AuthScheme()}
    )
    
    client = BedrockRuntimeClient(config=config)
    print("✅ Cliente inicializado\n")
    
    # Ejecutar múltiples pruebas
    latencies = []
    num_tests = 5
    
    for test_num in range(1, num_tests + 1):
        print(f"🧪 Test {test_num}/{num_tests}:")
        
        try:
            # Iniciar stream bidireccional
            stream = await client.invoke_model_with_bidirectional_stream(
                InvokeModelWithBidirectionalStreamOperationInput(model_id="amazon.nova-sonic-v1:0")
            )
            
            # IDs únicos para esta sesión
            prompt_name = str(uuid.uuid4())
            content_name = str(uuid.uuid4())
            audio_content_name = str(uuid.uuid4())
            
            # 1. sessionStart
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
            
            # 2. promptStart
            prompt_start = json.dumps({
                "event": {
                    "promptStart": {
                        "promptName": prompt_name,
                        "textOutputConfiguration": {
                            "mediaType": "text/plain"
                        },
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
            
            # 3. contentStart para audio
            content_start = json.dumps({
                "event": {
                    "contentStart": {
                        "promptName": prompt_name,
                        "contentName": audio_content_name,
                        "type": "AUDIO",
                        "interactive": True,
                        "role": "USER",
                        "audioInputConfiguration": {
                            "mediaType": "audio/lpcm",
                            "sampleRateHertz": 16000,
                            "sampleSizeBits": 16,
                            "channelCount": 1,
                            "audioType": "SPEECH",
                            "encoding": "base64"
                        }
                    }
                }
            })
            
            event = InvokeModelWithBidirectionalStreamInputChunk(
                value=BidirectionalInputPayloadPart(bytes_=content_start.encode('utf-8'))
            )
            await stream.input_stream.send(event)
            
            # Generar audio de prueba (tono simple)
            sample_rate = 16000
            duration = 0.5
            t = np.linspace(0, duration, int(sample_rate * duration))
            frequency = 440 + (test_num * 50)  # Frecuencia diferente para cada test
            audio_signal = np.sin(2 * np.pi * frequency * t) * 0.3
            audio_bytes = (audio_signal * 32767).astype(np.int16).tobytes()
            audio_b64 = base64.b64encode(audio_bytes).decode('utf-8')
            
            # 4. audioInput con medición de tiempo
            audio_input = json.dumps({
                "event": {
                    "audioInput": {
                        "promptName": prompt_name,
                        "contentName": audio_content_name,
                        "content": audio_b64
                    }
                }
            })
            
            # MARCAR TIEMPO DE INICIO
            start_time = time.perf_counter()
            
            event = InvokeModelWithBidirectionalStreamInputChunk(
                value=BidirectionalInputPayloadPart(bytes_=audio_input.encode('utf-8'))
            )
            await stream.input_stream.send(event)
            print(f"📤 Audio enviado: {len(audio_bytes)} bytes at {datetime.now().strftime('%H:%M:%S.%f')[:-3]}")
            
            # 5. contentEnd
            content_end = json.dumps({
                "event": {
                    "contentEnd": {
                        "promptName": prompt_name,
                        "contentName": audio_content_name
                    }
                }
            })
            
            event = InvokeModelWithBidirectionalStreamInputChunk(
                value=BidirectionalInputPayloadPart(bytes_=content_end.encode('utf-8'))
            )
            await stream.input_stream.send(event)
            
            # 6. promptEnd
            prompt_end = json.dumps({
                "event": {
                    "promptEnd": {
                        "promptName": prompt_name
                    }
                }
            })
            
            event = InvokeModelWithBidirectionalStreamInputChunk(
                value=BidirectionalInputPayloadPart(bytes_=prompt_end.encode('utf-8'))
            )
            await stream.input_stream.send(event)
            
            # Leer respuestas y medir latencia
            first_response_time = None
            audio_response_time = None
            text_response_time = None
            timeout = 10
            start = time.time()
            
            while time.time() - start < timeout:
                try:
                    output = await asyncio.wait_for(stream.await_output(), timeout=1.0)
                    result = await output[1].receive()
                    
                    if result.value and result.value.bytes_:
                        current_time = time.perf_counter()
                        
                        if not first_response_time:
                            first_response_time = current_time
                            first_latency = (first_response_time - start_time) * 1000
                            print(f"⚡ Primera respuesta: {first_latency:.2f}ms")
                        
                        response_data = result.value.bytes_.decode('utf-8')
                        json_data = json.loads(response_data)
                        
                        if 'event' in json_data:
                            event_type = list(json_data['event'].keys())[0]
                            
                            if event_type == 'audioOutput' and not audio_response_time:
                                audio_response_time = current_time
                                audio_latency = (audio_response_time - start_time) * 1000
                                audio_content = json_data['event']['audioOutput'].get('content', '')
                                if audio_content:
                                    audio_resp = base64.b64decode(audio_content)
                                    print(f"🔊 Audio recibido: {len(audio_resp)} bytes en {audio_latency:.2f}ms")
                            
                            elif event_type == 'textOutput' and not text_response_time:
                                text_response_time = current_time
                                text_latency = (text_response_time - start_time) * 1000
                                text = json_data['event']['textOutput'].get('content', '')
                                print(f"📝 Texto recibido: '{text[:50]}...' en {text_latency:.2f}ms")
                            
                            elif event_type == 'completionEnd':
                                total_time = (current_time - start_time) * 1000
                                print(f"✅ Completado en {total_time:.2f}ms")
                                break
                                
                except asyncio.TimeoutError:
                    continue
                except Exception as e:
                    print(f"Error leyendo respuesta: {e}")
                    break
            
            # Cerrar sesión
            session_end = json.dumps({
                "event": {
                    "sessionEnd": {}
                }
            })
            
            event = InvokeModelWithBidirectionalStreamInputChunk(
                value=BidirectionalInputPayloadPart(bytes_=session_end.encode('utf-8'))
            )
            await stream.input_stream.send(event)
            await stream.input_stream.close()
            
            # Guardar latencias
            if first_response_time:
                latencies.append({
                    'first': (first_response_time - start_time) * 1000,
                    'audio': (audio_response_time - start_time) * 1000 if audio_response_time else None,
                    'text': (text_response_time - start_time) * 1000 if text_response_time else None
                })
            
            print("-" * 50)
            
            # Esperar entre pruebas
            if test_num < num_tests:
                await asyncio.sleep(2)
                
        except Exception as e:
            print(f"❌ Error en test {test_num}: {e}")
    
    # Mostrar estadísticas
    if latencies:
        print("\n" + "=" * 60)
        print("📊 ESTADÍSTICAS DE LATENCIA")
        print("=" * 60)
        
        first_times = [l['first'] for l in latencies if l['first']]
        audio_times = [l['audio'] for l in latencies if l['audio']]
        text_times = [l['text'] for l in latencies if l['text']]
        
        if first_times:
            print(f"\n🚀 Primera Respuesta:")
            print(f"  Min:    {min(first_times):.2f}ms")
            print(f"  Max:    {max(first_times):.2f}ms")
            print(f"  Promedio: {sum(first_times)/len(first_times):.2f}ms")
        
        if audio_times:
            print(f"\n🔊 Respuesta de Audio:")
            print(f"  Min:    {min(audio_times):.2f}ms")
            print(f"  Max:    {max(audio_times):.2f}ms")
            print(f"  Promedio: {sum(audio_times)/len(audio_times):.2f}ms")
        
        if text_times:
            print(f"\n📝 Respuesta de Texto:")
            print(f"  Min:    {min(text_times):.2f}ms")
            print(f"  Max:    {max(text_times):.2f}ms")
            print(f"  Promedio: {sum(text_times)/len(text_times):.2f}ms")
        
        # Evaluación
        avg_first = sum(first_times)/len(first_times) if first_times else 0
        
        print("\n" + "-" * 60)
        print("🎯 EVALUACIÓN DE RENDIMIENTO:")
        
        if avg_first < 100:
            print("✅ EXCELENTE - Latencia sub-100ms!")
            print("   Ideal para conversaciones en tiempo real")
        elif avg_first < 300:
            print("✅ BUENO - Baja latencia")
            print("   Adecuado para interacciones fluidas")
        elif avg_first < 500:
            print("⚠️  ACEPTABLE - Latencia moderada")
            print("   Los usuarios notarán un pequeño retraso")
        else:
            print("❌ ALTA LATENCIA")
            print("   Puede impactar la experiencia del usuario")
        
        print(f"\n🏆 Latencia promedio primera respuesta: {avg_first:.2f}ms")
        print("=" * 60)

if __name__ == "__main__":
    asyncio.run(test_latency())