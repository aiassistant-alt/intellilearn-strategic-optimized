'use client'

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { FaMicrophone, FaTimes, FaWifi } from 'react-icons/fa'
import { novaConversationalService } from '@/lib/services/novaConversationalService'
import { SonicPCMPlayer } from '@/lib/utils/SonicPCMPlayer'

interface VoiceSessionViewerProps {
  lesson: {
    id: string
    title: string
    description: string
    content: string
    duration: string
  }
}

export default function VoiceSessionViewerNew({ lesson }: VoiceSessionViewerProps) {
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingTime, setStreamingTime] = useState(0)
  const [responseText, setResponseText] = useState('')
  const [audioQueue, setAudioQueue] = useState<string[]>([])
  
  // Nova Sonic Speech-to-Speech specific states
  const [userTranscription, setUserTranscription] = useState('')
  const [novaTextResponse, setNovaTextResponse] = useState('')
  const [toolsUsed, setToolsUsed] = useState<Array<{name: string, input: any}>>([])
  const [isInferenceComplete, setIsInferenceComplete] = useState(false)
  const [conversationHistory, setConversationHistory] = useState<Array<{
    type: 'user_speech' | 'nova_text' | 'nova_audio' | 'tool_use';
    content: string;
    timestamp: Date;
  }>>([])
  
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const isPlayingRef = useRef(false)
  const isStartingRef = useRef(false) // Prevent double-starting
  const audioQueueRef = useRef<string[]>([]) // ✅ FIX: Ref for current queue state
  
  // ✅ NEW: AWS Official Pattern - concatenate all audio
  const audioResponseRef = useRef<string>('')
  const isPlayingResponseRef = useRef(false)
  
  // ✅ FIX: Sync ref with state on mount and updates
  useEffect(() => {
    audioQueueRef.current = audioQueue
  }, [audioQueue])

  // Parse lesson content for session configuration
  const lessonConfig = useMemo(() => {
    try {
      const content = JSON.parse(lesson.content)
      return {
        courseId: content.courseId || 'default',
        topic: lesson.title,
        studentId: content.studentId || 'student_001',
        promptName: `lesson_${lesson.id}_prompt`,
        audioContentName: `lesson_${lesson.id}_audio`
      }
    } catch {
      return {
        courseId: 'default',
        topic: lesson.title,
        studentId: 'student_001',
        promptName: `lesson_${lesson.id}_prompt`,
        audioContentName: `lesson_${lesson.id}_audio`
      }
    }
  }, [lesson.content, lesson.title, lesson.id])

  // Nova Sonic session management
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [connectionState, setConnectionState] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected')
  const [isSessionActive, setIsSessionActive] = useState(false)
  
  // ✅ Extended conversation tracking
  const [sessionPart, setSessionPart] = useState(1)
  const [totalSessionTime, setTotalSessionTime] = useState(0)

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // ✅ NEW: AWS Official Pattern - play complete concatenated audio
  const playCompleteAudio = useCallback(async (audioContent: string) => {
    if (isPlayingResponseRef.current) {
      console.log('🎵 Audio response already playing, skipping')
      return
    }

    isPlayingResponseRef.current = true
    console.log('🎵 Playing complete audio response:', audioContent.length, 'characters')

    try {
      // Convert base64 to PCM16 (AWS official pattern)
      const bytes = Uint8Array.from(atob(audioContent), c => c.charCodeAt(0))
      
      // Check if audio has meaningful content
      const SILENCE_THRESHOLD = 50
      let maxAmplitude = 0
      for (let i = 0; i < bytes.length; i += 2) {
        const sample = (bytes[i + 1] << 8) | bytes[i]
        const amplitude = Math.abs(sample > 32767 ? sample - 65536 : sample)
        if (amplitude > maxAmplitude) maxAmplitude = amplitude
      }
      
      console.log(`🔊 Complete audio analysis: maxAmp=${maxAmplitude}, threshold=${SILENCE_THRESHOLD}`)
      
      if (maxAmplitude <= SILENCE_THRESHOLD) {
        console.log('🔇 Complete audio is silent, skipping playback')
        isPlayingResponseRef.current = false
        return
      }

      // Create WAV from complete audio (AWS pattern)
      const sampleRate = 24000 // Nova outputs at 24kHz
      const numChannels = 1
      const bitsPerSample = 16
      
      // Create WAV header
      const wavHeader = new ArrayBuffer(44)
      const view = new DataView(wavHeader)
      
      // WAV header construction (same as before)
      view.setUint32(0, 0x52494646, false) // "RIFF"
      view.setUint32(4, 36 + bytes.length, true) // File size - 8
      view.setUint32(8, 0x57415645, false) // "WAVE"
      view.setUint32(12, 0x666d7420, false) // "fmt "
      view.setUint32(16, 16, true) // PCM format chunk size
      view.setUint16(20, 1, true) // PCM format
      view.setUint16(22, numChannels, true) // Channels
      view.setUint32(24, sampleRate, true) // Sample rate
      view.setUint32(28, sampleRate * numChannels * bitsPerSample / 8, true) // Byte rate
      view.setUint16(32, numChannels * bitsPerSample / 8, true) // Block align
      view.setUint16(34, bitsPerSample, true) // Bits per sample
      view.setUint32(36, 0x64617461, false) // "data"
      view.setUint32(40, bytes.length, true) // Data size
      
      // Combine header and data
      const combined = new Uint8Array(44 + bytes.length)
      combined.set(new Uint8Array(wavHeader), 0)
      combined.set(bytes, 44)
      
      // Create audio blob and play
      const blob = new Blob([combined], { type: 'audio/wav' })
      const audioUrl = URL.createObjectURL(blob)
      const audio = new Audio(audioUrl)
      
      audio.onloadedmetadata = () => {
        console.log('🔊 Complete audio loaded, duration:', audio.duration + 's')
      }

      audio.onended = () => {
        console.log('✅ Complete audio playback finished')
        isPlayingResponseRef.current = false
        URL.revokeObjectURL(audioUrl)
      }

      audio.onerror = (error) => {
        console.error('❌ Complete audio playback error:', error)
        isPlayingResponseRef.current = false
        URL.revokeObjectURL(audioUrl)
      }

      // Play the complete audio
      console.log('🔊 Starting complete Nova Sonic audio playback...')
      await audio.play()
      console.log('✅ Complete audio playback started successfully')

    } catch (error) {
      console.error('❌ Error processing complete audio:', error)
      isPlayingResponseRef.current = false
    }
  }, [])

  // Play audio responses in queue
  const playNextAudio = useCallback(() => {
    if (audioQueue.length === 0 || isPlayingRef.current) {
      console.log('🎵 Skip play: queue empty or already playing')
      return
    }

    console.log(`🎵 Starting playback: ${audioQueue.length} items in queue`)
    const audioData = audioQueue[0]
    setAudioQueue(prev => {
      const newQueue = prev.slice(1)
      audioQueueRef.current = newQueue // ✅ FIX: Keep ref in sync
      console.log(`🎵 Queue updated: ${newQueue.length} items remaining`)
      return newQueue
    })
    isPlayingRef.current = true

    try {
      console.log('🎵 Processing audio for playback...')
      
      // Stop any currently playing audio
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }

      // Convert base64 to PCM16 audio
      const binaryString = atob(audioData)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }

      // ✅ FIX CRÍTICO: Optimizar según AWS Nova Sonic workshops
      const pcm16Array = new Int16Array(bytes.buffer)
      let hasAudio = false
      let maxAmplitude = 0
      const SILENCE_THRESHOLD = 50 // ✅ FIX: Workshop-optimized threshold for 24kHz Nova output
      
      // Calcular amplitud máxima para debugging
      for (let i = 0; i < pcm16Array.length; i++) {
        const amp = Math.abs(pcm16Array[i])
        if (amp > maxAmplitude) maxAmplitude = amp
        if (amp > SILENCE_THRESHOLD) {
          hasAudio = true
          // No break - seguir calculando maxAmplitude para logs
        }
      }
      
      console.log(`🔊 Audio analysis: maxAmp=${maxAmplitude}, threshold=${SILENCE_THRESHOLD}, hasAudio=${hasAudio}`)
      
      if (!hasAudio) {
        console.log('🔇 Skipping silent audio chunk')
        isPlayingRef.current = false
        
        // ✅ AWS SAMPLE PATTERN: Use requestAnimationFrame to prevent tight loops
        requestAnimationFrame(() => {
          if (audioQueue.length > 0) {
            playNextAudio()
          }
        })
        return
      }

      // ✅ FIX CRÍTICO: Nova Sonic sends PCM16 audio at 24kHz (no 16kHz)
      // We need to create a WAV file from the PCM data  
      const sampleRate = 24000 // ✅ Nova outputs at 24kHz according to audioOutputConfiguration
      const numChannels = 1
      const bitsPerSample = 16
      
      // Create WAV header
      const wavHeader = new ArrayBuffer(44)
      const view = new DataView(wavHeader)
      
      // "RIFF" chunk descriptor
      view.setUint32(0, 0x52494646, false) // "RIFF"
      view.setUint32(4, 36 + bytes.length, true) // File size - 8
      view.setUint32(8, 0x57415645, false) // "WAVE"
      
      // "fmt " sub-chunk
      view.setUint32(12, 0x666d7420, false) // "fmt "
      view.setUint32(16, 16, true) // Subchunk1Size (16 for PCM)
      view.setUint16(20, 1, true) // AudioFormat (1 for PCM)
      view.setUint16(22, numChannels, true) // NumChannels
      view.setUint32(24, sampleRate, true) // SampleRate
      view.setUint32(28, sampleRate * numChannels * bitsPerSample / 8, true) // ByteRate
      view.setUint16(32, numChannels * bitsPerSample / 8, true) // BlockAlign
      view.setUint16(34, bitsPerSample, true) // BitsPerSample
      
      // "data" sub-chunk
      view.setUint32(36, 0x64617461, false) // "data"
      view.setUint32(40, bytes.length, true) // Subchunk2Size
      
      // Combine header and PCM data
      const wavBytes = new Uint8Array(44 + bytes.length)
      wavBytes.set(new Uint8Array(wavHeader), 0)
      wavBytes.set(bytes, 44)
      
      const audioBlob = new Blob([wavBytes], { type: 'audio/wav' })
      const audioUrl = URL.createObjectURL(audioBlob)

      // Create new audio element
      const audio = new Audio(audioUrl)
      audioRef.current = audio

      audio.onloadeddata = () => {
        console.log('🔊 Nova Sonic audio loaded, ready to play')
        console.log(`📊 Audio duration: ${audio.duration}s`)
        
        // ✅ FIX: Workshop-optimized minimum duration for Nova Sonic chunks
        if (audio.duration < 0.01) {
          console.log('🔇 Skipping extremely short audio chunk (< 0.01s)')
          isPlayingRef.current = false
          URL.revokeObjectURL(audioUrl)
          return
        }
        
        console.log('🎵 Audio chunk duration OK:', audio.duration + 's - proceeding with playback')
      }

      audio.onended = () => {
        console.log('✅ Audio playback completed')
        isPlayingRef.current = false
        URL.revokeObjectURL(audioUrl)
        
        // ✅ AWS SAMPLE PATTERN: Use requestAnimationFrame for smooth processing
        requestAnimationFrame(() => {
          console.log(`🎵 Checking for next audio...`)
          if (audioQueue.length > 0) {
            playNextAudio()
          }
        })
      }

      audio.onerror = (error) => {
        console.error('❌ Audio playback error:', error)
        isPlayingRef.current = false
        URL.revokeObjectURL(audioUrl)
        
        // ✅ AWS SAMPLE PATTERN: Skip to next without tight loops  
        requestAnimationFrame(() => {
          console.log(`⚠️ Trying next audio after error...`)
          if (audioQueue.length > 0) {
            playNextAudio()
          }
        })
      }

      // Play the audio
      console.log('🔊 Starting Nova Sonic audio playback...')
      audio.play().then(() => {
        console.log('✅ Audio playback started successfully')
      }).catch(error => {
        console.error('❌ Failed to play audio:', error)
        console.log('💡 Tip: User interaction may be required for first audio playback')
        isPlayingRef.current = false
        URL.revokeObjectURL(audioUrl)
      })

    } catch (error) {
      console.error('❌ Error processing audio data:', error)
      isPlayingRef.current = false
    }
  }, [audioQueue])

  // Listen for Nova Sonic events
  useEffect(() => {
    const handleNovaEvent = (event: CustomEvent) => {
      const { eventType, eventData, sessionId: eventSessionId } = event.detail
      
      // Only process events for our session
      if (eventSessionId !== sessionId) return
      
      console.log(`🎯 Nova event: ${eventType}`)
      
      switch(eventType) {
        case 'contentStart':
          setResponseText('🎤 Nova está escuchando...')
          break
        case 'textOutput':
          if (eventData.text) {
            console.log('💬 Nova Sonic text response:', eventData.text)
            
            // ✅ NEW: Interruption detection based on AWS official samples
            if (eventData.role === "ASSISTANT" && eventData.text.startsWith("{")) {
              try {
                const evt = JSON.parse(eventData.text);
                if (evt.interrupted === true) {
                  console.log('🚫 Interruption detected - triggering barge-in')
                  novaConversationalService.bargeIn(sessionId!)
                  
                  // Stop any currently playing audio
                  if (audioRef.current) {
                    audioRef.current.pause()
                    audioRef.current = null
                  }
                  
                  // Clear audio queue to prevent stale playback
                  setAudioQueue([])
                  isPlayingRef.current = false
                  return // Don't process this interrupted text
                }
              } catch (e) {
                // Not JSON, normal text output
              }
            }
            
            setNovaTextResponse(eventData.text)
            setResponseText(eventData.text)
            
            // Add to conversation history
            setConversationHistory(prev => [...prev, {
              type: 'nova_text',
              content: eventData.text,
              timestamp: new Date()
            }])
          }
          break
        case 'audioOutput':
          console.log('🔊 Audio output received, concatenating (AWS official pattern)')
          
          if (eventData.content) {
            console.log('📊 Audio content length:', eventData.content.length, 'characters')
            
            // ✅ AWS OFFICIAL PATTERN: Concatenate all audio output
            audioResponseRef.current += eventData.content
            
            console.log(`📥 Audio concatenated: ${audioResponseRef.current.length} total characters`)
            
            // Add conversation history
            setConversationHistory(prev => [...prev, {
              type: 'nova_audio',
              content: `Audio chunk ${eventData.content.length} chars`,
              timestamp: new Date()
            }])
          }
          break
        case 'contentEnd':
          setIsInferenceComplete(true)
          console.log('🎯 Nova Sonic inference complete')
          
          // ✅ AWS OFFICIAL PATTERN: Play complete audio on contentEnd
          if (eventData.type === 'AUDIO' && eventData.stopReason === 'END_TURN') {
            console.log('🎵 Audio content ended, playing complete concatenated audio...')
            
            if (audioResponseRef.current.length > 0) {
              playCompleteAudio(audioResponseRef.current)
              audioResponseRef.current = '' // Reset for next response
            } else {
              console.log('⚠️ No audio content to play')
            }
          }
          break
        case 'turnEnd':
          // Turn ended, Nova is ready for next input
          setResponseText('🎤 Nova listo para siguiente turno...')
          break
        case 'sessionEnd':
          setConnectionState('disconnected')
          setIsSessionActive(false)
          setIsStreaming(false)
          // ✅ FIX: Limpiar cola de audio al terminar sesión
          console.log('🧹 Clearing audio queue on session end')
          setAudioQueue([])
          break
      }
    }

    window.addEventListener('nova-sonic-event', handleNovaEvent as EventListener)
    return () => {
      window.removeEventListener('nova-sonic-event', handleNovaEvent as EventListener)
    }
  }, [sessionId])

  // ✅ Note: Audio playback now handled via AWS official pattern in contentEnd event
  // No need for automatic queue processing

  // Connection status display
  const getConnectionStatus = () => {
    switch (connectionState) {
      case 'connected':
        return { icon: <FaWifi className="text-green-500" />, text: 'Conectado', color: 'text-green-500' }
      case 'connecting':
        return { icon: <FaWifi className="text-yellow-500" />, text: 'Conectando...', color: 'text-yellow-500' }
      case 'error':
        return { icon: <FaWifi className="text-red-500" />, text: 'Error', color: 'text-red-500' }
      default:
        return { icon: <FaWifi className="text-gray-500" />, text: 'Desconectado', color: 'text-gray-500' }
    }
  }

  // Start voice streaming session
  const startVoiceStreaming = async () => {
    // Prevent double-starting
    if (isStartingRef.current || isStreaming) {
      console.log('⚠️ Already starting or streaming, ignoring duplicate call')
      return
    }
    
    isStartingRef.current = true
    
    try {
      console.log('🎯 Starting Nova Sonic session (Direct AWS Bedrock)')
      console.log('🔍 Component state:', { isStreaming, sessionId, connectionState })
      console.log('🔍 Checking authentication...')
      
      // Debug: Log ALL localStorage keys
      console.log('📦 All localStorage keys:', Object.keys(localStorage))
      
      // Check if user is authenticated - check all possible storage locations
      const userStr = localStorage.getItem('user')
      const cogniaUserStr = localStorage.getItem('cognia_user_data')
      const cognitoTokens = localStorage.getItem('cognito_tokens')
      
      console.log('📦 localStorage user exists:', !!userStr)
      console.log('📦 localStorage cognia_user_data exists:', !!cogniaUserStr)
      console.log('📦 localStorage cognito_tokens exists:', !!cognitoTokens)
      
      let hasValidTokens = false
      let idToken = null
      
      // Check embedded tokens in user object
      if (userStr) {
        try {
          const user = JSON.parse(userStr)
          console.log('👤 User object keys:', Object.keys(user))
          
          // Check nested tokens
          if (user.tokens && (user.tokens.IdToken || user.tokens.idToken)) {
            idToken = user.tokens.IdToken || user.tokens.idToken
            hasValidTokens = true
            console.log('✅ Found embedded tokens in user.tokens')
          } 
          // Check direct tokens
          else if (user.IdToken || user.idToken) {
            idToken = user.IdToken || user.idToken
            hasValidTokens = true
            console.log('✅ Found tokens directly on user object')
          }
        } catch (e) {
          console.error('Error parsing user object:', e)
        }
      }
      
      // Check cognia_user_data (PRIMARY SOURCE based on AuthContext)
      if (!hasValidTokens && cogniaUserStr) {
        try {
          const user = JSON.parse(cogniaUserStr)
          console.log('🔑 Cognia user keys:', Object.keys(user))
          console.log('🔑 Cognia user data sample:', {
            hasIdToken: !!user.IdToken,
            hasidToken: !!user.idToken,
            hasTokens: !!user.tokens,
            keys: Object.keys(user).slice(0, 10) // Show first 10 keys
          })
          
          // Check all possible token locations in cognia_user_data
          if (user.IdToken) {
            idToken = user.IdToken
            hasValidTokens = true
            console.log('✅ Found IdToken in cognia_user_data')
          } else if (user.idToken) {
            idToken = user.idToken
            hasValidTokens = true
            console.log('✅ Found idToken in cognia_user_data')
          } else if (user.tokens && (user.tokens.IdToken || user.tokens.idToken)) {
            idToken = user.tokens.IdToken || user.tokens.idToken
            hasValidTokens = true
            console.log('✅ Found tokens nested in cognia_user_data.tokens')
          }
        } catch (e) {
          console.error('Error parsing cognia_user_data:', e)
        }
      }
      
      // Check standalone tokens
      if (!hasValidTokens && cognitoTokens) {
        try {
          const tokens = JSON.parse(cognitoTokens)
          console.log('🔑 Cognito tokens keys:', Object.keys(tokens))
          if (tokens.IdToken || tokens.idToken) {
            idToken = tokens.IdToken || tokens.idToken
            hasValidTokens = true
            console.log('✅ Found standalone cognito tokens')
          }
        } catch (e) {
          console.error('Error parsing cognito tokens:', e)
        }
      }
      
      if (!hasValidTokens || !idToken) {
        console.error('❌ No valid authentication tokens found')
        console.error('Checked locations:', {
          user: !!userStr,
          cognia_user_data: !!cogniaUserStr,
          cognito_tokens: !!cognitoTokens
        })
        setResponseText('❌ Necesitas iniciar sesión primero')
        setConnectionState('error')
        
        // Don't redirect automatically - let user try again
        console.log('⚠️ User needs to authenticate. Please login first.')
        return
      }
      
      console.log('✅ Authentication verified, token found')
      
      setConnectionState('connecting')
      setIsStreaming(true)
      setStreamingTime(0)
      setResponseText('🔄 Inicializando sesión Nova Sonic...')

      console.log('📤 Calling novaConversationalService.startConversation with:', {
        courseId: lessonConfig.courseId,
        topic: lessonConfig.topic,
        studentId: lessonConfig.studentId
      })

      // ✅ Enhanced: Start extended 20-minute Nova Sonic conversation with automatic resume
      const id = await novaConversationalService.startExtendedConversation({
        courseId: lessonConfig.courseId,
        topic: lessonConfig.topic,
        studentId: lessonConfig.studentId,
        maxTokens: 1024,
        temperature: 0.7
      })
      
      console.log('✅ Nova Sonic session initialized:', id)
      setSessionId(id)
      setConnectionState('connected')
      setIsSessionActive(true)

      console.log('🎤 Starting audio capture...')
      // Start audio capture
      await novaConversationalService.startAudioCapture(id)
      console.log('✅ Audio capture started successfully')

      // Start timer
      timerRef.current = setInterval(() => {
        setStreamingTime(prev => prev + 1)
      }, 1000)

      setResponseText('🎤 Nova Sonic listo. Habla al micrófono para interactuar...')
      
      // Reset starting flag on success
      isStartingRef.current = false

    } catch (error: any) {
      console.error('❌ Error starting Nova Sonic session:', error)
      console.error('Error details:', {
        message: error?.message,
        name: error?.name,
        stack: error?.stack,
        code: error?.code
      })
      
      // Show more specific error message
      let errorMessage = 'Error al iniciar Nova Sonic'
      if (error?.message?.includes('InvalidIdentityPoolConfigurationException')) {
        errorMessage = 'Error de configuración AWS. Contacta al administrador.'
      } else if (error?.message?.includes('NotAuthorizedException')) {
        errorMessage = 'Sin autorización. Por favor inicia sesión nuevamente.'
      } else if (error?.message) {
        errorMessage = error.message
      }
      
      setResponseText(`❌ ${errorMessage}`)
      setConnectionState('error')
      setIsStreaming(false)
      setIsSessionActive(false)
    } finally {
      // Always reset the starting flag
      isStartingRef.current = false
    }
  }

  // Stop voice streaming session
  const stopVoiceStreaming = async () => {
    try {
      setIsStreaming(false)
      
      // Stop any playing audio
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
      
      console.log('🛑 Stopping Nova Sonic session')
      
      // End Nova Sonic session
      if (sessionId) {
        await novaConversationalService.endConversation(sessionId)
      }
      
      // Clear timer
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      
      // Clear audio queue
      setAudioQueue([])
      isPlayingRef.current = false
      
      setSessionId(null)
      setConnectionState('disconnected')
      setIsSessionActive(false)
      setResponseText('✅ Sesión Nova Sonic finalizada')
      
    } catch (error) {
      console.error('❌ Error stopping Nova Sonic session:', error)
      setResponseText(`Error al finalizar: ${(error as Error).message}`)
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('🧹 Cleaning up VoiceSessionViewer component');
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      // Only cleanup if actually streaming
      if (isStreaming && isSessionActive && sessionId) {
        console.log('🛑 Component unmounting during active session, cleaning up...');
        novaConversationalService.endConversation(sessionId)
      }
    }
  }, []) // Remove dependencies to avoid re-running this effect

  // Test function for manual text input
  const sendTestMessage = async () => {
    if (isSessionActive) {
      setResponseText('🧪 Función de test - implementar envío de texto manual')
    } else {
      setResponseText('⚠️ No hay sesión activa para enviar mensaje de prueba')
    }
  }

  const connectionStatus = getConnectionStatus()

  // Handle click on microphone circle
  const handleMicrophoneClick = (e: React.MouseEvent) => {
    // Prevent any default behavior
    e.preventDefault()
    e.stopPropagation()
    
    console.log('🎤 Microphone clicked, streaming state:', isStreaming)
    
    if (!isStreaming) {
      startVoiceStreaming().catch(error => {
        console.error('❌ Error starting voice streaming:', error)
      })
    } else {
      stopVoiceStreaming().catch(error => {
        console.error('❌ Error stopping voice streaming:', error)
      })
    }
  }

  return (
    <div className="nm-white-container">
      <div className="voice-main-wrapper">
        {/* Neumorphic Voice Visualizer - Clickable Microphone */}
        <button 
          type="button"
          className="nm-voice-circle-wrapper"
          onClick={handleMicrophoneClick}
          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
        >
          <div className={`nm-voice-circle ${isStreaming ? 'active' : ''}`}>
            <div className="nm-voice-inner-circle">
              {/* Iridescent Center */}
              <div className="nm-voice-iridescent" />
              
              {/* Microphone Icon */}
              <div className={`nm-voice-icon-container ${isStreaming ? 'active' : ''}`}>
                <svg viewBox="0 -0.5 25 25" fill="none" xmlns="http://www.w3.org/2000/svg" className="nm-voice-icon">
                  <path 
                    d="M12 16C10.3431 16 9 14.6569 9 13V7C9 5.34315 10.3431 4 12 4C13.6569 4 15 5.34315 15 7V13C15 14.6569 13.6569 16 12 16Z" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                  <path 
                    d="M19 11V13C19 17.4183 15.4183 21 11 21H12C7.58172 21 4 17.4183 4 13V11" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                  <path 
                    d="M12 21V24" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                  <path 
                    d="M8 24H16" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              
              {/* Voice Listening Animation */}
              {isStreaming && (
                <>
                  <div className="nm-voice-wave nm-voice-wave-1" />
                  <div className="nm-voice-wave nm-voice-wave-2" />
                  <div className="nm-voice-wave nm-voice-wave-3" />
                  <div className="nm-voice-wave nm-voice-wave-4" />
                </>
              )}
            </div>
          </div>
        </button>

        {/* Status Text - Minimal */}
        {isStreaming && (
          <div className="status-text">
            {formatTime(streamingTime)}
          </div>
        )}

        {/* Response Display - Hidden until there's content */}
        {(responseText || novaTextResponse) && (
          <div className="response-container">
            <div className="response-text">
              {novaTextResponse || responseText}
            </div>
          </div>
        )}
      </div>

      {/* Styles */}
      <style jsx>{`
        /* CLEAN WHITE NEUMORPHIC DESIGN */
        
        /* White Container */
        .nm-white-container {
          background: #ffffff;
          min-height: 400px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px;
          border-radius: 24px;
        }

        /* Dark mode styles for container */
        [data-theme="dark"] .nm-white-container {
          background: #2a2a2a;
        }
        
        .voice-main-wrapper {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 30px;
        }
        
        /* LARGE NEUMORPHIC CIRCLE */
        .nm-voice-circle-wrapper {
          position: relative;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .nm-voice-circle {
          position: relative;
          width: 280px;
          height: 280px;
          border-radius: 50%;
          background: #ffffff;
          box-shadow: 
            30px 30px 60px #d9d9d9,
            -30px -30px 60px #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }
        
        .nm-voice-circle:hover {
          box-shadow: 
            35px 35px 70px #d9d9d9,
            -35px -35px 70px #ffffff;
        }
        
        .nm-voice-circle.active {
          box-shadow: 
            inset 20px 20px 40px #d9d9d9,
            inset -20px -20px 40px #ffffff;
        }

        /* Dark mode styles for voice circle */
        [data-theme="dark"] .nm-voice-circle {
          background: #2a2a2a;
          box-shadow: 
            30px 30px 60px #1a1a1a,
            -30px -30px 60px #3a3a3a;
        }
        
        [data-theme="dark"] .nm-voice-circle:hover {
          box-shadow: 
            35px 35px 70px #1a1a1a,
            -35px -35px 70px #3a3a3a;
        }
        
        [data-theme="dark"] .nm-voice-circle.active {
          box-shadow: 
            inset 20px 20px 40px #1a1a1a,
            inset -20px -20px 40px #3a3a3a;
        }
        
        .nm-voice-inner-circle {
          position: relative;
          width: 220px;
          height: 220px;
          border-radius: 50%;
          background: #ffffff;
          box-shadow: 
            inset 10px 10px 20px #e6e6e6,
            inset -10px -10px 20px #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        /* Dark mode styles for inner voice circle */
        [data-theme="dark"] .nm-voice-inner-circle {
          background: #2a2a2a;
          box-shadow: 
            inset 10px 10px 20px #1a1a1a,
            inset -10px -10px 20px #3a3a3a;
        }
        
        /* Iridescent Center */
        .nm-voice-iridescent {
          position: absolute;
          width: 140px;
          height: 140px;
          border-radius: 50%;
          background: conic-gradient(
            from 0deg at 50% 50%,
            #FF007F 0deg,
            #FF00FF 45deg,
            #8B00FF 90deg,
            #0080FF 135deg,
            #00D4FF 180deg,
            #00FF94 225deg,
            #FFD700 270deg,
            #FF5E00 315deg,
            #FF007F 360deg
          );
          filter: blur(20px);
          opacity: 0.4;
          animation: rotate-iridescent 4s linear infinite;
          z-index: 1;
        }
        
        .nm-voice-circle.active .nm-voice-iridescent {
          opacity: 0.7;
          filter: blur(15px);
          animation: rotate-iridescent 2s linear infinite;
        }

        /* Dark mode styles for iridescent center */
        [data-theme="dark"] .nm-voice-iridescent {
          opacity: 0.8;
          filter: blur(18px);
        }

        [data-theme="dark"] .nm-voice-circle.active .nm-voice-iridescent {
          opacity: 1.0;
          filter: blur(12px);
        }
        
        /* Microphone Icon */
        .nm-voice-icon-container {
          position: relative;
          z-index: 10;
          width: 80px;
          height: 80px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }
        
        .nm-voice-icon-container.active {
          animation: icon-pulse 1.5s ease-in-out infinite;
        }
        
        .nm-voice-icon {
          width: 50px;
          height: 50px;
          color: #4a5568;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
        }
        
        .nm-voice-circle.active .nm-voice-icon {
          color: #ffffff;
          filter: drop-shadow(0 0 10px rgba(139, 92, 246, 0.6));
        }

        /* Dark mode styles for voice icon */
        [data-theme="dark"] .nm-voice-icon {
          color: #e0e0e0;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
        }
        
        [data-theme="dark"] .nm-voice-circle.active .nm-voice-icon {
          color: #ffffff;
          filter: drop-shadow(0 0 10px rgba(139, 92, 246, 0.8));
        }
        
        /* Voice waves */
        .nm-voice-wave {
          position: absolute;
          border: 2px solid;
          border-radius: 50%;
          opacity: 0;
          animation: voice-wave-animation 2s ease-out infinite;
          pointer-events: none;
        }
        
        .nm-voice-wave-1 {
          width: 300px;
          height: 300px;
          border-color: rgba(139, 92, 246, 0.3);
          animation-delay: 0s;
        }
        
        .nm-voice-wave-2 {
          width: 340px;
          height: 340px;
          border-color: rgba(99, 102, 241, 0.25);
          animation-delay: 0.5s;
        }
        
        .nm-voice-wave-3 {
          width: 380px;
          height: 380px;
          border-color: rgba(168, 85, 247, 0.2);
          animation-delay: 1s;
        }
        
        .nm-voice-wave-4 {
          width: 420px;
          height: 420px;
          border-color: rgba(217, 70, 239, 0.15);
          animation-delay: 1.5s;
        }
        
        /* Status Text */
        .status-text {
          font-size: 1.5rem;
          font-family: monospace;
          color: #6b46c1;
          font-weight: 600;
        }
        
        /* Response Container */
        .response-container {
          max-width: 600px;
          padding: 20px;
          background: #ffffff;
          border-radius: 16px;
          box-shadow: 
            inset 5px 5px 10px #e6e6e6,
            inset -5px -5px 10px #ffffff;
        }
        
        .response-text {
          color: #4a5568;
          font-size: 0.95rem;
          line-height: 1.6;
          text-align: left;
        }

        /* Dark mode styles for response container */
        [data-theme="dark"] .response-container {
          background: #2a2a2a;
          box-shadow: 
            inset 5px 5px 10px #1a1a1a,
            inset -5px -5px 10px #3a3a3a;
        }

        [data-theme="dark"] .response-text {
          color: #e0e0e0;
        }
        
        
        /* Animations */
        @keyframes rotate-iridescent {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes voice-wave-animation {
          0% {
            transform: scale(0.8);
            opacity: 1;
          }
          100% {
            transform: scale(1.5);
            opacity: 0;
          }
        }
        
        @keyframes icon-pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.1);
          }
        }

      `}</style>
    </div>
  )
}