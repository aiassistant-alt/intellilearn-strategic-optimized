/**
 * useNovaWebSocket Hook
 * React hook for Nova Sonic WebSocket integration
 * Provides state management and simplified API for components
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { NovaWebSocketClient, NovaSessionConfig, NovaEventHandler } from '../../lib/services/novaWebSocketClient';

export interface UseNovaWebSocketConfig {
  wsUrl?: string;
  autoConnect?: boolean;
  autoReconnect?: boolean;
  sessionConfig?: NovaSessionConfig;
}

export interface NovaWebSocketState {
  connectionState: 'connecting' | 'connected' | 'disconnected' | 'error';
  sessionId: string | null;
  isSessionActive: boolean;
  error: string | null;
  lastAudioResponse: string | null;
  lastTextResponse: string | null;
  lastTranscription: string | null;
  lastToolUse: { name: string; input: any } | null;
  isInferenceComplete: boolean;
}

export interface UseNovaWebSocketReturn {
  // State
  state: NovaWebSocketState;
  
  // Connection methods
  connect: () => Promise<boolean>;
  disconnect: () => void;
  
  // Session methods
  initializeSession: (config?: NovaSessionConfig) => Promise<string | null>;
  endSession: () => Promise<boolean>;
  
  // Audio methods
  sendAudioInput: (audioData: string | ArrayBuffer, isEndOfUtterance?: boolean) => Promise<boolean>;
  startAudioCapture: () => Promise<boolean>;
  stopAudioCapture: () => Promise<boolean>;
  
  // Utility methods
  isConnected: () => boolean;
  clearError: () => void;
}

export function useNovaWebSocket(config: UseNovaWebSocketConfig = {}): UseNovaWebSocketReturn {
  const clientRef = useRef<NovaWebSocketClient | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  
  // State management
  const [state, setState] = useState<NovaWebSocketState>({
    connectionState: 'disconnected',
    sessionId: null,
    isSessionActive: false,
    error: null,
    lastAudioResponse: null,
    lastTextResponse: null,
    lastTranscription: null,
    lastToolUse: null,
    isInferenceComplete: false
  });

  // Update state helper
  const updateState = useCallback((updates: Partial<NovaWebSocketState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Initialize WebSocket client
  useEffect(() => {
    const wsUrl = config.wsUrl || process.env.NEXT_PUBLIC_NOVA_WEBSOCKET_URL || 'wss://d3m4wrd20w0beh.cloudfront.net/ws';
    
    const eventHandlers: NovaEventHandler = {
      onConnectionStateChange: (connectionState) => {
        console.log('🔄 Connection state changed:', connectionState);
        updateState({ connectionState });
      },

      onSessionReady: (sessionId) => {
        console.log('✅ Nova Sonic Speech-to-Speech session ready:', sessionId);
        updateState({ 
          sessionId, 
          isSessionActive: true,
          error: null,
          isInferenceComplete: false
        });
      },

      onTranscription: (transcript, sessionId) => {
        console.log('📝 User speech transcription:', transcript);
        updateState({ lastTranscription: transcript });
      },

      onTextResponse: (text, sessionId) => {
        console.log('💬 Nova Sonic text response:', text);
        updateState({ lastTextResponse: text });
      },

      onAudioResponse: (audioData, sessionId) => {
        console.log('🔊 Nova Sonic audio response received');
        updateState({ lastAudioResponse: audioData });
        
        // Auto-play audio response
        playAudioResponse(audioData);
      },

      onToolUse: (toolName, toolInput, sessionId) => {
        console.log('🛠️ Tool use event:', toolName);
        updateState({ lastToolUse: { name: toolName, input: toolInput } });
      },

      onInferenceComplete: (sessionId) => {
        console.log('🎯 Nova Sonic inference complete');
        updateState({ isInferenceComplete: true });
      },

      onError: (error, sessionId) => {
        console.error('❌ Nova WebSocket error:', error);
        updateState({ 
          error,
          isSessionActive: sessionId ? false : state.isSessionActive 
        });
      },

      onNovaResponse: (event, sessionId) => {
        console.log('📨 Nova response event:', Object.keys(event)[0]);
        // Legacy event handling for backward compatibility
      }
    };

    clientRef.current = new NovaWebSocketClient({ wsUrl }, eventHandlers);

    // Auto-connect if enabled
    if (config.autoConnect !== false) {
      connect();
    }

    // Cleanup on unmount
    return () => {
      console.log('🧹 Cleaning up Nova WebSocket hook');
      if (clientRef.current) {
        clientRef.current.disconnect();
      }
      // Only stop audio if there's an active stream
      if (mediaRecorderRef.current || audioStreamRef.current) {
        stopAudioCapture();
      }
    };
  }, [config.wsUrl, config.autoConnect]);

  // Play audio response
  const playAudioResponse = useCallback(async (base64Audio: string) => {
    try {
      // Convert base64 to audio blob
      const audioData = atob(base64Audio);
      const audioBuffer = new ArrayBuffer(audioData.length);
      const audioView = new Uint8Array(audioBuffer);
      
      for (let i = 0; i < audioData.length; i++) {
        audioView[i] = audioData.charCodeAt(i);
      }

      // Nova Sonic returns raw PCM audio, not webm
      const audioBlob = new Blob([audioBuffer], { type: 'audio/wav' });
      const audioUrl = URL.createObjectURL(audioBlob);
      
      // Create and play audio element
      const audio = new Audio(audioUrl);
      
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
      };
      
      audio.onerror = (error) => {
        console.error('❌ Error playing audio response:', error);
        URL.revokeObjectURL(audioUrl);
      };
      
      await audio.play();
      console.log('🔊 Playing Nova Sonic audio response');

    } catch (error) {
      console.error('❌ Failed to play audio response:', error);
    }
  }, []);

  // Connection methods
  const connect = useCallback(async (): Promise<boolean> => {
    if (!clientRef.current) return false;
    
    try {
      updateState({ error: null });
      const success = await clientRef.current.connect();
      return success;
    } catch (error) {
      console.error('❌ Failed to connect:', error);
      updateState({ error: (error as Error).message });
      return false;
    }
  }, [updateState]);

  const disconnect = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.disconnect();
    }
    stopAudioCapture();
    updateState({ 
      sessionId: null, 
      isSessionActive: false,
      connectionState: 'disconnected'
    });
  }, [updateState]);

  // Session methods
  const initializeSession = useCallback(async (sessionConfig?: NovaSessionConfig): Promise<string | null> => {
    if (!clientRef.current) return null;
    
    try {
      updateState({ error: null });
      
      const finalConfig = { ...config.sessionConfig, ...sessionConfig };
      const sessionId = await clientRef.current.initializeSession(finalConfig);
      
      return sessionId;
    } catch (error) {
      console.error('❌ Failed to initialize session:', error);
      updateState({ error: (error as Error).message });
      return null;
    }
  }, [config.sessionConfig, updateState]);

  const endSession = useCallback(async (): Promise<boolean> => {
    if (!clientRef.current) return false;
    
    try {
      const success = await clientRef.current.endSession();
      if (success) {
        updateState({ 
          sessionId: null, 
          isSessionActive: false 
        });
      }
      return success;
    } catch (error) {
      console.error('❌ Failed to end session:', error);
      return false;
    }
  }, [updateState]);

  // Audio methods
  const sendAudioInput = useCallback(async (audioData: string | ArrayBuffer, isEndOfUtterance: boolean = false): Promise<boolean> => {
    if (!clientRef.current) return false;
    
    try {
      return await clientRef.current.sendAudioInput(audioData, isEndOfUtterance);
    } catch (error) {
      console.error('❌ Failed to send audio input:', error);
      updateState({ error: (error as Error).message });
      return false;
    }
  }, [updateState]);

  const startAudioCapture = useCallback(async (): Promise<boolean> => {
    try {
      // Prevent multiple simultaneous audio capture starts
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        console.log('⚠️ Audio capture already active, skipping start');
        return true;
      }
      
      console.log('🎤 Starting audio capture...');
      
      // Stop any existing capture only if it exists
      if (mediaRecorderRef.current || audioStreamRef.current) {
        console.log('🔄 Stopping existing audio capture before starting new one');
        await stopAudioCapture();
      }
      
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
          channelCount: 1
        }
      });

      audioStreamRef.current = stream;

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorderRef.current = mediaRecorder;

      // Handle audio data
      mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0 && state.isSessionActive) {
          const arrayBuffer = await event.data.arrayBuffer();
          await sendAudioInput(arrayBuffer);
        }
      };

      mediaRecorder.onerror = (event) => {
        console.error('❌ MediaRecorder error:', event);
        updateState({ error: 'Audio recording error' });
      };

      // Start recording with small chunks
      mediaRecorder.start(100); // 100ms chunks
      
      console.log('✅ Audio capture started');
      return true;

    } catch (error) {
      console.error('❌ Failed to start audio capture:', error);
      updateState({ error: 'Failed to access microphone: ' + (error as Error).message });
      return false;
    }
  }, [state.isSessionActive, sendAudioInput, updateState]);

  const stopAudioCapture = useCallback(async (): Promise<boolean> => {
    try {
      let wasActive = false;
      
      // Stop MediaRecorder
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        console.log('🛑 Stopping MediaRecorder...');
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current = null;
        wasActive = true;
      }

      // Stop audio stream
      if (audioStreamRef.current) {
        console.log('🛑 Stopping audio stream...');
        audioStreamRef.current.getTracks().forEach(track => track.stop());
        audioStreamRef.current = null;
        wasActive = true;
      }

      // Send end of utterance signal to Nova Sonic when stopping
      if (wasActive && state.isSessionActive) {
        console.log('🛑 Sending end of utterance signal to Nova Sonic...');
        await sendAudioInput(new ArrayBuffer(0), true); // Empty audio with isEndOfUtterance: true
      }

      if (wasActive) {
        console.log('✅ Audio capture stopped');
      }
      return true;

    } catch (error) {
      console.error('❌ Error stopping audio capture:', error);
      return false;
    }
  }, [state.isSessionActive, sendAudioInput]);

  // Utility methods
  const isConnected = useCallback((): boolean => {
    return clientRef.current?.isConnected() || false;
  }, []);

  const clearError = useCallback(() => {
    updateState({ error: null });
  }, [updateState]);

  return {
    state,
    connect,
    disconnect,
    initializeSession,
    endSession,
    sendAudioInput,
    startAudioCapture,
    stopAudioCapture,
    isConnected,
    clearError
  };
}

export default useNovaWebSocket;