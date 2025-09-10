import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand, QueryCommand } from '@aws-sdk/lib-dynamodb'
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { AWS_CONFIG } from '../config'
import { awsCredentialsService } from './awsCredentialsService'

// Variables para los clientes AWS
let dynamoClient: DynamoDBClient
let docClient: DynamoDBDocumentClient
let bedrockClient: BedrockRuntimeClient
let s3Client: S3Client
let voiceClientsInitialized = false

// Función para inicializar los clientes AWS con credenciales temporales
async function initializeVoiceClients() {
  if (voiceClientsInitialized) return
  
  try {
    const credentials = await awsCredentialsService.getCredentials()
    
    const awsConfig = {
      region: AWS_CONFIG.region,
      credentials: credentials
    }
    
    dynamoClient = new DynamoDBClient(awsConfig)
    docClient = DynamoDBDocumentClient.from(dynamoClient)
    bedrockClient = new BedrockRuntimeClient(awsConfig)
    s3Client = new S3Client(awsConfig)
    
    voiceClientsInitialized = true
  } catch (error) {
    console.warn('⚠️ Voice clients initialization failed, voice sessions will use Lambda endpoints:', error)
    // Set flag to indicate clients are "initialized" but will use fallback methods
    voiceClientsInitialized = true
  }
}

// DynamoDB Tables
const VOICE_SESSIONS_TABLE = 'intellilearn-voice-sessions'
const VOICE_CONVERSATIONS_TABLE = 'intellilearn-voice-conversations'
const VOICE_CONTENT_TABLE = 'intellilearn-voice-content'

// S3 Configuration
const AUDIO_BUCKET = 'integration-aws-app-076276934311'
const AUDIO_PREFIX = 'voice-sessions'

// Types
export interface VoiceSessionConfig {
  voiceSpeed: string
  voiceStyle: string
  duration: number
  interactionLevel: string
  aiModel: string
  personality: string
  topic: string
  level: string
}

export interface VoiceSession {
  sessionId: string
  studentId: string
  lessonId: string
  courseId: string
  config: VoiceSessionConfig
  status: 'active' | 'paused' | 'completed' | 'cancelled'
  createdAt: string
  updatedAt: string
  totalDuration: number
  currentSegment: number
  audioSegments: AudioSegment[]
}

export interface AudioSegment {
  segmentId: string
  sequenceNumber: number
  text: string
  audioUrl?: string
  duration: number
  isProcessed: boolean
}

export interface ConversationMessage {
  messageId: string
  sessionId: string
  studentId: string
  type: 'student_audio' | 'ai_response' | 'system'
  content: string
  audioUrl?: string
  timestamp: string
  metadata?: Record<string, any>
}

export interface VoiceContent {
  contentId: string
  lessonId: string
  topic: string
  level: string
  generatedText: string
  segments: AudioSegment[]
  createdAt: string
  isProcessed: boolean
}

export class VoiceSessionService {
  
  /**
   * Create a new voice session
   */
  static async createVoiceSession(
    studentId: string,
    lessonId: string,
    courseId: string,
    config: VoiceSessionConfig
  ): Promise<VoiceSession> {
    try {
      // Inicializar clientes AWS si es necesario
      await initializeVoiceClients()
      
      const sessionId = `vs_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      const session: VoiceSession = {
        sessionId,
        studentId,
        lessonId,
        courseId,
        config,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        totalDuration: 0,
        currentSegment: 0,
        audioSegments: []
      }

      // Save session to DynamoDB
      await docClient.send(new PutCommand({
        TableName: VOICE_SESSIONS_TABLE,
        Item: session
      }))

      // Generate content if not exists
      await this.generateVoiceContent(lessonId, config)

      return session

    } catch (error) {
      console.error('Error creating voice session:', error)
      throw new Error(`Failed to create voice session: ${error}`)
    }
  }

  /**
   * Generate voice content using Bedrock with S3 Vectors context
   */
  static async generateVoiceContent(
    lessonId: string,
    config: VoiceSessionConfig
  ): Promise<VoiceContent> {
    try {
      // Inicializar clientes AWS si es necesario
      await initializeVoiceClients()
      // Check if content already exists
      const existingContent = await this.getVoiceContent(lessonId, config.topic, config.level)
      if (existingContent && existingContent.isProcessed) {
        return existingContent
      }

      // Generate educational content using Bedrock directly
      console.log(`📚 Generating educational content: ${config.topic} (${config.level})`)
      
      // Build enhanced prompt for educational content
      const prompt = this.buildEducationalPrompt(
        config.topic,
        config.level,
        config
      )

      console.log(`🤖 Generating content with enhanced prompt...`)

      // Step 3 - Generate personalized content using Bedrock
      const generatedText = await this.callBedrock(prompt)
      
      // Split content into segments (1 minute each)
      const segments = this.splitIntoSegments(generatedText, config.duration)
      
      const contentId = `vc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      const voiceContent: VoiceContent = {
        contentId,
        lessonId,
        topic: config.topic,
        level: config.level,
        generatedText,
        segments,
        createdAt: new Date().toISOString(),
        isProcessed: false
      }

      // Save to DynamoDB
      await docClient.send(new PutCommand({
        TableName: VOICE_CONTENT_TABLE,
        Item: voiceContent
      }))

      // Process audio segments with Polly
      await this.processAudioSegments(contentId, segments, config)

      return voiceContent

    } catch (error) {
      console.error('Error generating voice content:', error)
      throw new Error(`Failed to generate voice content: ${error}`)
    }
  }

  /**
   * Build prompt for Bedrock content generation (Legacy - now using S3VectorsService.buildPromptWithContext)
   * @deprecated Use S3VectorsService.buildPromptWithContext for enhanced context-aware prompts
   */
  private static buildContentPrompt(config: VoiceSessionConfig): string {
    return `You are an expert ${config.personality} professor teaching about ${config.topic}.

Create a ${config.duration}-minute educational lesson for ${config.level} level students.

Requirements:
- Speak in a ${config.voiceStyle} teaching style
- Divide the content into ${config.duration} segments of approximately 1 minute each
- Each segment should be clearly marked with [SEGMENT X] headers
- Use ${config.interactionLevel} level of student interaction prompts
- Make it engaging and educational
- Include practical examples and real-world applications

Format your response as:
[SEGMENT 1]
Content for first minute...

[SEGMENT 2]
Content for second minute...

And so on for ${config.duration} segments.

Begin the lesson now:`
  }

  /**
   * Build educational prompt for Bedrock content generation
   */
  private static buildEducationalPrompt(
    topic: string,
    level: string,
    config: VoiceSessionConfig
  ): string {
    return `You are an expert ${config.personality} professor teaching about ${topic}.

Create a ${config.duration}-minute educational lesson for ${level} level students.

Requirements:
- Speak in a ${config.voiceStyle} teaching style
- Divide the content into ${config.duration} segments of approximately 1 minute each
- Each segment should be clearly marked with [SEGMENT X] headers
- Use ${config.interactionLevel} level of student interaction prompts
- Make it engaging and educational
- Include practical examples and real-world applications

Format your response as:
[SEGMENT 1]
Content for first minute...

[SEGMENT 2]
Content for second minute...

And so on for ${config.duration} segments.

Begin the lesson now:`
  }

  /**
   * Call Amazon Bedrock via Lambda for content generation
   */
  private static async callBedrock(prompt: string): Promise<string> {
    try {
      // Lambda endpoint disabled - skip backend notification
      const useLambda = false;
      const lambdaEndpoint = process.env.NEXT_PUBLIC_LAMBDA_BEDROCK_ENDPOINT;
      if (!useLambda || !lambdaEndpoint) {
        console.log('⚠️ Lambda endpoint disabled or not configured, returning default response');
        return 'Sesión de voz iniciada. El endpoint Lambda está deshabilitado para evitar errores CORS.';
      }

    const response = await fetch(lambdaEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_AWS_BEARER_TOKEN_BEDROCK || ''}`
        },
        body: JSON.stringify({
          audioData: prompt,
          sessionId: `voice_session_${Date.now()}`,
          courseId: '000000000',
          topic: 'Voice Session Content',
          studentId: 'voice_user',
          contextSources: [],
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error(`Lambda request failed: ${response.status}`);
      }

      const data = await response.json();
      
      // Extract AI response from Lambda response chunks
      const aiResponseChunks = data.chunks?.filter((chunk: any) => chunk.type === 'ai_response') || [];
      const aiResponse = aiResponseChunks.map((chunk: any) => chunk.text).join('');
      
      return aiResponse || 'Unable to generate content at this time.';

    } catch (error) {
      console.error('Error calling Bedrock via Lambda:', error)
      throw new Error(`Lambda Bedrock API error: ${error}`)
    }
  }

  /**
   * Split generated content into audio segments
   */
  private static splitIntoSegments(text: string, totalMinutes: number): AudioSegment[] {
    const segments: AudioSegment[] = []
    const segmentRegex = /\[SEGMENT (\d+)\](.*?)(?=\[SEGMENT \d+\]|$)/g
    
    let match
    let sequenceNumber = 1
    
    while ((match = segmentRegex.exec(text)) !== null) {
      const segmentText = match[2].trim()
      
      if (segmentText) {
        segments.push({
          segmentId: `seg_${Date.now()}_${sequenceNumber}`,
          sequenceNumber,
          text: segmentText,
          duration: 60, // 1 minute per segment
          isProcessed: false
        })
        sequenceNumber++
      }
    }

    // If no segments found, split by estimated word count
    if (segments.length === 0) {
      const wordsPerMinute = 150 // Average speaking pace
      const words = text.split(/\s+/)
      const wordsPerSegment = wordsPerMinute
      
      for (let i = 0; i < totalMinutes; i++) {
        const startIndex = i * wordsPerSegment
        const endIndex = Math.min((i + 1) * wordsPerSegment, words.length)
        const segmentWords = words.slice(startIndex, endIndex)
        
        if (segmentWords.length > 0) {
          segments.push({
            segmentId: `seg_${Date.now()}_${i + 1}`,
            sequenceNumber: i + 1,
            text: segmentWords.join(' '),
            duration: 60,
            isProcessed: false
          })
        }
      }
    }

    return segments
  }

  /**
   * Process audio segments with Amazon Polly
   */
  private static async processAudioSegments(
    contentId: string,
    segments: AudioSegment[],
    config: VoiceSessionConfig
  ): Promise<void> {
    try {
      const processPromises = segments.map(async (segment) => {
        const audioKey = `${AUDIO_PREFIX}/${contentId}/${segment.segmentId}.mp3`
        
        // Synthesize speech with Polly
        const command = new InvokeModelCommand({
          modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
          contentType: 'application/json',
          accept: 'application/json',
          body: JSON.stringify({
            anthropic_version: 'bedrock-2023-05-31',
            max_tokens: 4000,
            messages: [
              {
                role: 'user',
                content: `You are an expert ${config.personality} professor teaching about ${config.topic}.

Create a ${config.duration}-minute educational lesson for ${config.level} level students.

Requirements:
- Speak in a ${config.voiceStyle} teaching style
- Divide the content into ${config.duration} segments of approximately 1 minute each
- Each segment should be clearly marked with [SEGMENT X] headers
- Use ${config.interactionLevel} level of student interaction prompts
- Make it engaging and educational
- Include practical examples and real-world applications

Format your response as:
[SEGMENT 1]
Content for first minute...

[SEGMENT 2]
Content for second minute...

And so on for ${config.duration} segments.

Begin the lesson now:`
            }
          ],
            temperature: 0.7,
            top_p: 0.9
          })
        })

        const pollyResponse = await bedrockClient.send(command)
        
        if (pollyResponse.body) {
          // Upload to S3
          const audioBuffer = await this.streamToBuffer(pollyResponse.body)
          
          await s3Client.send(new PutObjectCommand({
            Bucket: AUDIO_BUCKET,
            Key: audioKey,
            Body: audioBuffer,
            ContentType: 'audio/mpeg',
            Metadata: {
              contentId,
              segmentId: segment.segmentId,
              sequenceNumber: segment.sequenceNumber.toString()
            }
          }))

          // Update segment with audio URL
          segment.audioUrl = `https://CLOUDFRONT_URL_PLACEHOLDER/${audioKey}`
          segment.isProcessed = true
        }
      })

      await Promise.all(processPromises)

      // Update content as processed
      await docClient.send(new UpdateCommand({
        TableName: VOICE_CONTENT_TABLE,
        Key: { contentId },
        UpdateExpression: 'SET isProcessed = :processed, segments = :segments, updatedAt = :updatedAt',
        ExpressionAttributeValues: {
          ':processed': true,
          ':segments': segments,
          ':updatedAt': new Date().toISOString()
        }
      }))

    } catch (error) {
      console.error('Error processing audio segments:', error)
      throw new Error(`Failed to process audio segments: ${error}`)
    }
  }

  /**
   * Convert stream to buffer
   */
  private static async streamToBuffer(stream: any): Promise<Uint8Array> {
    const chunks: Uint8Array[] = []
    
    for await (const chunk of stream) {
      chunks.push(new Uint8Array(chunk))
    }
    
    // Calculate total length
    const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0)
    
    // Create a new Uint8Array and copy all chunks into it
    const result = new Uint8Array(totalLength)
    let offset = 0
    
    for (const chunk of chunks) {
      result.set(chunk, offset)
      offset += chunk.length
    }
    
    return result
  }

  /**
   * Save conversation message
   */
  static async saveConversationMessage(
    sessionId: string,
    studentId: string,
    type: 'student_audio' | 'ai_response' | 'system',
    content: string,
    audioUrl?: string,
    metadata?: Record<string, any>
  ): Promise<ConversationMessage> {
    try {
      // Inicializar clientes AWS si es necesario
      await initializeVoiceClients()
      
      const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      const message: ConversationMessage = {
        messageId,
        sessionId,
        studentId,
        type,
        content,
        audioUrl,
        timestamp: new Date().toISOString(),
        metadata
      }

      await docClient.send(new PutCommand({
        TableName: VOICE_CONVERSATIONS_TABLE,
        Item: message
      }))

      return message

    } catch (error) {
      console.error('Error saving conversation message:', error)
      throw new Error(`Failed to save conversation message: ${error}`)
    }
  }

  /**
   * Get conversation history for a session
   */
  static async getConversationHistory(sessionId: string): Promise<ConversationMessage[]> {
    try {
      // Inicializar clientes AWS si es necesario
      await initializeVoiceClients()
      
      const command = new QueryCommand({
        TableName: VOICE_CONVERSATIONS_TABLE,
        KeyConditionExpression: 'sessionId = :sessionId',
        ExpressionAttributeValues: {
          ':sessionId': sessionId
        },
        ScanIndexForward: true // Sort by timestamp ascending
      })

      const result = await docClient.send(command)
      return result.Items as ConversationMessage[] || []

    } catch (error) {
      console.error('Error getting conversation history:', error)
      return []
    }
  }

  /**
   * Get voice content
   */
  static async getVoiceContent(lessonId: string, topic: string, level: string): Promise<VoiceContent | null> {
    try {
      const command = new QueryCommand({
        TableName: VOICE_CONTENT_TABLE,
        KeyConditionExpression: 'lessonId = :lessonId',
        FilterExpression: 'topic = :topic AND #level = :level',
        ExpressionAttributeNames: {
          '#level': 'level'
        },
        ExpressionAttributeValues: {
          ':lessonId': lessonId,
          ':topic': topic,
          ':level': level
        }
      })

      const result = await docClient.send(command)
      return result.Items?.[0] as VoiceContent || null

    } catch (error) {
      console.error('Error getting voice content:', error)
      return null
    }
  }

  /**
   * Get voice session
   */
  static async getVoiceSession(sessionId: string): Promise<VoiceSession | null> {
    try {
      const command = new GetCommand({
        TableName: VOICE_SESSIONS_TABLE,
        Key: { sessionId }
      })

      const result = await docClient.send(command)
      return result.Item as VoiceSession || null

    } catch (error) {
      console.error('Error getting voice session:', error)
      return null
    }
  }

  /**
   * Update voice session status
   */
  static async updateSessionStatus(
    sessionId: string,
    status: 'active' | 'paused' | 'completed' | 'cancelled',
    currentSegment?: number
  ): Promise<void> {
    try {
      let updateExpression = 'SET #status = :status, updatedAt = :updatedAt'
      const expressionAttributeNames: Record<string, string> = {
        '#status': 'status'
      }
      const expressionAttributeValues: Record<string, any> = {
        ':status': status,
        ':updatedAt': new Date().toISOString()
      }

      if (currentSegment !== undefined) {
        updateExpression += ', currentSegment = :currentSegment'
        expressionAttributeValues[':currentSegment'] = currentSegment
      }

      await docClient.send(new UpdateCommand({
        TableName: VOICE_SESSIONS_TABLE,
        Key: { sessionId },
        UpdateExpression: updateExpression,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues
      }))

    } catch (error) {
      console.error('Error updating session status:', error)
      throw new Error(`Failed to update session status: ${error}`)
    }
  }

  /**
   * Get active session for student and lesson
   */
  static async getActiveSession(studentId: string, lessonId: string): Promise<VoiceSession | null> {
    try {
      const command = new QueryCommand({
        TableName: VOICE_SESSIONS_TABLE,
        IndexName: 'StudentLessonIndex', // Assuming we have this GSI
        KeyConditionExpression: 'studentId = :studentId AND lessonId = :lessonId',
        FilterExpression: '#status = :status',
        ExpressionAttributeNames: {
          '#status': 'status'
        },
        ExpressionAttributeValues: {
          ':studentId': studentId,
          ':lessonId': lessonId,
          ':status': 'active'
        }
      })

      const result = await docClient.send(command)
      return result.Items?.[0] as VoiceSession || null

    } catch (error) {
      console.error('Error getting active session:', error)
      return null
    }
  }
} 