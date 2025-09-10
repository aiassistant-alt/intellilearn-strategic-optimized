"""
FastAPI WebSocket Server for Nova Sonic Real-time Voice Assistant
Production-ready implementation for ECS Fargate with ALB
USES BIDIRECTIONAL STREAMING ONLY - NO CONVERSE API
"""

import asyncio
import json
import base64
import time
import logging
import importlib
import sys
import os
from typing import Dict, Optional, Set
from datetime import datetime, timedelta
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import boto3
from botocore.exceptions import ClientError
import redis.asyncio as redis
import numpy as np
from cognito_auth import get_validator

# Logging configuration
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# STARTUP CHECK: Verify SDK is loaded
try:
    m = importlib.import_module("aws_sdk_bedrock_runtime")
    sdk_version = getattr(m, "__version__", "unknown")
    logger.info(f"✅ SDK experimental cargado: {sdk_version}")
    logger.info("✅ MODO=bidirectional_stream ONLY - NO CONVERSE API")
except ImportError as e:
    logger.error(f"❌ FALLO CRÍTICO: No se pudo cargar SDK experimental: {e}")
    logger.error("Nova Sonic REQUIERE aws_sdk_bedrock_runtime")
    sys.exit(2)

# Import Nova Sonic AFTER SDK verification
from nova_sonic_service import NovaSonicOfficialClient

# GUARD: Block any attempt to use Converse API
def guard_converse_usage(*args, **kwargs):
    logger.error("❌ INTENTO DE USAR CONVERSE API - BLOQUEADO")
    raise RuntimeError("Converse API deshabilitada para Nova Sonic - USE BIDIRECTIONAL STREAMING")

# Monkeypatch boto3 to prevent Converse usage
original_boto3_client = boto3.client
def patched_boto3_client(service_name, *args, **kwargs):
    client = original_boto3_client(service_name, *args, **kwargs)
    if service_name == "bedrock-runtime":
        if hasattr(client, "converse"):
            client.converse = guard_converse_usage
        if hasattr(client, "converse_stream"):
            client.converse_stream = guard_converse_usage
        logger.warning(f"⚠️ Bedrock client created - Converse API BLOCKED")
    return client
boto3.client = patched_boto3_client

# AWS Configuration
AWS_REGION = "us-east-1"
NOVA_MODEL_ID = "amazon.nova-sonic-v1:0"
COGNITO_USER_POOL_ID = "us-east-1_4jx4yzrZ8"
COGNITO_CLIENT_ID = "1juckgedu0gf5qv8fommh486bh"
COGNITO_REGION = "us-east-1"

# Redis Configuration
REDIS_HOST = "assistant-redis.cache.amazonaws.com"  # ElastiCache endpoint
REDIS_PORT = 6379
REDIS_DB = 0

# WebSocket Configuration
WS_HEARTBEAT_INTERVAL = 30  # seconds
WS_MAX_MESSAGE_SIZE = 10 * 1024 * 1024  # 10MB
WS_SILENCE_THRESHOLD = 4.0  # seconds
AUDIO_CHUNK_SIZE = 320  # 20ms at 16kHz

# Performance Configuration
MAX_CONCURRENT_SESSIONS = 1000
SESSION_TIMEOUT = 3600  # 1 hour
BUFFER_MAX_SIZE = 100 * 1024  # 100KB audio buffer

# Initialize AWS clients (Cognito only - NO BEDROCK CLIENT)
# Nova Sonic uses its own SDK client, not boto3
cognito_client = boto3.client(
    'cognito-idp',
    region_name=COGNITO_REGION
)

# NO bedrock_client here - Nova Sonic handles its own client

# Redis connection pool
redis_pool: Optional[redis.Redis] = None

# Active WebSocket connections
active_connections: Dict[str, WebSocket] = {}
active_sessions: Dict[str, Dict] = {}

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifecycle"""
    global redis_pool
    
    # Startup
    logger.info("Starting FastAPI Nova Sonic Assistant...")
    
    try:
        # Initialize Redis connection
        redis_pool = await redis.from_url(
            f"redis://{REDIS_HOST}:{REDIS_PORT}/{REDIS_DB}",
            encoding="utf-8",
            decode_responses=True,
            max_connections=50
        )
        await redis_pool.ping()
        logger.info("✅ Redis connected successfully")
    except Exception as e:
        logger.error(f"❌ Redis connection failed: {e}")
        redis_pool = None
    
    yield
    
    # Shutdown
    logger.info("Shutting down FastAPI Nova Sonic Assistant...")
    
    # Close all WebSocket connections
    for ws in active_connections.values():
        await ws.close()
    
    # Close Redis connection
    if redis_pool:
        await redis_pool.close()

# Initialize FastAPI app
app = FastAPI(
    title="Nova Sonic Voice Assistant",
    version="2.0.0",
    lifespan=lifespan
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://d3m4wrd20w0beh.cloudfront.net"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class HealthCheck(BaseModel):
    status: str
    timestamp: str
    active_sessions: int
    redis_connected: bool

@app.get("/health", response_model=HealthCheck)
async def health_check():
    """Health check endpoint for ALB"""
    redis_connected = False
    if redis_pool:
        try:
            await redis_pool.ping()
            redis_connected = True
        except:
            pass
    
    # Check credentials
    credentials_info = "No credentials"
    if os.environ.get('AWS_CONTAINER_CREDENTIALS_RELATIVE_URI'):
        credentials_info = f"ECS Task Role: {os.environ.get('AWS_CONTAINER_CREDENTIALS_RELATIVE_URI')}"
    elif os.environ.get('AWS_ACCESS_KEY_ID'):
        credentials_info = "Environment credentials"
    
    # Verify SDK is available
    sdk_status = "SDK not loaded"
    try:
        import aws_sdk_bedrock_runtime
        sdk_status = "SDK bidirectional ready"
    except:
        sdk_status = "SDK FAILED"
    
    logger.info(f"Health check: {credentials_info}, {sdk_status}")
    
    return HealthCheck(
        status="healthy",
        timestamp=datetime.utcnow().isoformat(),
        active_sessions=len(active_sessions),
        redis_connected=redis_connected
    )

@app.get("/metrics")
async def get_metrics():
    """Metrics endpoint for CloudWatch"""
    return {
        "active_connections": len(active_connections),
        "active_sessions": len(active_sessions),
        "timestamp": datetime.utcnow().isoformat()
    }

class AudioProcessor:
    """Handle audio processing and silence detection"""
    
    def __init__(self, session_id: str):
        self.session_id = session_id
        self.audio_buffer = bytearray()
        self.last_audio_time = time.time()
        self.silence_timer = None
        self.is_processing = False
        self.has_audio = False
        
    def add_audio(self, audio_data: bytes) -> bool:
        """Add audio to buffer and check for silence"""
        if audio_data:
            self.audio_buffer.extend(audio_data)
            self.last_audio_time = time.time()
            self.has_audio = True
        
        # Limit buffer size
        if len(self.audio_buffer) > BUFFER_MAX_SIZE:
            self.audio_buffer = self.audio_buffer[-BUFFER_MAX_SIZE:]
        
        return len(self.audio_buffer) > 0
    
    def check_silence(self) -> bool:
        """Check if silence threshold exceeded"""
        # Only check silence if we have received some audio
        if not self.has_audio:
            return False
        return (time.time() - self.last_audio_time) > WS_SILENCE_THRESHOLD
    
    def convert_to_pcm_16khz(self, audio_data: bytes) -> bytes:
        """Convert audio to PCM 16kHz mono format"""
        # For now, assume input is already PCM 16kHz
        # In production, use librosa or soundfile for conversion
        return audio_data
    
    def clear_buffer(self):
        """Clear audio buffer"""
        audio_data = bytes(self.audio_buffer)
        self.audio_buffer.clear()
        return audio_data

class NovaSession:
    """Manage Nova Sonic session"""
    
    def __init__(self, session_id: str, connection_id: str):
        self.session_id = session_id
        self.connection_id = connection_id
        self.audio_processor = AudioProcessor(session_id)
        # Initialize Nova Sonic Official Client - BIDIRECTIONAL ONLY
        self.nova_service = NovaSonicOfficialClient()
        logger.info("✅ Nova Sonic BIDIRECTIONAL Client initialized")
        logger.info("   Mode: bidirectional_stream (NOT converse)")
        self.created_at = datetime.utcnow()
        self.last_activity = datetime.utcnow()
        self.is_active = True
        self.watchdog_task = None
        self.is_listening = False
        self.INACTIVITY_THRESHOLD_MS = 2000  # 2 seconds
        
    async def start_listening(self):
        """Start listening for audio input"""
        self.is_listening = True
        self.last_activity = datetime.utcnow()
        
        # Start watchdog if not already running
        if not self.watchdog_task or self.watchdog_task.done():
            self.watchdog_task = asyncio.create_task(self.inactivity_watchdog())
            logger.info("🐕 Started inactivity watchdog")
    
    async def stop_listening(self):
        """Stop listening for audio input"""
        self.is_listening = False
        
        # Cancel watchdog
        if self.watchdog_task and not self.watchdog_task.done():
            self.watchdog_task.cancel()
            logger.info("🛑 Stopped inactivity watchdog")
    
    async def inactivity_watchdog(self):
        """Monitor for inactivity and auto-close turn if needed"""
        try:
            while self.is_listening:
                await asyncio.sleep(0.5)  # Check every 500ms
                
                # Calculate time since last activity
                elapsed_ms = (datetime.utcnow() - self.last_activity).total_seconds() * 1000
                
                if elapsed_ms > self.INACTIVITY_THRESHOLD_MS and self.is_listening:
                    logger.warning(f"⏰ Inactivity timeout ({elapsed_ms:.0f}ms) - auto-closing turn")
                    
                    # Auto-close the turn
                    if self.nova_service and self.nova_service.is_active:
                        await self.nova_service.end_audio_input()
                    
                    self.is_listening = False
                    break
                    
        except asyncio.CancelledError:
            logger.info("🐕 Watchdog cancelled")
        except Exception as e:
            logger.error(f"Watchdog error: {e}")
    
    async def process_with_nova(self, audio_data: bytes) -> Dict:
        """Process audio with Nova Sonic"""
        try:
            logger.info(f"🎤 Processing audio: {len(audio_data)} bytes")
            
            # Stop listening/watchdog
            await self.stop_listening()
            
            # Convert to PCM 16kHz
            pcm_audio = self.audio_processor.convert_to_pcm_16khz(audio_data)
            logger.info(f"🔄 Converted to PCM: {len(pcm_audio)} bytes")
            
            # Use Nova Sonic service - MANDATORY bidirectional streaming
            logger.info(f"📤 Sending to Nova Sonic with BIDIRECTIONAL streaming")
            logger.info(f"   Using InvokeModelWithBidirectionalStream API")
            logger.info(f"   NOT using Converse API")
            
            # Verify method exists
            if not hasattr(self.nova_service, 'process_audio_simple'):
                logger.error("❌ CRITICAL: process_audio_simple not found!")
                logger.error("❌ SDK experimental no está cargado correctamente")
                raise RuntimeError("BIDIRECTIONAL streaming es OBLIGATORIO")
            
            # Process with bidirectional streaming ONLY
            result = await self.nova_service.process_audio_simple(pcm_audio)
            
            # Log the mode used
            if result.get("metadata", {}).get("mode") != "bidirectional_stream":
                logger.error(f"❌ WRONG MODE: {result.get('metadata', {}).get('mode')}")
                raise RuntimeError("Must use bidirectional_stream mode")
            
            # Return the result from Nova Sonic service
            if result["success"]:
                logger.info(f"✅ Nova Sonic response: audio={len(result['audio'])} bytes, text={len(result['text'])} chars")
                return {
                    "audio": result["audio"],
                    "text": result["text"],
                    "success": True
                }
            else:
                logger.error(f"❌ Nova Sonic failed: {result.get('error')}")
                return {
                    "error": result.get("error", "Unknown error"),
                    "success": False
                }
            
        except Exception as e:
            logger.error(f"Nova Sonic error: {e}")
            return {
                "error": str(e),
                "success": False
            }

async def verify_auth_token(token: str) -> Optional[Dict]:
    """Verify Cognito JWT token"""
    try:
        if not token:
            logger.warning("No token provided")
            return None
        
        # Initialize Cognito validator
        validator = get_validator(
            COGNITO_USER_POOL_ID,
            COGNITO_REGION,
            COGNITO_CLIENT_ID
        )
        
        # Validate the token
        user_info = validator.validate_token(token)
        
        if user_info:
            logger.info(f"✅ Token validated for user: {user_info.get('user_id')}")
            return user_info
        else:
            logger.warning("Token validation failed")
            # For testing, allow specific test tokens
            if token == "mock-token-for-testing" or token.startswith("test-"):
                logger.info("⚠️ Using test token for development")
                return {"user_id": "test_user", "email": "test@example.com"}
            return None
            
    except Exception as e:
        logger.error(f"Auth verification error: {e}")
        # Fallback for testing
        if token and (token == "mock-token-for-testing" or token.startswith("test-")):
            return {"user_id": "test_user", "email": "test@example.com"}
        return None

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """Main WebSocket endpoint for Nova Sonic"""
    connection_id = f"conn_{int(time.time() * 1000)}_{id(websocket)}"
    session_id = None
    nova_session = None
    
    try:
        # Accept WebSocket connection
        await websocket.accept()
        active_connections[connection_id] = websocket
        
        logger.info(f"✅ WebSocket connected: {connection_id}")
        
        # Send connection confirmation
        await websocket.send_json({
            "type": "connection_established",
            "connectionId": connection_id,
            "timestamp": datetime.utcnow().isoformat()
        })
        
        # Start heartbeat task
        heartbeat_task = asyncio.create_task(
            send_heartbeat(websocket, connection_id)
        )
        
        # Main message loop
        while True:
            try:
                # Receive message with timeout
                message = await asyncio.wait_for(
                    websocket.receive_json(),
                    timeout=SESSION_TIMEOUT
                )
                
                message_type = message.get("type")
                
                if message_type == "ping":
                    await websocket.send_json({"type": "pong"})
                
                elif message_type == "initialize_session":
                    # Verify authentication
                    auth_token = message.get("authToken")
                    auth_info = await verify_auth_token(auth_token)
                    
                    if not auth_info:
                        await websocket.send_json({
                            "type": "error",
                            "error": "Authentication failed"
                        })
                        continue
                    
                    # Create session
                    session_id = f"session_{int(time.time() * 1000)}"
                    nova_session = NovaSession(session_id, connection_id)
                    active_sessions[session_id] = nova_session
                    
                    # Store in Redis if available
                    if redis_pool:
                        await redis_pool.setex(
                            f"session:{session_id}",
                            SESSION_TIMEOUT,
                            json.dumps({
                                "connectionId": connection_id,
                                "createdAt": nova_session.created_at.isoformat()
                            })
                        )
                    
                    await websocket.send_json({
                        "type": "session_initialized",
                        "sessionId": session_id
                    })
                    
                    logger.info(f"✅ Session initialized: {session_id}")
                
                elif message_type == "audio_input":
                    if not nova_session:
                        await websocket.send_json({
                            "type": "error",
                            "error": "Session not initialized"
                        })
                        continue
                    
                    # Process audio input
                    audio_data = base64.b64decode(message.get("audioData", ""))
                    end_of_utterance = message.get("endOfUtterance", False)
                    
                    if audio_data:  # Regular audio chunk
                        # Add to buffer
                        nova_session.audio_processor.add_audio(audio_data)
                        # Update activity time for watchdog
                        nova_session.last_activity = datetime.utcnow()
                        
                        # Start listening if not already
                        if not nova_session.is_listening:
                            await nova_session.start_listening()
                        
                        logger.debug(f"📥 Received audio chunk: {len(audio_data)} bytes")
                    
                    # Check for end of utterance (explicit or silence-based)
                    if end_of_utterance:
                        logger.info("🔇 End of utterance detected, processing audio")
                        
                        # Process accumulated audio
                        accumulated_audio = nova_session.audio_processor.clear_buffer()
                        
                        if accumulated_audio:
                            logger.info(f"🎤 Processing {len(accumulated_audio)} bytes of audio")
                            
                            # Process with Nova Sonic
                            result = await nova_session.process_with_nova(accumulated_audio)
                            
                            if result["success"]:
                                # Send audio response
                                if result.get("audio"):
                                    await websocket.send_json({
                                        "type": "audio_output",
                                        "audio": base64.b64encode(result["audio"]).decode(),
                                        "sessionId": session_id
                                    })
                                
                                # Send text transcript
                                if result.get("text"):
                                    await websocket.send_json({
                                        "type": "transcript",
                                        "text": result["text"],
                                        "sessionId": session_id
                                    })
                                
                                # Send completion signal
                                await websocket.send_json({
                                    "type": "inference_complete",
                                    "sessionId": session_id
                                })
                            else:
                                await websocket.send_json({
                                    "type": "error",
                                    "error": result.get("error", "Processing failed")
                                })
                        else:
                            logger.warning("⚠️ No audio data to process")
                
                elif message_type == "end_session":
                    if session_id:
                        # Clean up session
                        if session_id in active_sessions:
                            del active_sessions[session_id]
                        
                        if redis_pool:
                            await redis_pool.delete(f"session:{session_id}")
                        
                        await websocket.send_json({
                            "type": "session_ended",
                            "sessionId": session_id
                        })
                    break
                
            except asyncio.TimeoutError:
                logger.warning(f"Session timeout: {connection_id}")
                break
            except WebSocketDisconnect:
                logger.info(f"WebSocket disconnected: {connection_id}")
                break
            except Exception as e:
                logger.error(f"Message processing error: {e}")
                await websocket.send_json({
                    "type": "error",
                    "error": str(e)
                })
    
    finally:
        # Cleanup
        heartbeat_task.cancel()
        
        if connection_id in active_connections:
            del active_connections[connection_id]
        
        if session_id and session_id in active_sessions:
            del active_sessions[session_id]
            if redis_pool:
                await redis_pool.delete(f"session:{session_id}")
        
        logger.info(f"🔌 Connection cleaned up: {connection_id}")

async def send_heartbeat(websocket: WebSocket, connection_id: str):
    """Send periodic heartbeat to keep connection alive"""
    try:
        while connection_id in active_connections:
            await asyncio.sleep(WS_HEARTBEAT_INTERVAL)
            await websocket.send_json({
                "type": "heartbeat",
                "timestamp": datetime.utcnow().isoformat()
            })
    except Exception as e:
        logger.error(f"Heartbeat error: {e}")

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        ws="websockets",
        ws_max_size=WS_MAX_MESSAGE_SIZE,
        log_level="info",
        access_log=True,
        use_colors=True,
        reload=False  # Disable in production
    )