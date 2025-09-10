/**
 * AI Content Service for CognIA IntelliLearn
 * Manages structured AI-generated content with proper organization
 */

import { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb'
import { AWS_CONFIG } from '../config'

// AWS Clients
const s3Client = new S3Client({
  region: AWS_CONFIG.region
})

const dynamoClient = new DynamoDBClient({
  region: AWS_CONFIG.region
})

const docClient = DynamoDBDocumentClient.from(dynamoClient)

export interface AIContentMetadata {
  gradeLevel: string
  subject: string
  language: string
  tags: string[]
  contentType: 'voice_session' | 'bedrock_prompt' | 'text_output'
  createdAt: string
  studentId?: string
  sessionId?: string
  topic?: string
}

export interface VoiceSessionRequest {
  studentId: string
  topic: string
  grade: string
  language: string
  courseId: string
}

export interface VoiceSessionResponse {
  sessionId: string
  audioUrls: string[]
  textContent: string
  metadata: AIContentMetadata
  contextSources: string[]
}

export class AIContentService {
  private readonly bucketName = AWS_CONFIG.s3.vectorBucket
  private readonly tableName = AWS_CONFIG.dynamodb.table

  /**
   * Start enhanced voice session with educational context
   */
  async startVoiceSession(request: VoiceSessionRequest): Promise<VoiceSessionResponse> {
    try {
      const sessionId = `voice_${request.studentId}_${Date.now()}`
      const timestamp = new Date().toISOString()

      console.log('🎯 Starting enhanced voice session:', sessionId)

      // 1. Query related educational content
      const contextSources = await this.getEducationalContext(request.topic, request.courseId)
      
      // 2. Create metadata
      const metadata: AIContentMetadata = {
        gradeLevel: request.grade,
        subject: this.extractSubjectFromTopic(request.topic),
        language: request.language,
        tags: [request.topic.toLowerCase()],
        contentType: 'voice_session',
        createdAt: timestamp,
        studentId: request.studentId,
        sessionId,
        topic: request.topic
      }

      // 3. Save session metadata to DynamoDB
      await this.saveSessionMetadata(sessionId, metadata, contextSources)

      // 4. Create AI Content structure paths
      const aiContentPaths = {
        voiceSession: `AIContent/VoiceSessions/${request.studentId}/${timestamp}/`,
        bedrockPrompts: `AIContent/BedrockPrompts/${request.topic}/${sessionId}.json`,
        textOutput: `AIContent/TextOutput/${request.studentId}/${sessionId}.txt`
      }

      console.log('📁 AI Content paths created:', aiContentPaths)

      return {
        sessionId,
        audioUrls: [], // Will be populated as audio is generated
        textContent: '',
        metadata,
        contextSources
      }

    } catch (error) {
      console.error('❌ Error starting voice session:', error)
      throw error
    }
  }

  /**
   * Get educational context from Documents/ and Quiz/
   */
  private async getEducationalContext(topic: string, courseId: string): Promise<string[]> {
    try {
      const contextSources: string[] = []

      // Query Documents/ folder
      const documentsPrefix = `${courseId}/Documents/`
      const documentsResponse = await s3Client.send(new ListObjectsV2Command({
        Bucket: this.bucketName,
        Prefix: documentsPrefix,
        MaxKeys: 10
      }))

      if (documentsResponse.Contents) {
        for (const obj of documentsResponse.Contents) {
          if (obj.Key && this.isRelevantToTopic(obj.Key, topic)) {
            contextSources.push(obj.Key)
          }
        }
      }

      // Query Quiz/ folder
      const quizPrefix = `${courseId}/Quiz/`
      const quizResponse = await s3Client.send(new ListObjectsV2Command({
        Bucket: this.bucketName,
        Prefix: quizPrefix,
        MaxKeys: 5
      }))

      if (quizResponse.Contents) {
        for (const obj of quizResponse.Contents) {
          if (obj.Key && this.isRelevantToTopic(obj.Key, topic)) {
            contextSources.push(obj.Key)
          }
        }
      }

      console.log('📚 Educational context sources found:', contextSources.length)
      return contextSources

    } catch (error) {
      console.error('❌ Error getting educational context:', error)
      return []
    }
  }

  /**
   * Save voice session audio segment
   */
  async saveVoiceSegment(
    sessionId: string, 
    segmentNumber: number, 
    audioBuffer: Buffer,
    studentId: string
  ): Promise<string> {
    try {
      const timestamp = new Date().toISOString().split('T')[0] // YYYY-MM-DD
      const key = `AIContent/VoiceSessions/${studentId}/${timestamp}/segment${segmentNumber}.mp3`

      await s3Client.send(new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: audioBuffer,
        ContentType: 'audio/mpeg',
        Metadata: {
          sessionId,
          segmentNumber: segmentNumber.toString(),
          studentId,
          createdAt: new Date().toISOString()
        }
      }))

      const cloudFrontUrl = `https://CLOUDFRONT_URL_PLACEHOLDER/${key}`
      console.log('🎵 Voice segment saved:', cloudFrontUrl)
      
      return cloudFrontUrl

    } catch (error) {
      console.error('❌ Error saving voice segment:', error)
      throw error
    }
  }

  /**
   * Save Bedrock prompt and response
   */
  async saveBedrockPrompt(
    sessionId: string,
    topic: string,
    prompt: string,
    response: string
  ): Promise<void> {
    try {
      const key = `AIContent/BedrockPrompts/${topic}/${sessionId}.json`
      const promptData = {
        sessionId,
        topic,
        prompt,
        response,
        timestamp: new Date().toISOString(),
        model: 'anthropic.claude-3-haiku-20240307-v1:0'
      }

      await s3Client.send(new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: JSON.stringify(promptData, null, 2),
        ContentType: 'application/json'
      }))

      console.log('💭 Bedrock prompt saved:', key)

    } catch (error) {
      console.error('❌ Error saving Bedrock prompt:', error)
    }
  }

  /**
   * Save text output
   */
  async saveTextOutput(
    sessionId: string,
    studentId: string,
    textContent: string
  ): Promise<void> {
    try {
      const key = `AIContent/TextOutput/${studentId}/${sessionId}.txt`

      await s3Client.send(new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: textContent,
        ContentType: 'text/plain',
        Metadata: {
          sessionId,
          studentId,
          createdAt: new Date().toISOString()
        }
      }))

      console.log('📝 Text output saved:', key)

    } catch (error) {
      console.error('❌ Error saving text output:', error)
    }
  }

  /**
   * Save session metadata to DynamoDB
   */
  private async saveSessionMetadata(
    sessionId: string,
    metadata: AIContentMetadata,
    contextSources: string[]
  ): Promise<void> {
    try {
      // Check if docClient is available
      if (!docClient) {
        console.warn('⚠️ DynamoDB client not available, skipping session metadata save')
        return
      }
      
      await docClient.send(new PutCommand({
        TableName: this.tableName,
        Item: {
          PK: `VOICE_SESSION#${sessionId}`,
          SK: `METADATA`,
          sessionId,
          metadata,
          contextSources,
          createdAt: metadata.createdAt,
          TTL: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60) // 30 days
        }
      }))

      console.log('💾 Session metadata saved to DynamoDB')

    } catch (error) {
      console.error('❌ Error saving session metadata:', error)
    }
  }

  /**
   * Check if content is relevant to topic (simple keyword matching)
   */
  private isRelevantToTopic(filePath: string, topic: string): boolean {
    const fileName = filePath.toLowerCase()
    const topicKeywords = topic.toLowerCase().split(' ')
    
    return topicKeywords.some(keyword => 
      fileName.includes(keyword) || 
      fileName.includes(keyword.replace(/s$/, '')) // Remove plural
    )
  }

  /**
   * Extract subject from topic
   */
  private extractSubjectFromTopic(topic: string): string {
    const subjectMap: Record<string, string> = {
      'matematicas': 'Matemáticas',
      'math': 'Matemáticas',
      'fracciones': 'Matemáticas',
      'algebra': 'Matemáticas',
      'project': 'Project Management',
      'management': 'Project Management',
      'gestion': 'Gestión de Proyectos',
      'historia': 'Historia',
      'ciencias': 'Ciencias',
      'fisica': 'Física',
      'quimica': 'Química'
    }

    const topicLower = topic.toLowerCase()
    for (const [key, subject] of Object.entries(subjectMap)) {
      if (topicLower.includes(key)) {
        return subject
      }
    }

    return 'General'
  }

  /**
   * Get session history for student
   */
  async getStudentSessions(studentId: string, limit: number = 10): Promise<any[]> {
    try {
      const response = await docClient.send(new QueryCommand({
        TableName: this.tableName,
        IndexName: 'GSI1', // Assuming GSI1 exists for student queries
        KeyConditionExpression: 'GSI1PK = :studentId',
        ExpressionAttributeValues: {
          ':studentId': `STUDENT#${studentId}`
        },
        Limit: limit,
        ScanIndexForward: false // Most recent first
      }))

      return response.Items || []

    } catch (error) {
      console.error('❌ Error getting student sessions:', error)
      return []
    }
  }
}

// Export singleton instance
export const aiContentService = new AIContentService() 