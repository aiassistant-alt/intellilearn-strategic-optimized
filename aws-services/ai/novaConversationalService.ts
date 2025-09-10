/**
 * ^NovaConversationalService
 * Author: Luis Arturo Parra - Telmo AI
 * Created: 2025-08-01
 * Last Modified: 2025-09-10
 * Context: Amazon Nova Sonic bidirectional voice AI integration for educational platform
 * Usage: Real-time voice conversations with VAD, turn management, and strategic logging
 * Enhancement Proposal: Add conversation analytics, student engagement metrics, multi-language support
 * 
 * Real-time bidirectional voice conversations using Amazon Nova Sonic.
 * Implements AWS official async generator pattern with optimized PCM16 audio processing.
 * 
 * Features:
 * - Web Audio API + AudioWorklet for PCM16 capture (16kHz → 24kHz)
 * - Voice Activity Detection (VAD) with RMS threshold optimization
 * - Strategic logging system to prevent browser freeze
 * - Proper turn-taking with contentEnd → promptEnd sequence
 * - Educational context integration for personalized learning
 * - Buffer management for stable audio streaming
 * 
 * Architecture:
 * - Frontend: Web Audio API + AudioWorklet for ultra-low latency PCM16 audio
 * - Backend: Direct AWS Bedrock Runtime with amazon.nova-sonic-v1:0 model
 * - Streaming: Async generator pattern per AWS workshop recommendations
 * - Logging: Strategic buffered logging to prevent console spam during audio processing
 */

import { 
  BedrockRuntimeClient,
  InvokeModelWithBidirectionalStreamCommand
} from '@aws-sdk/client-bedrock-runtime'
import { awsCredentialsService } from '../auth/awsCredentialsService'
import { logger } from '../utils/strategicLogger'

// Audio configuration constants (per AWS Nova Sonic requirements)
const INPUT_SAMPLE_RATE = 16000 // Nova Sonic requires 16kHz
const OUTPUT_SAMPLE_RATE = 24000
const CHANNELS = 1 // Mono
const NOVA_SONIC_MODEL_ID = 'amazon.nova-sonic-v1:0'

// VAD (Voice Activity Detection) parameters
const FRAME_MS = 30 // Process audio in 30ms frames
const SILENCE_THRESHOLD_MS = 1200 // ✅ FIX E: Reducido de 2000ms - con jitter-buffer no necesitas tanto
const INITIAL_SILENCE_MS = 4000 // 4 seconds initial silence timeout
const RMS_THRESHOLD = 0.008 // ✅ FIX E: Bajado de 0.015 - evita cortes con mics silenciosos

// ✅ FIX B: Processing parameters for stable pacing
const MAX_EVENT_QUEUE = 12 // Back-pressure control
const TARGET_SAMPLES = 1600 // 100ms @ 16kHz for stable chunks
const PACER_MS = 12 // Check ~80Hz; send only when TARGET ready

// Event queue for async generator
interface QueueEvent {
  event: any
}

export interface NovaConversationSession {
  sessionId: string
  isActive: boolean
  client?: BedrockRuntimeClient
  stream?: any
  audioContext?: AudioContext
  audioWorklet?: AudioWorkletNode
  source?: MediaStreamAudioSourceNode
  
  // Event management
  promptName: string
  contentName: string
  audioContentName: string
  eventQueue: QueueEvent[]
  eventQueueResolver: ((value: QueueEvent | null) => void) | null
  isStreamComplete: boolean
  
  // VAD state
  isRecording: boolean
  silentMs: number
  lastRMS: number
  vadState: 'SILENT' | 'ACTIVE'
  audioStartTime: number
  hasAudioContent: boolean
  txHold?: Int16Array | null  // ✅ FIX #3: Acumulador para frames de ~32ms
  workletRegistered?: boolean  // ✅ FIX: Flag para evitar re-registro del AudioWorklet
  lastFrameTs?: number  // ✅ FIX: Timestamp real del AudioWorklet para VAD preciso
  _pacer?: NodeJS.Timeout  // ✅ FIX B: Timer para pacing estable
  vadLogCounter?: number  // Strategic logging counter to prevent VAD spam
  
  // Educational context
  courseId?: string
  topic?: string
  studentId?: string
  
  // Timers - ✅ FIX #5: Browser-compatible timer types
  initialSilenceTimer?: ReturnType<typeof setTimeout>
  vadSilenceTimer?: ReturnType<typeof setTimeout>
}

export interface NovaConfig {
  maxTokens?: number
  temperature?: number
  courseId?: string
  topic?: string
  studentId?: string
  systemPrompt?: string
}

class NovaConversationalService {
  private sessions: Map<string, NovaConversationSession> = new Map()
  // ✅ FIX: Removed global audioWorkletInitialized - now per-session workletRegistered

  /**
   * Initialize Web Audio API and AudioWorklet for PCM16 capture
   */
  private async initializeAudioWorklet(session: NovaConversationSession): Promise<void> {
    if (!session.audioContext) {
      session.audioContext = new AudioContext({ sampleRate: INPUT_SAMPLE_RATE })
    }

    // ✅ FIX #1: Registrar AudioWorklet solo una vez por contexto
    if (!session.workletRegistered) {
      // Create inline AudioWorklet processor for PCM16 capture
      const processorCode = `
        class PCM16Processor extends AudioWorkletProcessor {
          constructor() {
            super();
            this.bufferSize = 512; // ~32ms at 16kHz
            this.buffer = [];
            this.frameCount = 0;
            this.lastLogTime = 0;
          }

          process(inputs, outputs, parameters) {
            this.frameCount++;
            const input = inputs[0];
            
            // Context: Strategic logging every ~3 seconds to monitor AudioWorklet health
            // Last Modified: 2025-09-10 by Luis Arturo Parra
            // Usage: Prevents console spam while maintaining audio pipeline visibility
            // Enhancement: Add audio quality metrics, buffer health monitoring
            if (this.frameCount % 300 === 0) { // Reduced frequency: every ~9 seconds
              logger.audio('AudioWorklet health check', {
                frameCount: this.frameCount,
                hasInput: !!input,
                inputChannels: input?.length || 0,
                firstChannelLength: input?.[0]?.length || 0,
                sampleRate: sampleRate
              });
            }
            
            if (input && input.length) {
              // ✅ FIX #6: Downmix si el micrófono llega con 2 canales
              const ch0 = input[0] || new Float32Array(0);
              const ch1 = input[1];
              const samples = new Float32Array(ch0.length);
              
              // Downmix: (L+R)/2 si hay 2 canales, sino usar mono
              for (let i = 0; i < ch0.length; i++) {
                samples[i] = ch1 ? (ch0[i] + ch1[i]) * 0.5 : ch0[i];
              }
              
              // Context: Initial audio sample validation for debugging
              // Last Modified: 2025-09-10 by Luis Arturo Parra
              // Usage: Strategic first-samples logging to verify audio pipeline
              // Enhancement: Add audio level analysis, mic calibration suggestions
              if (this.frameCount <= 3) { // Reduced from 5 to 3 samples
                logger.audio('Initial audio samples captured', {
                  frameCount: this.frameCount,
                  samplePreview: samples.slice(0, 5), // Reduced preview size
                  channelMode: ch1 ? 'stereo-downmixed' : 'mono'
                });
              }
              
              // ✅ FIX #4: Garantizar resampling a 16kHz
              const inputRate = sampleRate;
              const targetRate = 16000;
              let processedSamples = samples;
              
              // Context: Audio resampling detection and configuration logging
              // Last Modified: 2025-09-10 by Luis Arturo Parra
              // Usage: One-time notification of resampling requirements
              // Enhancement: Add resampling quality metrics, performance monitoring
              if (this.frameCount === 1 && Math.abs(inputRate - targetRate) > 1) {
                logger.audio('Resampling required', {
                  inputRate,
                  targetRate,
                  resamplingRatio: inputRate / targetRate
                });
              }
              
              // Resample if needed
              if (Math.abs(inputRate - targetRate) > 1) {
                const ratio = inputRate / targetRate;
                const outLen = Math.floor(samples.length / ratio);
                processedSamples = new Float32Array(outLen);
                
                for (let i = 0; i < outLen; i++) {
                  const idx = i * ratio;
                  const i0 = Math.floor(idx);
                  const i1 = Math.min(i0 + 1, samples.length - 1);
                  const frac = idx - i0;
                  processedSamples[i] = samples[i0] * (1 - frac) + samples[i1] * frac;
                }
              }
              
              // Calculate RMS
              let sum = 0;
              for (let i = 0; i < processedSamples.length; i++) {
                sum += processedSamples[i] * processedSamples[i];
              }
              const rms = Math.sqrt(sum / processedSamples.length);
              
              // Convert Float32 to Int16 PCM
              const pcm16 = new Int16Array(processedSamples.length);
              for (let i = 0; i < processedSamples.length; i++) {
                const s = Math.max(-1, Math.min(1, processedSamples[i]));
                pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
              }
              
              // ✅ FIX #6: Usar transferencia de buffer para evitar copias
              this.port.postMessage({
                type: 'audio',
                pcm16: pcm16.buffer,
                rms: rms,
                timestamp: currentTime
              }, [pcm16.buffer]);
            }
            
            return true; // Keep processor alive
          }
        }
        
        registerProcessor('pcm16-processor', PCM16Processor);
      `

      const blob = new Blob([processorCode], { type: 'application/javascript' })
      const url = URL.createObjectURL(blob)
      await session.audioContext.audioWorklet.addModule(url)
      URL.revokeObjectURL(url)
      session.workletRegistered = true
    }

    // Crear o recrear AudioWorklet node (se puede recrear por turno)
    if (session.audioWorklet) {
      session.audioWorklet.disconnect()
    }
    session.audioWorklet = new AudioWorkletNode(session.audioContext, 'pcm16-processor')
    
    // Handle messages from AudioWorklet
    session.audioWorklet.port.onmessage = (event) => {
      if (event.data.type === 'audio') {
        this.handleAudioFrame(session, event.data)
      }
    }
  }

  /**
   * ✅ FIX B: Base64 encoding eficiente (sin char-a-char)
   */
  private base64FromU8(u8: Uint8Array): string {
    // Chunks para evitar picos de memoria
    let bin = ''
    const CHUNK = 0x8000
    for (let i = 0; i < u8.length; i += CHUNK) {
      const chunk = u8.subarray(i, i + CHUNK) as any
      bin += String.fromCharCode.apply(null, chunk)
    }
    return btoa(bin)
  }

  /**
   * ✅ FIX B: Pacer estable para envío constante (no ráfagas)
   */
  private startPacer(session: NovaConversationSession) {
    if (session._pacer) return
    session._pacer = setInterval(() => this.pumpTx(session), PACER_MS)
    // Context: Audio pacing system initialization for stable event flow
    // Last Modified: 2025-09-10 by Luis Arturo Parra
    // Usage: Strategic audio pacing to prevent Nova Sonic buffer overflow
    // Enhancement: Adaptive pacing based on network conditions, latency monitoring
    logger.audio('Audio pacer started', { targetRate: '8-10 events/s' });
  }

  private stopPacer(session: NovaConversationSession) {
    if (session._pacer) {
      clearInterval(session._pacer)
      session._pacer = undefined
      // Context: Audio pacing system cleanup
      // Last Modified: 2025-09-10 by Luis Arturo Parra  
      // Usage: Strategic notification of pacing system shutdown
      // Enhancement: Add pacing statistics, performance metrics summary
      logger.audio('Audio pacer stopped');
    }
  }

  /**
   * ✅ FIX B: Pump estable - envía cuando hay TARGET_SAMPLES listos
   */
  private pumpTx(session: NovaConversationSession) {
    if (!session.isActive || !session.isRecording) return
    if (!session.txHold || session.txHold.length < TARGET_SAMPLES) return
    if (session.eventQueue.length >= MAX_EVENT_QUEUE) return // respeta back-pressure

    const frame = session.txHold.subarray(0, TARGET_SAMPLES)
    session.txHold = session.txHold.subarray(TARGET_SAMPLES)
    const u8 = new Uint8Array(frame.buffer, frame.byteOffset, frame.byteLength)
    const b64 = this.base64FromU8(u8)

    this.addEventToQueue(session, {
      event: {
        audioInput: {
          promptName: session.promptName,
          contentName: session.audioContentName,
          content: b64
        }
      }
    })
    
    // Context: Audio chunk transmission monitoring for pipeline health  
    // Last Modified: 2025-09-10 by Luis Arturo Parra
    // Usage: Strategic monitoring of audio data flow to Nova Sonic
    // Enhancement: Add chunk quality metrics, transmission timing analysis
    // NOTE: Strategic logging - only log occasionally to prevent spam
    logger.audio('Audio chunk transmitted', {
      samples: TARGET_SAMPLES,
      bytes: frame.byteLength,
      timestamp: Date.now()
    });
  }

  /**
   * ✅ FIX B: Flush del último bloque con base64 eficiente
   */
  private flushTxHold(session: NovaConversationSession) {
    if (!session.txHold || session.txHold.length === 0) return
    
    console.log(`[NOVA] 🚽 Flushing remaining ${session.txHold.length} samples`)
    
    const view = new Uint8Array(session.txHold.buffer, session.txHold.byteOffset, session.txHold.byteLength)
    const base64Audio = this.base64FromU8(view)  // ✅ Usar método eficiente
    
    this.addEventToQueue(session, {
      event: {
        audioInput: {
          promptName: session.promptName,
          contentName: session.audioContentName,
          content: base64Audio
        }
      }
    })
    
    console.log(`[NOVA] ⇢ audioInput (flush) bytes=${base64Audio.length}`)
    session.txHold = null
  }

  /**
   * ✅ FIX #4: Helper functions for tolerant parsing
   */
  private getTextOutput(textOutput: any): string {
    return textOutput?.text ?? textOutput?.content ?? ''
  }

  private getAudioOutput(audioOutput: any): string {
    if (!audioOutput) return ''
    if (audioOutput.content) return audioOutput.content
    
    // Handle bytes format (Uint8Array or Array<number>)
    const raw = audioOutput.bytes?.data ?? audioOutput.bytes
    if (raw) {
      const u8 = raw instanceof Uint8Array ? raw : new Uint8Array(raw)
      let bin = ''
      for (let i = 0; i < u8.length; i++) {
        bin += String.fromCharCode(u8[i])
      }
      return btoa(bin)
    }
    return ''
  }

  /**
   * Handle audio frame from AudioWorklet
   */
  private handleAudioFrame(session: NovaConversationSession, data: any) {
    if (!session.isActive || !session.isRecording) return

    const rms = data.rms
    const pcm16Buffer = new Int16Array(data.pcm16)
    const timestamp = data.timestamp // timestamp real del AudioContext
    
    // ✅ FIX #3: VAD basado en tiempo real, no FRAME_MS fijo
    let deltaMs = FRAME_MS // fallback
    if (session.lastFrameTs !== undefined) {
      deltaMs = Math.max(0, (timestamp - session.lastFrameTs) * 1000)
    }
    session.lastFrameTs = timestamp
    
    // VAD: Check if audio is above threshold
    const isSilent = rms < RMS_THRESHOLD
    const prevState = session.vadState
    
    if (isSilent) {
      session.silentMs += deltaMs // usar tiempo real
      session.vadState = 'SILENT'
    } else {
      // Voice activity detected
      if (session.silentMs > 0) {
        // Context: VAD timer reset on audio activity detection
        // Last Modified: 2025-09-10 by Luis Arturo Parra
        // Usage: Strategic VAD activity logging - only on state changes
        // Enhancement: Add silence pattern analysis, activity duration tracking
        logger.vad('Timer reset on audio activity', { rms: parseFloat(rms.toFixed(4)) });
      }
      session.silentMs = 0
      session.vadState = 'ACTIVE'
      session.hasAudioContent = true
      
      // Clear initial silence timer if voice detected
      if (session.initialSilenceTimer) {
        clearTimeout(session.initialSilenceTimer)
        session.initialSilenceTimer = undefined
      }
      
      if (prevState === 'SILENT') {
        // Context: Voice activity start detection - important milestone
        // Last Modified: 2025-09-10 by Luis Arturo Parra
        // Usage: Log significant VAD state transitions for debugging
        // Enhancement: Add voice quality assessment, background noise analysis  
        logger.vad('Voice activity started', { transition: 'SILENT->ACTIVE' });
      }
    }

    // Log VAD state
    // Context: Voice Activity Detection monitoring - HIGH FREQUENCY FUNCTION
    // Last Modified: 2025-09-10 by Luis Arturo Parra
    // Usage: Strategic VAD logging to prevent console spam during continuous audio
    // Enhancement: Add VAD accuracy metrics, false positive/negative tracking
    // NOTE: Strategic logging - only every 50th call to prevent browser freeze
    if (typeof session.vadLogCounter === 'undefined') session.vadLogCounter = 0;
    session.vadLogCounter++;
    
    if (session.vadLogCounter % 50 === 0) { // Log every 50th VAD check (~1.5 seconds)
      logger.vad('VAD state monitoring', {
        rms: parseFloat(rms.toFixed(4)),
        threshold: RMS_THRESHOLD,
        silentFor: session.silentMs,
        state: session.vadState,
        logCounter: session.vadLogCounter
      });
    }
    
    // Check for end of utterance
    if (session.silentMs >= SILENCE_THRESHOLD_MS && session.hasAudioContent) {
      // Context: End of utterance detection - critical for turn management
      // Last Modified: 2025-09-10 by Luis Arturo Parra
      // Usage: Important VAD event for Nova Sonic turn completion
      // Enhancement: Add utterance quality metrics, confidence scoring
      logger.vad('End of utterance detected', { 
        silentFor: session.silentMs, 
        threshold: SILENCE_THRESHOLD_MS,
        turnDuration: Date.now() - session.audioStartTime
      });
      this.endTurn(session, 'vadsilence')
      session.silentMs = 0
    }
    
    // ✅ FIX B: Acumular en txHold para pacing estable (no enviar inmediatamente)
    this.accumulateAudioForPacing(session, pcm16Buffer)
    
    session.lastRMS = rms
  }
  
  /**
   * ✅ FIX B: Acumular audio para pacing estable
   */
  private accumulateAudioForPacing(session: NovaConversationSession, pcm16Buffer: Int16Array) {
    if (!session.txHold) {
      session.txHold = pcm16Buffer
    } else {
      // Concatenar con buffer existente
      const combined = new Int16Array(session.txHold.length + pcm16Buffer.length)
      combined.set(session.txHold, 0)
      combined.set(pcm16Buffer, session.txHold.length)
      session.txHold = combined
    }
    
    console.log(`📦 Audio accumulated: ${session.txHold.length} samples total`)
  }

  /**
   * Send PCM16 audio to Nova Sonic
   */
  private sendAudioToNova(session: NovaConversationSession, pcm16Buffer: Int16Array) {
    if (!session.isActive || !session.isRecording || session.isStreamComplete) return
    
    // ✅ FIX #3: Implementa acumulador para frames de ~32ms (512 muestras)
    const TARGET = 512  // ~32ms at 16kHz
    
    // Helper function to concatenate Int16Arrays
    const concat = (a: Int16Array, b: Int16Array) => {
      const out = new Int16Array(a.length + b.length)
      out.set(a)
      out.set(b, a.length)
      return out
    }
    
    // Accumulate samples
    session.txHold = session.txHold ? concat(session.txHold, pcm16Buffer) : pcm16Buffer
    
    // ✅ FIX #2: Back-pressure - no encolar si hay muchos eventos pendientes
    while (session.txHold && session.txHold.length >= TARGET) {
      // ⛔ Back-pressure: si hay muchos eventos en vuelo, no encolar más audioInput
      if (session.eventQueue.length >= MAX_EVENT_QUEUE) {
        console.log(`[NOVA] ⏸️ Back-pressure: queue=${session.eventQueue.length}, manteniendo ${session.txHold.length} samples en buffer`)
        break // Mantener samples en txHold para próximo intento o flush
      }
      
      const frame = session.txHold.subarray(0, TARGET)
      const rest = session.txHold.subarray(TARGET)
      
      // Convert to base64 safely without spread operator
      const view = new Uint8Array(frame.buffer, frame.byteOffset, frame.byteLength)
      let bin = ''
      for (let i = 0; i < view.length; i++) {
        bin += String.fromCharCode(view[i])
      }
      const base64Audio = btoa(bin)
      
      // Queue audio input event
      this.addEventToQueue(session, {
        event: {
          audioInput: {
            promptName: session.promptName,
            contentName: session.audioContentName,
            content: base64Audio
          }
        }
      })
      
      console.log(`[NOVA] ⇢ audioInput bytes=${base64Audio.length}`)
      
      // Update buffer
      session.txHold = rest.length ? new Int16Array(rest) : null
    }
  }

  /**
   * End the current turn properly
   */
  private endTurn(session: NovaConversationSession, reason: string) {
    if (!session.isRecording) return
    
    const duration = Date.now() - session.audioStartTime
    console.log(`[NOVA] ⏹ turn-close reason=${reason} ms_since_start=${duration}`)
    console.log(`[NOVA] → emit contentEnd p=${session.promptName} c=${session.audioContentName}`)
    
    // Stop recording
    session.isRecording = false
    
    // Clear timers
    if (session.initialSilenceTimer) {
      clearTimeout(session.initialSilenceTimer)
      session.initialSilenceTimer = undefined
    }
    
    // ✅ FIX #2: Flush último bloque antes de contentEnd
    this.flushTxHold(session)
    
    // Send contentEnd to trigger inference (NO promptEnd per turn)
    this.addEventToQueue(session, {
      event: {
        contentEnd: {
          promptName: session.promptName,
          contentName: session.audioContentName
        }
      }
    })
    
    // NOTE: promptEnd is only sent when ending the entire session
    // NOT after each user turn - this was causing the issue
    
    // Dispatch event for UI
    this.dispatchEvent(session.sessionId, 'turnEnd', { reason, duration })
  }

  /**
   * Add event to queue for async generator
   */
  private addEventToQueue(session: NovaConversationSession, event: QueueEvent) {
    // ✅ FIX: Validar estado de la sesión y stream antes de enviar eventos
    if (!session.isActive || session.isStreamComplete) {
      console.log('[NOVA] ⚠️ Session inactive or complete - discarding event')
      return
    }
    
    session.eventQueue.push(event)
    
    // If there's a pending resolver, resolve it immediately
    if (session.eventQueueResolver) {
      const resolver = session.eventQueueResolver
      session.eventQueueResolver = null
      const nextEvent = session.eventQueue.shift()
      if (nextEvent) {
        resolver(nextEvent)
      }
    }
  }

  /**
   * Start a new Nova Sonic conversation session
   */
  async startConversation(config: NovaConfig = {}): Promise<string> {
    try {
      console.log('🚀 Starting Nova Sonic conversation...')
      
      // 1. Get AWS credential provider (best practice per AWS Developer Guide)
              const credentialProvider = await awsCredentialsService.getCredentials()
      if (!credentialProvider) {
        throw new Error('Failed to get AWS credential provider')
      }

      const sessionId = `session_${Date.now()}`
      const promptName = `prompt_${Date.now()}`
      const contentName = `content_${Date.now()}`
      const audioContentName = `audio_content_${Date.now()}`

      // 2. Create session object with credential provider
      const session: NovaConversationSession = {
        sessionId,
        isActive: false,
        client: new BedrockRuntimeClient({
          region: 'us-east-1',
          credentials: credentialProvider // Direct credential provider - no manual mapping needed
        }),
        promptName,
        contentName,
        audioContentName,
        eventQueue: [],
        eventQueueResolver: null,
        isStreamComplete: false,
        isRecording: false,
        silentMs: 0,
        lastRMS: 0,
        vadState: 'SILENT',
        audioStartTime: 0,
        hasAudioContent: false,
        courseId: config.courseId,
        topic: config.topic,
        studentId: config.studentId
      }

      this.sessions.set(sessionId, session)

      // 3. Initialize bidirectional stream
      await this.initializeBidirectionalStream(session, config)

      console.log('✅ Nova Sonic conversation started:', sessionId)
      return sessionId

    } catch (error) {
      console.error('❌ Failed to start Nova Sonic conversation:', error)
      throw error
    }
  }

  /**
   * Initialize bidirectional streaming with Nova Sonic
   */
  private async initializeBidirectionalStream(session: NovaConversationSession, config: NovaConfig) {
    try {
      // Helper to serialize events to bytes (per AWS documentation)
      const enc = new TextEncoder()
      const toChunk = (obj: any) => ({ chunk: { bytes: enc.encode(JSON.stringify(obj)) } })
      
      // Create async generator for input stream
      async function* inputStream() {
        console.log('[NOVA] ⇢ sessionStart s=' + session.sessionId)
        // Send session start (serialized to bytes per AWS documentation)
        yield toChunk({
          event: {
            sessionStart: {
              inferenceConfiguration: {
                maxTokens: config.maxTokens || 1024,
                topP: 0.9,
                temperature: config.temperature || 0.7
              }
            }
          }
        })
        
        console.log('[NOVA] ⇢ promptStart p=' + session.promptName)
        // Send prompt start (serialized to bytes per AWS documentation)
        yield toChunk({
          event: {
            promptStart: {
              promptName: session.promptName,
              textOutputConfiguration: {
                mediaType: "text/plain"
              },
              audioOutputConfiguration: {
                mediaType: "audio/lpcm",
                sampleRateHertz: OUTPUT_SAMPLE_RATE,
                sampleSizeBits: 16,
                channelCount: CHANNELS,
                voiceId: "matthew",
                encoding: "base64",
                audioType: "SPEECH"
              }
            }
          }
        })
        
        // Send system prompt as separate content (per AWS documentation)
        const systemContentName = `system_content_${Date.now()}`
        console.log('[NOVA] ⇢ contentStart system prompt')
        yield toChunk({
          event: {
            contentStart: {
              promptName: session.promptName,
              contentName: systemContentName,
              type: "TEXT",
              interactive: false,  // ✅ Fixed: TEXT content should be non-interactive
              role: "SYSTEM",
              textInputConfiguration: {
                mediaType: "text/plain"
              }
            }
          }
        })
        
        const systemPrompt = config.systemPrompt || `You are Nova, a friendly AI voice assistant. You MUST immediately speak and greet the user when this conversation starts. Say hello and ask how you can help them today. Then, respond with speech to every user input. Keep responses short (1-2 sentences). Always speak back to the user - never stay silent. ${config.courseId ? `The student is studying course: ${config.courseId}.` : ''} ${config.topic ? `Current topic: ${config.topic}.` : ''}`
        
        console.log('[NOVA] ⇢ textInput system prompt')
        yield toChunk({
          event: {
            textInput: {
              promptName: session.promptName,
              contentName: systemContentName,
              content: systemPrompt
            }
          }
        })
        
        console.log('[NOVA] ⇢ contentEnd system prompt')
        yield toChunk({
          event: {
            contentEnd: {
              promptName: session.promptName,
              contentName: systemContentName
            }
          }
        })
        
        // ✅ KICKOFF: Micro-turno de usuario para forzar primera respuesta
        // Nova Sonic no inicia completion solo con SYSTEM - necesita turno interactivo del usuario
        const kickContentName = `kick_${Date.now()}`
        console.log('[NOVA] ⇢ contentStart kickoff (micro-turno para forzar respuesta)')
        yield toChunk({
          event: {
            contentStart: {
              promptName: session.promptName,
              contentName: kickContentName,
              type: "TEXT",
              interactive: true,  // ✅ FIX #5: TEXT interactive:true para garantizar respuesta
              role: "USER",
              textInputConfiguration: {
                mediaType: "text/plain"
              }
            }
          }
        })
        
        console.log('[NOVA] ⇢ textInput kickoff')
        yield toChunk({
          event: {
            textInput: {
              promptName: session.promptName,
              contentName: kickContentName,
              content: "Hola"  // ✅ FIX #1: Mejor que espacio en blanco para evitar recortes
            }
          }
        })
        
        console.log('[NOVA] ⇢ contentEnd kickoff (forzar completion)')
        yield toChunk({
          event: {
            contentEnd: {
              promptName: session.promptName,
              contentName: kickContentName
            }
          }
        })
        
        // NOTE: Do NOT send promptEnd here - AWS requires audio content first
        // promptEnd will be sent after audio contentEnd in the queue processing
        
        // ✅ FIX #3: Process events from queue with drain-safe closure
        while (true) {
          // ✅ si se pidió cerrar y ya no quedan eventos por enviar, salir
          if (session.isStreamComplete && session.eventQueue.length === 0) {
            console.log('[NOVA] 🛾 Drain-safe closure: stream complete and queue empty')
            break
          }
          
          // ✅ CRITICAL FIX: Check if session is still active before waiting for events
          if (!session.isActive) {
            console.log('[NOVA] ⚠️ Session no longer active, stopping generator')
            break
          }
          
          // Wait for next event in queue
          const queueEvent = await new Promise<QueueEvent | null>((resolve) => {
            if (session.eventQueue.length > 0) {
              resolve(session.eventQueue.shift()!)
            } else {
              // Store resolver for when new events arrive
              session.eventQueueResolver = resolve
            }
          })
          
          if (queueEvent === null) {
            // Signal to end stream
            break
          }
          
          // ✅ CRITICAL FIX: Double-check session state before yielding
          if (!session.isActive || session.isStreamComplete) {
            console.log('[NOVA] ⚠️ Session terminated while processing event, discarding')
            break
          }
          
          // Log the event being sent
          const eventType = Object.keys(queueEvent.event)[0]
          if (eventType === 'audioInput') {
            // Don't log full audio data
            console.log(`[NOVA] ⇢ audioInput bytes=${queueEvent.event.audioInput.content.length}`)
          } else {
            console.log(`[NOVA] ⇢ ${eventType}`, queueEvent.event[eventType])
          }
          
          yield toChunk(queueEvent)
        }
      }

      // Create bidirectional stream command with async generator
      const command = new InvokeModelWithBidirectionalStreamCommand({
        modelId: NOVA_SONIC_MODEL_ID,
        body: inputStream() as any
      })

      console.log('📤 Starting Nova Sonic bidirectional stream...')
      const response = await session.client!.send(command)
      
      if (response.body) {
        session.stream = response.body
        console.log('✅ Nova Sonic response stream established')
        
        session.isActive = true
        
        // Start processing stream responses asynchronously
        this.processNovaStreamResponses(session).catch(error => {
          console.error('❌ Error in stream processing:', error)
        })
        
        console.log('✅ Stream response processing started')
        
        // ✅ FIX C: Eliminar fallback timeout - causa barge-in killer
        // Política correcta: solo reabrir micrófono tras completionEnd del asistente
        
      } else {
        console.error('❌ No response stream from Nova Sonic')
        throw new Error('No response stream available')
      }
      
    } catch (error) {
      console.error('❌ Failed to initialize Nova Sonic bidirectional stream:', error)
      throw error
    }
  }

  /**
   * Process Nova Sonic stream responses
   */
  private async processNovaStreamResponses(session: NovaConversationSession) {
    if (!session.stream) return

    try {
      console.log('📥 Starting to process Nova Sonic stream responses...')
      
      let eventCount = 0
      
      // Process streaming events - handle the AsyncIterator properly
      try {
        for await (const event of session.stream) {
          eventCount++
          if (!session.isActive) {
            console.log('Session is no longer active, stopping response processing')
            break
          }
          
          // Context: Nova Sonic stream event debugging - HIGH FREQUENCY
          // Last Modified: 2025-09-10 by Luis Arturo Parra
          // Usage: Strategic event structure logging to prevent console spam
          // Enhancement: Add event pattern analysis, error rate monitoring
          // NOTE: Only log every 20th event to prevent browser freeze during responses
          if (eventCount % 20 === 0) {
            logger.stream(`Event batch received`, {
              eventNumber: eventCount,
              hasChunk: !!event.chunk,
              hasSessionStart: !!event.sessionStart,
              hasSessionEnd: !!event.sessionEnd,
              hasError: !!event.error,
              keys: Object.keys(event),
              batchSize: 20
            });
          }
          
          // The event might be wrapped in different ways depending on SDK version
          let bytes: Uint8Array | undefined
          
          if (event?.chunk?.bytes) {
            bytes = event.chunk.bytes
          } else if (event?.bytes) {
            bytes = event.bytes
          } else if (event?.payload) {
            // Sometimes the payload is directly the bytes
            bytes = event.payload
          }
          
          if (bytes) {
            try {
              const textResponse = new TextDecoder().decode(bytes)
              console.log('📥 Decoded response:', textResponse.substring(0, 200) + (textResponse.length > 200 ? '...' : ''))
              const jsonResponse = JSON.parse(textResponse)
              console.log('📥 Parsed JSON keys:', Object.keys(jsonResponse))
              
              // ✅ GAP #4: Verificar parsing completo de chunk.bytes → JSON
              if (!jsonResponse?.event) {
                console.warn('⚠️ Event missing in parsed JSON, skipping...')
                continue
              }
              
              if (jsonResponse.event) {
                console.log('📥 Event keys:', Object.keys(jsonResponse.event))
                
                // Log specific event types for debugging
                if (jsonResponse.event.audioOutput) {
                  console.log('🔊 FOUND audioOutput event!')
                }
                if (jsonResponse.event.contentStart) {
                  console.log('📥 FOUND contentStart event!')
                }
                if (jsonResponse.event.completionEnd) {
                  console.log('🏁 FOUND completionEnd event!')
                }
              }
            
            // Handle different event types using proper switch pattern
            const eventType = Object.keys(jsonResponse.event)[0]
            console.log(`📥 Processing event type: ${eventType}`)
            
            switch (eventType) {
              case 'completionStart':
                console.log('🎯 Nova completion started')
                this.dispatchEvent(session.sessionId, 'completionStart', jsonResponse.event.completionStart)
                break
                
              case 'contentStart':
                console.log('📥 Nova content started')
                const contentStart = jsonResponse.event.contentStart
                if (contentStart.type === 'AUDIO' && contentStart.role === 'ASSISTANT') {
                  console.log('🔊 Nova will speak - preparing audio buffer')
                }
                this.dispatchEvent(session.sessionId, 'contentStart', contentStart)
                break
                
              case 'textOutput': {
                const textContent = this.getTextOutput(jsonResponse.event.textOutput)
                console.log('📝 Nova text output:', textContent.substring(0, 50) + '...')
                this.dispatchEvent(session.sessionId, 'textOutput', { text: textContent })
                break
              }
                
              case 'audioOutput': {
                console.log('🔊 Nova audio output received - dispatching to React component')
                const base64Audio = this.getAudioOutput(jsonResponse.event.audioOutput)
                if (base64Audio) {
                  // ✅ FIX: Solo dispatch - que el componente React maneje la reproducción
                  // Eliminar doble reproducción que causa el ciclo infinito
                  this.dispatchEvent(session.sessionId, 'audioOutput', { content: base64Audio })
                } else {
                  console.warn('⚠️ audioOutput sin payload válido')
                }
                break
              }
                
              case 'contentEnd':
                console.log('📥 Nova content ended')
                this.dispatchEvent(session.sessionId, 'contentEnd', jsonResponse.event.contentEnd)
                break
                
              case 'completionEnd':
                console.log('🏁 Nova completion ended:', jsonResponse.event.completionEnd.stopReason)
                this.dispatchEvent(session.sessionId, 'completionEnd', jsonResponse.event.completionEnd)
                
                // ✅ GATING CORRECTO: Auto-restart solo después de completionEnd (turno realmente terminado)
                if (session.isActive && !session.isRecording) {
                  console.log('🔄 Completion ended - conditions met for auto-restart')
                  setTimeout(() => {
                    console.log('🔄 AUTO-RESTART: Starting audio capture for next turn')
                    
                    // Generate new IDs for next turn (NO promptStart - mantener el mismo prompt)
                    session.contentName = `content_${Date.now()}`
                    session.audioContentName = `audio_content_${Date.now()}`
                    
                    console.log(`  - Keeping prompt: ${session.promptName}`)
                    console.log(`  - New content: ${session.contentName}`)
                    console.log(`  - New audio content: ${session.audioContentName}`)
                    
                    this.startAudioCapture(session.sessionId).catch(err => {
                      console.error('❌ Failed to restart audio capture:', err)
                    })
                  }, 600) // Small delay to ensure Nova has finished processing
                } else {
                  console.log(`⚠️ Not auto-restarting after completion: Active=${session.isActive}, Recording=${session.isRecording}`)
                }
                break
                
              case 'usageEvent':
                // Just log usage events, don't dispatch
                const usage = jsonResponse.event.usageEvent.details.delta
                console.log(`💰 Usage: input(speech:${usage.input.speechTokens}, text:${usage.input.textTokens}) output(speech:${usage.output.speechTokens}, text:${usage.output.textTokens})`)
                break
                
              default:
                console.log(`❓ Unknown event type: ${eventType}`)
            }
            
            // Legacy contentEnd handling (NO auto-restart - moved to completionEnd)
            if (jsonResponse.event?.contentEnd) {
              console.log(`  - Session active: ${session.isActive}`)
              console.log(`  - Currently recording: ${session.isRecording}`)
              console.log('  - Auto-restart moved to completionEnd for proper gating')
              
            } else if (jsonResponse.event?.sessionEnd) {
              console.log('📥 Session ended')
              this.dispatchEvent(session.sessionId, 'sessionEnd', jsonResponse.event.sessionEnd)
              session.isActive = false
            }
            
            } catch (parseError) {
              console.error('Parse error:', parseError)
              console.log('Raw bytes length:', bytes?.length)
            }
          } else {
            console.log('⚠️ Event without bytes, structure:', {
              hasChunk: !!event?.chunk,
              hasBytes: !!event?.bytes,
              hasPayload: !!event?.payload,
              eventKeys: event ? Object.keys(event) : []
            })
          }
        }
      } catch (iteratorError) {
        console.error('❌ Error iterating stream:', iteratorError)
        // This might be the serialization error - log more details
        console.log('Stream object:', session.stream)
      }
      
      console.log(`📥 Stream processing completed. Total events: ${eventCount}`)

    } catch (error) {
      console.error('❌ Error processing Nova Sonic stream:', error)
    }
  }

  /**
   * Start audio capture with Web Audio API
   */
  async startAudioCapture(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId)
    if (!session || !session.isActive) {
      throw new Error('Invalid or inactive session')
    }

    try {
      console.log('🎤 Starting audio capture with Web Audio API')
      console.log('[AUDIO] format=pcm16 sampleRate=16000 channels=1 interactive=true')

      // Always reinitialize audio context and worklet for new capture
      // This ensures we have a fresh context even after stopping
      await this.initializeAudioWorklet(session)

      // Request microphone access
      console.log('🎤 Requesting microphone access...')
      const audioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: INPUT_SAMPLE_RATE,
          channelCount: CHANNELS
        }
      })
      
      // Verify audio stream
      const tracks = audioStream.getAudioTracks()
      console.log('🎤 Audio stream obtained:', {
        tracks: tracks.length,
        enabled: tracks[0]?.enabled,
        readyState: tracks[0]?.readyState,
        settings: tracks[0]?.getSettings()
      })

      // Connect microphone to AudioWorklet
      console.log('🎤 Creating MediaStreamSource and connecting to AudioWorklet...')
      session.source = session.audioContext!.createMediaStreamSource(audioStream)
      session.source.connect(session.audioWorklet!)
      
      console.log('🎤 Audio context state:', {
        state: session.audioContext!.state,
        sampleRate: session.audioContext!.sampleRate,
        currentTime: session.audioContext!.currentTime
      })
      
      // Resume audio context if suspended
      if (session.audioContext!.state === 'suspended') {
        console.log('🎤 Resuming suspended AudioContext...')
        await session.audioContext!.resume()
        console.log('🎤 AudioContext resumed, new state:', session.audioContext!.state)
      }

      // Send contentStart for AUDIO type (per AWS documentation)
      console.log('[NOVA] ⇢ contentStart p=' + session.promptName + ' c=' + session.audioContentName + ' type=AUDIO interactive=true role=USER')
      this.addEventToQueue(session, {
        event: {
          contentStart: {
            promptName: session.promptName,
            contentName: session.audioContentName,
            type: 'AUDIO',
            interactive: true,
            role: 'USER',
            audioInputConfiguration: {
              mediaType: "audio/lpcm",
              sampleRateHertz: INPUT_SAMPLE_RATE,
              sampleSizeBits: 16,
              channelCount: CHANNELS,
              audioType: "SPEECH",
              encoding: "base64"
            }
          }
        }
      })

      // Initialize recording state
      session.isRecording = true
      session.audioStartTime = Date.now()
      session.hasAudioContent = false
      session.silentMs = 0
      session.vadState = 'SILENT'
      session.lastFrameTs = undefined
      
      // ✅ FIX B: Start stable pacing timer
      this.startPacer(session)  // ✅ FIX #1: Reiniciar el reloj del VAD
      
      // Set initial silence timer
      console.log(`⏲️ Setting initial silence timer for ${INITIAL_SILENCE_MS}ms`)
      session.initialSilenceTimer = setTimeout(() => {
        if (!session.hasAudioContent && session.isRecording) {
          console.log('[NOVA] ⏰ Initial silence timeout - no audio detected')
          this.endTurn(session, 'initial_silence')
        }
      }, INITIAL_SILENCE_MS)

      console.log('✅ Audio capture started - PCM16 @ 16kHz')

    } catch (error) {
      console.error('❌ Failed to start audio capture:', error)
      throw error
    }
  }

  /**
   * Stop audio capture and disconnect
   */
  async stopAudioCapture(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId)
    if (!session) return

    console.log('🛑 Stopping audio capture')
    
    // ✅ FIX #7: Flush remaining audio antes de parar
    this.flushTxHold(session)
    
    // Disconnect audio nodes
    if (session.source) {
      session.source.disconnect()
      session.source.mediaStream.getTracks().forEach(track => track.stop())
      session.source = undefined
    }
    
    if (session.audioWorklet) {
      session.audioWorklet.disconnect()
      session.audioWorklet = undefined
    }
    
    // Close audio context to free resources
    if (session.audioContext && session.audioContext.state !== 'closed') {
      await session.audioContext.close()
      session.audioContext = undefined
      session.workletRegistered = false // ✅ FIX: Reset worklet flag cuando se cierra el contexto
    }
    
    // Clear timers
    if (session.initialSilenceTimer) {
      clearTimeout(session.initialSilenceTimer)
      session.initialSilenceTimer = undefined
    }
    
    // ✅ FIX #7: Limpiar estado de audio
    session.txHold = null
    session.lastFrameTs = undefined
    session.isRecording = false
  }



  /**
   * Dispatch event to UI components
   */
  private dispatchEvent(sessionId: string, eventType: string, eventData: any) {
    // Dispatch custom event for UI components to listen to
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('nova-sonic-event', {
        detail: {
          sessionId,
          eventType,
          eventData
        }
      }))
    }
    
    console.log(`🎯 Event dispatched: ${eventType}`, eventData)
  }

  /**
   * End Nova Sonic conversation session
   */
  async endConversation(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId)
    if (!session) return

    try {
      console.log('🛑 Ending Nova Sonic conversation:', sessionId)

      // Stop audio capture if active
      await this.stopAudioCapture(sessionId)

      // Send proper session termination events
      console.log('[NOVA] ⇢ promptEnd (session termination)')
      this.addEventToQueue(session, {
        event: {
          promptEnd: {
            promptName: session.promptName
          }
        }
      })
      
      console.log('[NOVA] ⇢ sessionEnd')
      this.addEventToQueue(session, {
        event: {
          sessionEnd: {}
        }
      })

      // Mark session as inactive
      session.isActive = false
      session.isStreamComplete = true

      // Close audio context
      if (session.audioContext) {
        await session.audioContext.close()
      }

      // ✅ FIX #3: No resolver null inmediatamente - deja que el generador drene
      // El drain-safe closure se encarga de terminar cuando queue.length === 0
      // if (session.eventQueueResolver) {
      //   session.eventQueueResolver(null)
      // }

      // Remove session
      this.sessions.delete(sessionId)

      console.log('✅ Nova Sonic conversation ended')

    } catch (error) {
      console.error('❌ Error ending conversation:', error)
    }
  }

  /**
   * Get active session
   */
  getSession(sessionId: string): NovaConversationSession | undefined {
    return this.sessions.get(sessionId)
  }

  /**
   * ✅ DEPRECATED: playAudioResponse function removed
   * Audio playback is now handled entirely by React component (VoiceSessionViewerNew.tsx)
   * to avoid double playback and improve performance. 
   * The service only dispatches audioOutput events via dispatchEvent().
   */
}

// Export singleton instance
export const novaConversationalService = new NovaConversationalService()