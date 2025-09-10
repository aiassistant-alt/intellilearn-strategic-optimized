/**
 * Vectorization Service for CognIA IntelliLearn
 * Indexes Documents/ and Quiz/ content using Amazon Titan Embeddings
 */

import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime'
import { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3'
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { AWS_CONFIG } from '../config'

// AWS Clients
const bedrockClient = new BedrockRuntimeClient({
  region: AWS_CONFIG.region
})

const s3Client = new S3Client({
  region: AWS_CONFIG.region
})

const dynamoClient = new DynamoDBClient({
  region: AWS_CONFIG.region
})

const docClient = DynamoDBDocumentClient.from(dynamoClient)

export interface DocumentVector {
  documentId: string
  filePath: string
  vectorId: string
  embedding: number[]
  metadata: {
    courseId: string
    contentType: 'document' | 'quiz'
    subject: string
    gradeLevel: string
    language: string
    tags: string[]
    fileSize: number
    lastModified: string
  }
}

export interface VectorSearchResult {
  documentId: string
  filePath: string
  similarity: number
  metadata: DocumentVector['metadata']
  excerpt?: string
}

export class VectorizationService {
  private readonly bucketName = AWS_CONFIG.s3.vectorBucket
  private readonly tableName = AWS_CONFIG.dynamodb.table
  private readonly embeddingModel = 'amazon.titan-embed-text-v2:0'

  /**
   * Index all documents in a course
   */
  async indexCourseContent(courseId: string): Promise<void> {
    try {
      console.log('🔍 Starting vectorization for course:', courseId)

      // Index Documents/
      await this.indexFolder(courseId, 'Documents', 'document')
      
      // Index Quiz/
      await this.indexFolder(courseId, 'Quiz', 'quiz')

      console.log('✅ Course vectorization completed:', courseId)

    } catch (error) {
      console.error('❌ Error indexing course content:', error)
      throw error
    }
  }

  /**
   * Index specific folder content
   */
  private async indexFolder(
    courseId: string, 
    folderName: string, 
    contentType: 'document' | 'quiz'
  ): Promise<void> {
    try {
      const prefix = `${courseId}/${folderName}/`
      console.log('📁 Indexing folder:', prefix)

      const response = await s3Client.send(new ListObjectsV2Command({
        Bucket: this.bucketName,
        Prefix: prefix
      }))

      if (!response.Contents) {
        console.log('📭 No content found in folder:', prefix)
        return
      }

      for (const obj of response.Contents) {
        if (obj.Key && obj.Size && obj.Size > 0) {
          await this.indexDocument(obj.Key, courseId, contentType)
        }
      }

    } catch (error) {
      console.error(`❌ Error indexing ${folderName} folder:`, error)
    }
  }

  /**
   * Index individual document
   */
  private async indexDocument(
    filePath: string, 
    courseId: string, 
    contentType: 'document' | 'quiz'
  ): Promise<void> {
    try {
      console.log('📄 Processing document:', filePath)

      // Check if already indexed
      const documentId = this.generateDocumentId(filePath)
      const existingVector = await this.getExistingVector(documentId)
      
      if (existingVector) {
        console.log('⏭️ Document already indexed:', filePath)
        return
      }

      // Get document content
      const content = await this.getDocumentContent(filePath)
      if (!content) {
        console.log('⚠️ Could not extract content from:', filePath)
        return
      }

      // Generate embedding
      const embedding = await this.generateEmbedding(content)
      if (!embedding) {
        console.log('⚠️ Could not generate embedding for:', filePath)
        return
      }

      // Create metadata
      const metadata = await this.createDocumentMetadata(filePath, courseId, contentType)

      // Create vector object
      const documentVector: DocumentVector = {
        documentId,
        filePath,
        vectorId: `educational-index/${documentId}.vector`,
        embedding,
        metadata
      }

      // Save vector to S3 Vectors structure
      await this.saveVector(documentVector)

      // Save metadata to DynamoDB
      await this.saveVectorMetadata(documentVector)

      console.log('✅ Document indexed:', filePath)

    } catch (error) {
      console.error('❌ Error indexing document:', filePath, error)
    }
  }

  /**
   * Generate embedding using Amazon Titan
   */
  private async generateEmbedding(text: string): Promise<number[] | null> {
    try {
      // Truncate text if too long (Titan has limits)
      const truncatedText = text.substring(0, 8000)

      const response = await bedrockClient.send(new InvokeModelCommand({
        modelId: this.embeddingModel,
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify({
          inputText: truncatedText,
          dimensions: 1024,
          normalize: true
        })
      }))

      if (response.body) {
        const result = JSON.parse(new TextDecoder().decode(response.body))
        return result.embedding
      }

      return null

    } catch (error) {
      console.error('❌ Error generating embedding:', error)
      return null
    }
  }

  /**
   * Get document content (simplified - assumes text files)
   */
  private async getDocumentContent(filePath: string): Promise<string | null> {
    try {
      const response = await s3Client.send(new GetObjectCommand({
        Bucket: this.bucketName,
        Key: filePath
      }))

      if (response.Body) {
        const content = await response.Body.transformToString()
        return content
      }

      return null

    } catch (error) {
      console.error('❌ Error getting document content:', error)
      return null
    }
  }

  /**
   * Save vector to S3 in organized structure
   */
  private async saveVector(documentVector: DocumentVector): Promise<void> {
    try {
      const vectorData = {
        documentId: documentVector.documentId,
        filePath: documentVector.filePath,
        embedding: documentVector.embedding,
        metadata: documentVector.metadata,
        createdAt: new Date().toISOString()
      }

      await s3Client.send(new PutObjectCommand({
        Bucket: this.bucketName,
        Key: documentVector.vectorId,
        Body: JSON.stringify(vectorData),
        ContentType: 'application/json',
        Metadata: {
          documentId: documentVector.documentId,
          contentType: documentVector.metadata.contentType,
          courseId: documentVector.metadata.courseId
        }
      }))

      console.log('💾 Vector saved:', documentVector.vectorId)

    } catch (error) {
      console.error('❌ Error saving vector:', error)
      throw error
    }
  }

  /**
   * Save vector metadata to DynamoDB for fast queries
   */
  private async saveVectorMetadata(documentVector: DocumentVector): Promise<void> {
    try {
      await docClient.send(new PutCommand({
        TableName: this.tableName,
        Item: {
          PK: `VECTOR#${documentVector.documentId}`,
          SK: `METADATA`,
          documentId: documentVector.documentId,
          filePath: documentVector.filePath,
          vectorId: documentVector.vectorId,
          courseId: documentVector.metadata.courseId,
          contentType: documentVector.metadata.contentType,
          subject: documentVector.metadata.subject,
          gradeLevel: documentVector.metadata.gradeLevel,
          tags: documentVector.metadata.tags,
          createdAt: new Date().toISOString(),
          GSI1PK: `COURSE#${documentVector.metadata.courseId}`,
          GSI1SK: `${documentVector.metadata.contentType}#${documentVector.documentId}`
        }
      }))

      console.log('💾 Vector metadata saved to DynamoDB')

    } catch (error) {
      console.error('❌ Error saving vector metadata:', error)
    }
  }

  /**
   * Search similar content by text query
   */
  async searchSimilarContent(
    query: string, 
    courseId: string, 
    limit: number = 5
  ): Promise<VectorSearchResult[]> {
    try {
      console.log('🔍 Searching similar content for:', query)

      // Generate query embedding
      const queryEmbedding = await this.generateEmbedding(query)
      if (!queryEmbedding) {
        return []
      }

      // Get all vectors for the course
      const courseVectors = await this.getCourseVectors(courseId)
      
      // Calculate similarities
      const similarities = courseVectors.map(vector => ({
        ...vector,
        similarity: this.calculateCosineSimilarity(queryEmbedding, vector.embedding)
      }))

      // Sort by similarity and return top results
      const results = similarities
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit)
        .map(result => ({
          documentId: result.documentId,
          filePath: result.filePath,
          similarity: result.similarity,
          metadata: result.metadata,
          excerpt: this.generateExcerpt(result.filePath)
        }))

      console.log('📊 Found similar content:', results.length)
      return results

    } catch (error) {
      console.error('❌ Error searching similar content:', error)
      return []
    }
  }

  /**
   * Get all vectors for a course
   */
  private async getCourseVectors(courseId: string): Promise<DocumentVector[]> {
    try {
      const response = await docClient.send(new QueryCommand({
        TableName: this.tableName,
        IndexName: 'GSI1',
        KeyConditionExpression: 'GSI1PK = :courseId',
        ExpressionAttributeValues: {
          ':courseId': `COURSE#${courseId}`
        }
      }))

      const vectors: DocumentVector[] = []
      
      if (response.Items) {
        for (const item of response.Items) {
          // Load full vector data from S3
          const vectorData = await this.loadVectorFromS3(item.vectorId)
          if (vectorData) {
            vectors.push(vectorData)
          }
        }
      }

      return vectors

    } catch (error) {
      console.error('❌ Error getting course vectors:', error)
      return []
    }
  }

  /**
   * Load vector data from S3
   */
  private async loadVectorFromS3(vectorId: string): Promise<DocumentVector | null> {
    try {
      const response = await s3Client.send(new GetObjectCommand({
        Bucket: this.bucketName,
        Key: vectorId
      }))

      if (response.Body) {
        const vectorData = JSON.parse(await response.Body.transformToString())
        return vectorData
      }

      return null

    } catch (error) {
      console.error('❌ Error loading vector from S3:', error)
      return null
    }
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private calculateCosineSimilarity(vectorA: number[], vectorB: number[]): number {
    if (vectorA.length !== vectorB.length) {
      return 0
    }

    let dotProduct = 0
    let normA = 0
    let normB = 0

    for (let i = 0; i < vectorA.length; i++) {
      dotProduct += vectorA[i] * vectorB[i]
      normA += vectorA[i] * vectorA[i]
      normB += vectorB[i] * vectorB[i]
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
  }

  /**
   * Helper methods
   */
  private generateDocumentId(filePath: string): string {
    return `doc_${Buffer.from(filePath).toString('base64').substring(0, 16)}`
  }

  private async getExistingVector(documentId: string): Promise<boolean> {
    try {
      await docClient.send(new GetCommand({
        TableName: this.tableName,
        Key: {
          PK: `VECTOR#${documentId}`,
          SK: 'METADATA'
        }
      }))
      return true
    } catch {
      return false
    }
  }

  private async createDocumentMetadata(
    filePath: string, 
    courseId: string, 
    contentType: 'document' | 'quiz'
  ): Promise<DocumentVector['metadata']> {
    // Load metadata.json if exists
    const metadataPath = filePath.replace(/\.[^/.]+$/, '.metadata.json')
    
    try {
      const response = await s3Client.send(new GetObjectCommand({
        Bucket: this.bucketName,
        Key: metadataPath
      }))

      if (response.Body) {
        const metadata = JSON.parse(await response.Body.transformToString())
        return {
          courseId,
          contentType,
          subject: metadata.subject || 'General',
          gradeLevel: metadata.gradeLevel || 'General',
          language: metadata.language || 'es',
          tags: metadata.tags || [],
          fileSize: 0,
          lastModified: new Date().toISOString()
        }
      }
    } catch {
      // Metadata file doesn't exist, use defaults
    }

    return {
      courseId,
      contentType,
      subject: 'General',
      gradeLevel: 'General',
      language: 'es',
      tags: [],
      fileSize: 0,
      lastModified: new Date().toISOString()
    }
  }

  private generateExcerpt(filePath: string): string {
    const fileName = filePath.split('/').pop() || ''
    return `Contenido educativo: ${fileName}`
  }
}

// Export singleton instance
export const vectorizationService = new VectorizationService() 