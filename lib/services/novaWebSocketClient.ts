/**
 * Nova Sonic WebSocket Client
 * Frontend client for Nova Sonic WebSocket communication
 * Replaces direct SDK approach with WebSocket architecture
 * 
 * Architecture: React Component → WebSocket Client → WebSocket Server → Nova Sonic
 */

import { cognitoAuth } from './cognitoAuthService';

export interface NovaWebSocketConfig {
  wsUrl: string;
  maxReconnectAttempts?: number;
  reconnectDelay?: number;
  heartbeatInterval?: number;
}

export interface NovaSessionConfig {
  courseId?: string;
  studentId?: string;
  promptName?: string;
  audioContentName?: string;
}

export interface NovaEventHandler {
  onSessionReady?: (sessionId: string) => void;
  onAudioResponse?: (audioData: string, sessionId: string) => void;
  onTextResponse?: (text: string, sessionId: string) => void;
  onTranscription?: (transcript: string, sessionId: string) => void;
  onToolUse?: (toolName: string, toolInput: any, sessionId: string) => void;
  onInferenceComplete?: (sessionId: string) => void;
  onError?: (error: string, sessionId?: string) => void;
  onConnectionStateChange?: (state: 'connecting' | 'connected' | 'disconnected' | 'error') => void;
  onNovaResponse?: (event: any, sessionId: string) => void;
}

export class NovaWebSocketClient {
  private ws: WebSocket | null = null;
  private config: NovaWebSocketConfig;
  private eventHandlers: NovaEventHandler = {};
  private currentSessionId: string | null = null;
  private connectionState: 'connecting' | 'connected' | 'disconnected' | 'error' = 'disconnected';
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private authToken: string | null = null;

  constructor(config: NovaWebSocketConfig, eventHandlers: NovaEventHandler = {}) {
    this.config = {
      maxReconnectAttempts: 5,
      reconnectDelay: 3000,
      heartbeatInterval: 30000,
      ...config
    };
    this.eventHandlers = eventHandlers;
  }

  /**
   * Connect to WebSocket server
   */
  async connect(): Promise<boolean> {
    try {
      console.log('🔌 Connecting to Nova Sonic WebSocket server...');
      this.setConnectionState('connecting');

      // Get auth token from Cognito
      this.authToken = await this.getAuthToken();
      if (!this.authToken) {
        throw new Error('No authentication token available');
      }

      // Create WebSocket connection
      this.ws = new WebSocket(this.config.wsUrl);
      
      // Set up event listeners
      this.setupWebSocketEventListeners();

      // Wait for connection
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout'));
        }, 10000);

        this.ws!.onopen = () => {
          clearTimeout(timeout);
          console.log('✅ Connected to Nova Sonic WebSocket server');
          this.setConnectionState('connected');
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          resolve(true);
        };

        this.ws!.onerror = (error) => {
          clearTimeout(timeout);
          console.error('❌ WebSocket connection error:', error);
          this.setConnectionState('error');
          reject(error);
        };
      });

    } catch (error) {
      console.error('❌ Failed to connect to WebSocket server:', error);
      this.setConnectionState('error');
      this.eventHandlers.onError?.('Connection failed: ' + (error as Error).message);
      return false;
    }
  }

  /**
   * Setup WebSocket event listeners
   */
  private setupWebSocketEventListeners() {
    if (!this.ws) return;

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        this.handleMessage(message);
      } catch (error) {
        console.error('❌ Error parsing WebSocket message:', error);
      }
    };

    this.ws.onclose = (event) => {
      console.log('🔌 WebSocket connection closed:', event.code, event.reason);
      this.setConnectionState('disconnected');
      this.stopHeartbeat();
      
      // Attempt reconnection if not intentional
      if (event.code !== 1000 && this.reconnectAttempts < this.config.maxReconnectAttempts!) {
        this.scheduleReconnect();
      }
    };

    this.ws.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
      this.setConnectionState('error');
      this.eventHandlers.onError?.('WebSocket error occurred');
    };
  }

  /**
   * Handle incoming WebSocket messages
   * Updated for Nova Sonic Speech-to-Speech architecture per AWS documentation
   */
  private handleMessage(message: any) {
    console.log('📨 Received WebSocket message:', message.type);

    switch (message.type) {
      case 'connection_established':
        console.log('✅ WebSocket connection established');
        break;

      case 'session_initialized':
        this.currentSessionId = message.sessionId;
        console.log('✅ Nova Sonic session initialized:', this.currentSessionId);
        if (this.currentSessionId) {
          this.eventHandlers.onSessionReady?.(this.currentSessionId);
        }
        break;

      case 'nova_session_ready':
        console.log('✅ Nova Sonic Speech-to-Speech session ready for real-time streaming');
        this.eventHandlers.onSessionReady?.(message.sessionId);
        break;

      // Nova Sonic Speech-to-Speech Events (per AWS documentation)
      case 'transcription':
        console.log('📝 User speech transcription:', message.text || message.transcript);
        this.eventHandlers.onTranscription?.(message.text || message.transcript, message.sessionId);
        break;

      case 'text_response':
        console.log('💬 Nova Sonic text response:', message.text);
        this.eventHandlers.onTextResponse?.(message.text, message.sessionId);
        break;

      case 'audio_response':
        console.log('🔊 Nova Sonic audio response received');
        this.eventHandlers.onAudioResponse?.(message.audioBase64, message.sessionId);
        break;

      case 'tool_use':
        console.log('🛠️ Tool use event:', message.toolName);
        this.eventHandlers.onToolUse?.(message.toolName, message.toolInput, message.sessionId);
        break;

      case 'inference_complete':
        console.log('🎯 Nova Sonic inference complete');
        this.eventHandlers.onInferenceComplete?.(message.sessionId);
        break;

      // Legacy nova_response handler for backward compatibility
      case 'nova_response':
        this.handleNovaResponse(message.event, message.sessionId);
        break;

      case 'nova_error':
        console.error('❌ Nova Sonic error:', message.error);
        this.eventHandlers.onError?.(message.error, message.sessionId);
        break;

      case 'session_ended':
        console.log('✅ Nova Sonic session ended:', message.sessionId);
        if (this.currentSessionId === message.sessionId) {
          this.currentSessionId = null;
        }
        break;

      case 'error':
        console.error('❌ Server error:', message.error);
        this.eventHandlers.onError?.(message.error, message.sessionId);
        break;

      case 'pong':
        // Pong messages are responses to ping keepalive messages - no action needed
        break;

      default:
        // Only log unknown message types if they have a type field
        if (message.type) {
          console.log('📨 Unknown message type:', message.type);
        }
    }
  }

  /**
   * Handle Nova Sonic responses
   */
  private handleNovaResponse(event: any, sessionId: string) {
    if (!event) return;

    const eventType = Object.keys(event)[0];
    console.log('📨 Nova Sonic event:', eventType);

    // Notify generic event handler
    this.eventHandlers.onNovaResponse?.(event, sessionId);

    // Handle specific event types
    switch (eventType) {
      case 'audioOutput':
        if (event.audioOutput?.content) {
          console.log('🔊 Received audio output from Nova Sonic');
          this.eventHandlers.onAudioResponse?.(event.audioOutput.content, sessionId);
        }
        break;

      case 'textOutput':
        if (event.textOutput?.text) {
          console.log('📝 Received text output from Nova Sonic');
          this.eventHandlers.onTextResponse?.(event.textOutput.text, sessionId);
        }
        break;

      case 'inferenceOutput':
        console.log('🧠 Received inference output from Nova Sonic');
        break;

      case 'contentStart':
        console.log('▶️ Nova Sonic content started');
        break;

      case 'contentEnd':
        console.log('⏹️ Nova Sonic content ended');
        break;

      default:
        console.log('📨 Unhandled Nova event type:', eventType);
    }
  }

  /**
   * Initialize Nova Sonic session
   */
  async initializeSession(sessionConfig: NovaSessionConfig = {}): Promise<string | null> {
    try {
      if (!this.isConnected()) {
        throw new Error('WebSocket not connected');
      }

      if (!this.authToken) {
        this.authToken = await this.getAuthToken();
        if (!this.authToken) {
          throw new Error('No authentication token available');
        }
      }

      console.log('🎯 Initializing Nova Sonic session...');

      const message = {
        type: 'initialize_session',
        authToken: this.authToken,
        courseId: sessionConfig.courseId,
        studentId: sessionConfig.studentId,
        promptName: sessionConfig.promptName,
        audioContentName: sessionConfig.audioContentName
      };

      this.sendMessage(message);

      // Session ID will be received in response
      return new Promise((resolve, reject) => {
        console.log('⏱️ Setting session initialization timeout to 60 seconds');
        const timeout = setTimeout(() => {
          console.error('❌ Session initialization timed out after 60 seconds');
          reject(new Error('Session initialization timeout'));
        }, 60000); // Increased to 60 seconds for Nova Sonic initialization

        const originalHandler = this.eventHandlers.onSessionReady;
        this.eventHandlers.onSessionReady = (sessionId: string) => {
          clearTimeout(timeout);
          this.eventHandlers.onSessionReady = originalHandler;
          resolve(sessionId);
          originalHandler?.(sessionId);
        };

        const originalErrorHandler = this.eventHandlers.onError;
        this.eventHandlers.onError = (error: string, sessionId?: string) => {
          clearTimeout(timeout);
          this.eventHandlers.onError = originalErrorHandler;
          reject(new Error(error));
          originalErrorHandler?.(error, sessionId);
        };
      });

    } catch (error) {
      console.error('❌ Failed to initialize session:', error);
      this.eventHandlers.onError?.('Session initialization failed: ' + (error as Error).message);
      return null;
    }
  }

  /**
   * Send continuous audio input to Nova Sonic Speech-to-Speech
   * Per AWS documentation: Continuous audio streaming from user to model
   */
  async sendAudioInput(audioData: string | ArrayBuffer, isEndOfUtterance: boolean = false): Promise<boolean> {
    try {
      if (!this.isConnected() || !this.currentSessionId) {
        console.warn('❌ Cannot send audio - no active session');
        return false;
      }

      // Convert audio data to base64 if needed
      let base64Audio: string;
      if (audioData instanceof ArrayBuffer) {
        // Handle empty ArrayBuffer case
        if (audioData.byteLength === 0) {
          base64Audio = '';
        } else {
          // Use more efficient conversion for large buffers
          const uint8Array = new Uint8Array(audioData);
          let binary = '';
          const chunkSize = 8192; // Process in chunks to avoid stack overflow
          
          for (let i = 0; i < uint8Array.length; i += chunkSize) {
            const chunk = uint8Array.slice(i, Math.min(i + chunkSize, uint8Array.length));
            binary += String.fromCharCode.apply(null, Array.from(chunk));
          }
          
          base64Audio = btoa(binary);
        }
      } else {
        base64Audio = audioData;
      }

      const message = {
        type: 'audio_input',
        sessionId: this.currentSessionId,
        audioData: base64Audio,
        isEndOfUtterance: isEndOfUtterance
      };

      this.sendMessage(message);
      console.log('🎤 Audio input sent to Nova Sonic');
      return true;

    } catch (error) {
      console.error('❌ Failed to send audio input:', error);
      this.eventHandlers.onError?.('Failed to send audio input: ' + (error as Error).message);
      return false;
    }
  }

  /**
   * End current session
   */
  async endSession(): Promise<boolean> {
    try {
      if (!this.currentSessionId) {
        console.log('ℹ️ No active session to end');
        return true;
      }

      console.log('🛑 Ending Nova Sonic session:', this.currentSessionId);

      const message = {
        type: 'end_session',
        sessionId: this.currentSessionId
      };

      this.sendMessage(message);
      this.currentSessionId = null;
      return true;

    } catch (error) {
      console.error('❌ Failed to end session:', error);
      return false;
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect() {
    console.log('🔌 Disconnecting from WebSocket server...');
    
    this.stopHeartbeat();
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close(1000, 'Client disconnecting');
      this.ws = null;
    }

    this.currentSessionId = null;
    this.setConnectionState('disconnected');
  }

  /**
   * Send message to WebSocket server
   */
  private sendMessage(message: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('⚠️ WebSocket not ready to send message');
    }
  }

  /**
   * Get authentication token
   */
  private async getAuthToken(): Promise<string | null> {
    try {
      const bearerToken = await cognitoAuth.getBearerToken();
      // Extract token from "Bearer <token>" format
      return bearerToken.replace('Bearer ', '');
    } catch (error) {
      console.error('❌ Failed to get auth token:', error);
      return null;
    }
  }

  /**
   * Set connection state and notify handlers
   */
  private setConnectionState(state: 'connecting' | 'connected' | 'disconnected' | 'error') {
    if (this.connectionState !== state) {
      this.connectionState = state;
      this.eventHandlers.onConnectionStateChange?.(state);
    }
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect() {
    if (this.reconnectTimer) return;

    this.reconnectAttempts++;
    const delay = this.config.reconnectDelay! * this.reconnectAttempts;

    console.log(`🔄 Scheduling reconnect attempt ${this.reconnectAttempts}/${this.config.maxReconnectAttempts} in ${delay}ms`);

    this.reconnectTimer = setTimeout(async () => {
      this.reconnectTimer = null;
      try {
        await this.connect();
      } catch (error) {
        console.error('❌ Reconnection failed:', error);
      }
    }, delay);
  }

  /**
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat() {
    this.stopHeartbeat();
    
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected()) {
        this.sendMessage({ type: 'ping', timestamp: Date.now() });
      }
    }, this.config.heartbeatInterval!);
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * Check if WebSocket is connected
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * Get current connection state
   */
  getConnectionState(): 'connecting' | 'connected' | 'disconnected' | 'error' {
    return this.connectionState;
  }

  /**
   * Get current session ID
   */
  getCurrentSessionId(): string | null {
    return this.currentSessionId;
  }

  /**
   * Update event handlers
   */
  updateEventHandlers(newHandlers: Partial<NovaEventHandler>) {
    this.eventHandlers = { ...this.eventHandlers, ...newHandlers };
  }
}

// Export singleton instance for app-wide use
export const novaWebSocketClient = new NovaWebSocketClient({
      wsUrl: process.env.NEXT_PUBLIC_NOVA_WEBSOCKET_URL || 'wss://d3m4wrd20w0beh.cloudfront.net/ws'
});

export default NovaWebSocketClient;