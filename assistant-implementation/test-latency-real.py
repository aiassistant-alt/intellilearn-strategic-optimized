#!/usr/bin/env python3
"""
Test de latencia real de Nova Sonic con audio
Mide el tiempo de respuesta end-to-end
"""

import asyncio
import websockets
import json
import base64
import time
import numpy as np
import boto3
from datetime import datetime
import statistics

# Configuración
WS_URL = "ws://assistant-impl-alb-1961690535.us-east-1.elb.amazonaws.com/ws"
COGNITO_CLIENT_ID = "1juckgedu0gf5qv8fommh486bh"
TEST_USERNAME = "demo@intellilearn.com"
TEST_PASSWORD = "Demo2025!"

class LatencyTester:
    def __init__(self):
        self.latencies = []
        self.cognito = boto3.client('cognito-idp', region_name='us-east-1')
        
    def authenticate(self):
        """Autenticar con Cognito"""
        try:
            response = self.cognito.initiate_auth(
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
    
    def generate_test_audio(self, duration=0.5, text="Hello"):
        """Generar audio de prueba con marcador temporal"""
        sample_rate = 16000
        
        # Crear tono único para identificación (440Hz + timestamp modulado)
        timestamp_freq = int(time.time() % 1000)  # Frecuencia única basada en timestamp
        frequency = 440 + timestamp_freq / 10
        
        t = np.linspace(0, duration, int(sample_rate * duration))
        
        # Señal con marcador temporal
        audio_signal = np.sin(2 * np.pi * frequency * t) * 0.3
        
        # Agregar pulso inicial para marcar inicio
        pulse_duration = 0.01  # 10ms pulse
        pulse_samples = int(sample_rate * pulse_duration)
        audio_signal[:pulse_samples] *= 3  # Amplificar pulso inicial
        
        audio_data = (audio_signal * 32767).astype(np.int16)
        
        return audio_data.tobytes(), frequency
    
    async def test_single_request(self, websocket, session_id):
        """Realizar una sola prueba de latencia"""
        
        # Generar audio de prueba
        audio_bytes, marker_freq = self.generate_test_audio()
        
        # Marcar tiempo de inicio
        start_time = time.perf_counter()
        
        # Enviar audio
        audio_b64 = base64.b64encode(audio_bytes).decode()
        await websocket.send(json.dumps({
            "type": "audio_input",
            "audioData": audio_b64,
            "endOfUtterance": True,
            "timestamp": start_time
        }))
        
        print(f"📤 Sent {len(audio_bytes)} bytes at {datetime.now().strftime('%H:%M:%S.%f')[:-3]}")
        
        # Esperar respuesta
        response_received = False
        first_response_time = None
        audio_response_time = None
        text_response_time = None
        
        try:
            while time.perf_counter() - start_time < 10:  # Timeout 10 segundos
                response = await asyncio.wait_for(websocket.recv(), timeout=1.0)
                data = json.loads(response)
                msg_type = data.get("type")
                
                current_time = time.perf_counter()
                
                if not first_response_time:
                    first_response_time = current_time
                
                if msg_type == "audio_output":
                    if not audio_response_time:
                        audio_response_time = current_time
                        audio_latency = (audio_response_time - start_time) * 1000
                        print(f"🔊 Audio response in {audio_latency:.2f}ms")
                    
                    # Decodificar y analizar audio
                    audio_resp = base64.b64decode(data.get("audio", ""))
                    print(f"   Received {len(audio_resp)} bytes")
                    
                elif msg_type == "transcript":
                    if not text_response_time:
                        text_response_time = current_time
                        text_latency = (text_response_time - start_time) * 1000
                        text = data.get("text", "")[:100]
                        print(f"📝 Text response in {text_latency:.2f}ms: {text}")
                    
                elif msg_type == "inference_complete":
                    total_time = (current_time - start_time) * 1000
                    print(f"✅ Complete in {total_time:.2f}ms")
                    response_received = True
                    break
                    
                elif msg_type == "error":
                    print(f"❌ Error: {data.get('error')}")
                    break
                    
        except asyncio.TimeoutError:
            pass
        
        # Calcular latencias
        if first_response_time:
            first_byte_latency = (first_response_time - start_time) * 1000
            self.latencies.append({
                'first_byte': first_byte_latency,
                'audio': (audio_response_time - start_time) * 1000 if audio_response_time else None,
                'text': (text_response_time - start_time) * 1000 if text_response_time else None,
                'total': (time.perf_counter() - start_time) * 1000
            })
            return first_byte_latency
        
        return None
    
    async def run_latency_test(self, num_tests=5):
        """Ejecutar pruebas de latencia"""
        
        print("=" * 60)
        print("🎯 NOVA SONIC LATENCY TEST")
        print("=" * 60)
        
        # Autenticar
        print("\n🔐 Authenticating...")
        token = self.authenticate()
        if not token:
            return
        
        print("✅ Authenticated")
        
        try:
            print(f"\n🔌 Connecting to: {WS_URL}")
            async with websockets.connect(WS_URL, max_size=10*1024*1024) as websocket:
                print("✅ Connected")
                
                # Recibir confirmación
                response = await websocket.recv()
                data = json.loads(response)
                print(f"📨 {data.get('type')}")
                
                # Inicializar sesión
                await websocket.send(json.dumps({
                    "type": "initialize_session",
                    "authToken": token,
                    "userId": TEST_USERNAME
                }))
                
                # Esperar confirmación de sesión
                session_id = None
                for _ in range(5):
                    response = await asyncio.wait_for(websocket.recv(), timeout=2.0)
                    data = json.loads(response)
                    
                    if data.get("type") == "session_initialized":
                        session_id = data.get("sessionId")
                        print(f"✅ Session: {session_id}\n")
                        break
                
                if not session_id:
                    print("❌ Failed to initialize session")
                    return
                
                # Realizar pruebas de latencia
                print(f"📊 Running {num_tests} latency tests...\n")
                print("-" * 50)
                
                for i in range(num_tests):
                    print(f"\n🧪 Test {i+1}/{num_tests}:")
                    latency = await self.test_single_request(websocket, session_id)
                    
                    if latency:
                        print(f"⏱️  First byte latency: {latency:.2f}ms")
                    else:
                        print("❌ No response received")
                    
                    # Esperar entre pruebas
                    if i < num_tests - 1:
                        await asyncio.sleep(2)
                
                # Cerrar sesión
                await websocket.send(json.dumps({"type": "end_session"}))
                
        except Exception as e:
            print(f"❌ Error: {e}")
        
        # Mostrar estadísticas
        self.show_statistics()
    
    def show_statistics(self):
        """Mostrar estadísticas de latencia"""
        
        if not self.latencies:
            print("\n❌ No latency data collected")
            return
        
        print("\n" + "=" * 60)
        print("📊 LATENCY STATISTICS")
        print("=" * 60)
        
        # Extraer métricas
        first_byte_times = [l['first_byte'] for l in self.latencies if l['first_byte']]
        audio_times = [l['audio'] for l in self.latencies if l['audio']]
        text_times = [l['text'] for l in self.latencies if l['text']]
        total_times = [l['total'] for l in self.latencies if l['total']]
        
        def print_stats(name, times):
            if times:
                print(f"\n{name}:")
                print(f"  Min:    {min(times):.2f}ms")
                print(f"  Max:    {max(times):.2f}ms")
                print(f"  Mean:   {statistics.mean(times):.2f}ms")
                print(f"  Median: {statistics.median(times):.2f}ms")
                if len(times) > 1:
                    print(f"  StdDev: {statistics.stdev(times):.2f}ms")
        
        print_stats("🚀 First Byte Latency", first_byte_times)
        print_stats("🔊 Audio Response Latency", audio_times)
        print_stats("📝 Text Response Latency", text_times)
        print_stats("⏱️  Total Processing Time", total_times)
        
        # Evaluación
        print("\n" + "-" * 60)
        print("🎯 PERFORMANCE EVALUATION:")
        
        if first_byte_times:
            avg_first_byte = statistics.mean(first_byte_times)
            
            if avg_first_byte < 100:
                print("✅ EXCELLENT - Sub-100ms first byte latency!")
            elif avg_first_byte < 300:
                print("✅ GOOD - Low latency suitable for real-time")
            elif avg_first_byte < 500:
                print("⚠️  ACCEPTABLE - Some delay noticeable")
            else:
                print("❌ HIGH LATENCY - May impact user experience")
            
            print(f"\n📈 Average first byte: {avg_first_byte:.2f}ms")
            
            # Calcular percentiles
            if len(first_byte_times) > 2:
                sorted_times = sorted(first_byte_times)
                p50 = sorted_times[len(sorted_times)//2]
                p90 = sorted_times[int(len(sorted_times)*0.9)]
                p99 = sorted_times[int(len(sorted_times)*0.99)] if len(sorted_times) > 10 else sorted_times[-1]
                
                print(f"📊 P50: {p50:.2f}ms | P90: {p90:.2f}ms | P99: {p99:.2f}ms")

async def main():
    """Función principal"""
    
    # Verificar numpy
    try:
        import numpy
    except ImportError:
        print("Installing numpy...")
        import subprocess
        subprocess.check_call(["pip", "install", "numpy"])
    
    # Ejecutar pruebas
    tester = LatencyTester()
    await tester.run_latency_test(num_tests=10)

if __name__ == "__main__":
    print("Nova Sonic Real Audio Latency Test")
    print("Testing with actual audio processing...")
    asyncio.run(main())