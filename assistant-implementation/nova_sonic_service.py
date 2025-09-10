"""
Amazon Nova Sonic - MANDATORY Bidirectional Streaming
NO FALLBACKS - NO CONVERSE API - BIDIRECTIONAL ONLY
Uses automatic ECS Task Role credentials
"""

import logging
import sys
import os
import asyncio
import base64
import json
import uuid
from typing import Optional, Dict
from datetime import datetime

logger = logging.getLogger(__name__)

# MANDATORY: Fail-fast if SDK not available
try:
    from aws_sdk_bedrock_runtime.client import BedrockRuntimeClient, InvokeModelWithBidirectionalStreamOperationInput
    from aws_sdk_bedrock_runtime.models import (
        InvokeModelWithBidirectionalStreamInputChunk,
        BidirectionalInputPayloadPart,
    )
    
    logger.info("✅ SDK experimental cargado correctamente")
    logger.info("Nova Sonic: MODO=bidirectional_stream ONLY")
    SDK_AVAILABLE = True
    
except Exception as e:
    logger.exception("❌ FALLO CRÍTICO: No se pudo importar SDK bidireccional de Nova Sonic")
    logger.error(f"Error: {e}")
    logger.error("Nova Sonic REQUIERE aws_sdk_bedrock_runtime para streaming bidireccional")
    sys.exit(2)  # fail-fast: NUNCA caigas a converse()

# Verificar Python version
if sys.version_info < (3, 12):
    logger.error(f"❌ Python {sys.version_info.major}.{sys.version_info.minor} detectado. Se requiere Python 3.12+")
    sys.exit(2)

# Verificar credenciales ECS (solo para logging)
if os.environ.get('AWS_CONTAINER_CREDENTIALS_RELATIVE_URI'):
    logger.info("✅ Running in ECS with Task Role credentials")
    logger.info(f"   Credentials URI: {os.environ.get('AWS_CONTAINER_CREDENTIALS_RELATIVE_URI')}")
elif os.environ.get('AWS_ACCESS_KEY_ID'):
    logger.warning("⚠️ Using environment credentials (not recommended for ECS)")
else:
    logger.info("📍 No ECS credentials detected - SDK will use default chain")

class NovaSonicOfficialClient:
    """
    Cliente oficial Nova Sonic usando SOLO streaming bidireccional
    NO USA CONVERSE API - SOLO BIDIRECTIONAL STREAMING
    Usa credenciales automáticas de ECS Task Role
    """
    
    def __init__(self, model_id='amazon.nova-sonic-v1:0', region='us-east-1'):
        self.model_id = model_id
        self.region = region
        self.client = None
        self.stream = None
        self.response_task = None
        self.is_active = False
        
        # Unique IDs for session tracking
        self.prompt_name = None
        self.content_name = None
        self.audio_content_name = None
        
        # Response queues
        self.audio_queue = asyncio.Queue()
        self.text_queue = asyncio.Queue()
        self.event_queue = asyncio.Queue()
        
        # State tracking
        self.role = None
        self.display_assistant_text = False
        self.session_id = None
        self.content_open = False  # Track if content is currently open
        
        # Validation counters
        self.prompt_starts = 0
        self.prompt_ends = 0
        self.content_starts = 0
        self.content_ends = 0
        
        logger.info(f"✅ Nova Sonic Client initialized - BIDIRECTIONAL ONLY")
        logger.info(f"   Model: {model_id}")
        logger.info(f"   Region: {region}")
        logger.info(f"   Mode: bidirectional_stream (NOT converse)")
        logger.info(f"   Credentials: Automatic (ECS Task Role or default chain)")
    
    def _initialize_client(self):
        """
        Initialize the Bedrock client for bidirectional streaming
        USES AUTOMATIC CREDENTIALS - No manual configuration needed
        """
        try:
            # Simple initialization - let SDK handle credentials automatically
            # The SDK will use ECS Task Role credentials via AWS_CONTAINER_CREDENTIALS_RELATIVE_URI
            self.client = BedrockRuntimeClient(region=self.region)
            logger.info("✅ Bedrock Runtime client initialized with BIDIRECTIONAL streaming support")
            logger.info("   Using automatic credential resolution (ECS Task Role)")
            
            # Log which credentials are being used (for debugging)
            if os.environ.get('AWS_CONTAINER_CREDENTIALS_RELATIVE_URI'):
                logger.info(f"   ✅ ECS Task Role detected: {os.environ.get('AWS_CONTAINER_CREDENTIALS_RELATIVE_URI')}")
            
        except Exception as e:
            logger.error(f"❌ Failed to initialize Bedrock client: {e}")
            logger.error("Ensure ECS Task Role has bedrock:InvokeModelWithBidirectionalStream permission")
            raise
    
    async def send_event(self, event_json: str):
        """Send an event to the bidirectional stream"""
        if not self.stream:
            raise Exception("Stream not initialized")
        
        event = InvokeModelWithBidirectionalStreamInputChunk(
            value=BidirectionalInputPayloadPart(bytes_=event_json.encode('utf-8'))
        )
        await self.stream.input_stream.send(event)
        logger.debug(f"📤 Sent event: {event_json[:100]}...")
    
    async def start_session(self, session_config: Optional[Dict] = None) -> bool:
        """Start a new bidirectional session with Nova Sonic"""
        try:
            # Generate unique IDs for this session
            self.session_id = str(uuid.uuid4())
            self.prompt_name = str(uuid.uuid4())
            self.content_name = str(uuid.uuid4())
            self.audio_content_name = str(uuid.uuid4())
            
            logger.info(f"🎯 Starting Nova Sonic BIDIRECTIONAL session: {self.session_id}")
            
            # Initialize client if needed
            if not self.client:
                self._initialize_client()
            
            # Initialize the bidirectional stream - THIS IS THE KEY
            logger.info("📡 Opening bidirectional stream with InvokeModelWithBidirectionalStream")
            self.stream = await self.client.invoke_model_with_bidirectional_stream(
                InvokeModelWithBidirectionalStreamOperationInput(model_id=self.model_id)
            )
            self.is_active = True
            logger.info("✅ Bidirectional stream opened successfully")
            
            # Default configuration
            config = session_config or {
                "maxTokens": 1024,
                "topP": 0.9,
                "temperature": 0.7
            }
            
            # Send session start event
            session_start = json.dumps({
                "event": {
                    "sessionStart": {
                        "inferenceConfiguration": config
                    }
                }
            })
            await self.send_event(session_start)
            
            # Send prompt start event
            prompt_start = json.dumps({
                "event": {
                    "promptStart": {
                        "promptName": self.prompt_name,
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
            await self.send_event(prompt_start)
            self.prompt_starts += 1
            logger.info(f"📊 Prompt started (count: {self.prompt_starts})")
            
            # Send system prompt
            text_content_start = json.dumps({
                "event": {
                    "contentStart": {
                        "promptName": self.prompt_name,
                        "contentName": self.content_name,
                        "type": "TEXT",
                        "interactive": True,
                        "role": "SYSTEM",
                        "textInputConfiguration": {
                            "mediaType": "text/plain"
                        }
                    }
                }
            })
            await self.send_event(text_content_start)
            
            # Send system prompt text
            system_prompt = (
                "You are an educational AI assistant helping students learn. "
                "Respond naturally and helpfully to their questions. "
                "Keep responses concise and clear, generally two or three sentences."
            )
            
            text_input = json.dumps({
                "event": {
                    "textInput": {
                        "promptName": self.prompt_name,
                        "contentName": self.content_name,
                        "content": system_prompt
                    }
                }
            })
            await self.send_event(text_input)
            
            # End system prompt
            text_content_end = json.dumps({
                "event": {
                    "contentEnd": {
                        "promptName": self.prompt_name,
                        "contentName": self.content_name
                    }
                }
            })
            await self.send_event(text_content_end)
            
            # Start processing responses
            self.response_task = asyncio.create_task(self._process_responses())
            
            logger.info(f"✅ BIDIRECTIONAL session {self.session_id} started successfully")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to start BIDIRECTIONAL session: {e}")
            logger.error("Check ECS Task Role permissions for bedrock:InvokeModelWithBidirectionalStream")
            self.is_active = False
            return False
    
    async def start_audio_input(self):
        """Start audio input stream"""
        # Check if content is already open
        if self.content_open:
            logger.warning("⚠️ Content already open, closing previous")
            await self.end_audio_input()
        
        # Generate new content name for this audio input
        self.audio_content_name = str(uuid.uuid4())
        
        audio_content_start = json.dumps({
            "event": {
                "contentStart": {
                    "promptName": self.prompt_name,
                    "contentName": self.audio_content_name,
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
        await self.send_event(audio_content_start)
        self.content_open = True
        self.content_starts += 1
        logger.info(f"🎤 Audio input started - content={self.audio_content_name}, interactive=True")
        logger.info(f"📊 Content started (starts={self.content_starts}, ends={self.content_ends})")
    
    async def send_audio_chunk(self, audio_bytes: bytes):
        """Send an audio chunk to the bidirectional stream"""
        if not self.is_active:
            return
        
        # Reject frames if content is not open
        if not self.content_open or not self.audio_content_name:
            logger.warning("⚠️ Rejecting audio chunk - no open content")
            return
        
        blob = base64.b64encode(audio_bytes).decode('utf-8')
        audio_event = json.dumps({
            "event": {
                "audioInput": {
                    "promptName": self.prompt_name,
                    "contentName": self.audio_content_name,
                    "content": blob
                }
            }
        })
        await self.send_event(audio_event)
        logger.debug(f"📤 Sent audio chunk: {len(audio_bytes)} bytes")
    
    async def end_audio_input(self):
        """End audio input stream - properly close the turn"""
        if not self.prompt_name or not self.audio_content_name:
            logger.warning("⚠️ No active prompt/content to close")
            return
            
        # Store names for logging
        closing_prompt = self.prompt_name
        closing_content = self.audio_content_name
        
        # First, send contentEnd to close the audio content
        audio_content_end = json.dumps({
            "event": {
                "contentEnd": {
                    "promptName": closing_prompt,
                    "contentName": closing_content
                }
            }
        })
        await self.send_event(audio_content_end)
        self.content_ends += 1
        logger.info(f"📝 Sent contentEnd for content={closing_content}")
        logger.info(f"📊 Content ended (starts={self.content_starts}, ends={self.content_ends})")
        
        # Then, send promptEnd to close the entire prompt turn
        prompt_end = json.dumps({
            "event": {
                "promptEnd": {
                    "promptName": closing_prompt
                }
            }
        })
        await self.send_event(prompt_end)
        self.prompt_ends += 1
        logger.info(f"✅ Sent promptEnd for prompt={closing_prompt} - turn closed")
        logger.info(f"📊 Prompt ended (starts={self.prompt_starts}, ends={self.prompt_ends})")
        
        # Validation check
        if self.content_starts != self.content_ends:
            logger.warning(f"⚠️ Unbalanced content: starts={self.content_starts}, ends={self.content_ends}")
        if self.prompt_starts != self.prompt_ends:
            logger.warning(f"⚠️ Unbalanced prompts: starts={self.prompt_starts}, ends={self.prompt_ends}")
        
        # Reset IDs and state to prevent reuse - force new contentStart next time
        self.audio_content_name = None
        self.content_open = False
        logger.info("🔄 Reset content state - will require new contentStart for next turn")
    
    async def _process_responses(self):
        """Process responses from the bidirectional stream"""
        try:
            while self.is_active:
                output = await self.stream.await_output()
                result = await output[1].receive()
                
                if result.value and result.value.bytes_:
                    response_data = result.value.bytes_.decode('utf-8')
                    json_data = json.loads(response_data)
                    
                    if 'event' in json_data:
                        event = json_data['event']
                        
                        # Handle content start event
                        if 'contentStart' in event:
                            content_start = event['contentStart']
                            self.role = content_start.get('role', 'ASSISTANT')
                            
                            # Check for speculative content
                            if 'additionalModelFields' in content_start:
                                try:
                                    additional = json.loads(content_start['additionalModelFields'])
                                    self.display_assistant_text = additional.get('generationStage') == 'SPECULATIVE'
                                except:
                                    pass
                            
                            logger.info(f"📝 Content started - Role: {self.role}")
                        
                        # Handle text output event
                        elif 'textOutput' in event:
                            text = event['textOutput'].get('content', '')
                            
                            # Check for barge-in
                            if '{ "interrupted" : true }' in text:
                                logger.info("🛑 Barge-in detected!")
                                await self.event_queue.put({"type": "barge_in"})
                            
                            # Queue the text
                            await self.text_queue.put({
                                'role': self.role,
                                'text': text,
                                'timestamp': datetime.utcnow().isoformat()
                            })
                            
                            if self.role == "ASSISTANT" and self.display_assistant_text:
                                logger.info(f"Assistant: {text[:100]}...")
                            elif self.role == "USER":
                                logger.info(f"User: {text[:100]}...")
                        
                        # Handle audio output
                        elif 'audioOutput' in event:
                            audio_content = event['audioOutput'].get('content', '')
                            if audio_content:
                                audio_bytes = base64.b64decode(audio_content)
                                await self.audio_queue.put(audio_bytes)
                                logger.info(f"🔊 Received audio chunk: {len(audio_bytes)} bytes")
                        
                        # Handle content end
                        elif 'contentEnd' in event:
                            logger.info(f"📝 Content ended")
                            await self.event_queue.put({"type": "content_end"})
                        
                        # Handle completion end
                        elif 'completionEnd' in event:
                            logger.info("✅ Response sequence completed")
                            await self.event_queue.put({"type": "completion"})
                            
        except Exception as e:
            logger.error(f"Error processing responses: {e}")
        finally:
            logger.info(f"Response processing ended for session {self.session_id}")
    
    async def process_audio_simple(self, audio_data: bytes) -> Dict:
        """
        Simple method to process audio using BIDIRECTIONAL streaming
        THIS DOES NOT USE CONVERSE API
        """
        try:
            logger.info(f"📡 Processing audio with BIDIRECTIONAL streaming ({len(audio_data)} bytes)")
            
            # Start session if needed
            if not self.is_active:
                success = await self.start_session()
                if not success:
                    raise Exception("Failed to start BIDIRECTIONAL session")
                
                # Wait for session to initialize
                await asyncio.sleep(0.5)
            
            # Clear queues
            while not self.audio_queue.empty():
                await self.audio_queue.get()
            while not self.text_queue.empty():
                await self.text_queue.get()
            
            # Start audio input
            await self.start_audio_input()
            
            # Send audio data
            # Split into chunks if needed
            chunk_size = 4096  # 4KB chunks
            for i in range(0, len(audio_data), chunk_size):
                chunk = audio_data[i:i+chunk_size]
                await self.send_audio_chunk(chunk)
                await asyncio.sleep(0.01)  # Small delay between chunks
            
            # End audio input
            await self.end_audio_input()
            
            # Collect responses with timeout
            audio_chunks = []
            text_parts = []
            start_time = asyncio.get_event_loop().time()
            timeout = 15.0
            
            while asyncio.get_event_loop().time() - start_time < timeout:
                # Check for completion
                try:
                    event = await asyncio.wait_for(self.event_queue.get(), timeout=0.1)
                    if event.get("type") == "completion":
                        break
                except asyncio.TimeoutError:
                    pass
                
                # Collect audio
                try:
                    while not self.audio_queue.empty():
                        chunk = await self.audio_queue.get()
                        audio_chunks.append(chunk)
                except:
                    pass
                
                # Collect text
                try:
                    while not self.text_queue.empty():
                        text_data = await self.text_queue.get()
                        if text_data['role'] == 'ASSISTANT':
                            text_parts.append(text_data['text'])
                except:
                    pass
                
                # If we have both audio and text, we can return
                if audio_chunks and text_parts:
                    await asyncio.sleep(0.5)  # Wait a bit more for completion
                    break
            
            # Combine results
            combined_audio = b''.join(audio_chunks) if audio_chunks else b''
            combined_text = ' '.join(text_parts) if text_parts else ''
            
            if combined_audio or combined_text:
                logger.info(f"✅ BIDIRECTIONAL response: audio={len(combined_audio)} bytes, text={len(combined_text)} chars")
                return {
                    "success": True,
                    "audio": combined_audio,
                    "text": combined_text,
                    "metadata": {
                        "model": self.model_id,
                        "session_id": self.session_id,
                        "mode": "bidirectional_stream"
                    }
                }
            else:
                return {
                    "success": False,
                    "error": "No response received from BIDIRECTIONAL stream",
                    "audio": b'',
                    "text": ""
                }
            
        except Exception as e:
            logger.error(f"Error in BIDIRECTIONAL audio processing: {e}")
            return {
                "success": False,
                "error": str(e),
                "audio": b'',
                "text": ""
            }
    
    async def end_session(self):
        """End the bidirectional session"""
        if not self.is_active:
            return
        
        try:
            # Send prompt end
            prompt_end = json.dumps({
                "event": {
                    "promptEnd": {
                        "promptName": self.prompt_name
                    }
                }
            })
            await self.send_event(prompt_end)
            
            # Send session end
            session_end = json.dumps({
                "event": {
                    "sessionEnd": {}
                }
            })
            await self.send_event(session_end)
            
            # Close the stream
            await self.stream.input_stream.close()
            
            # Cancel response task
            if self.response_task and not self.response_task.done():
                self.response_task.cancel()
            
            self.is_active = False
            logger.info(f"🔚 BIDIRECTIONAL session {self.session_id} ended")
            
        except Exception as e:
            logger.error(f"Error ending session: {e}")