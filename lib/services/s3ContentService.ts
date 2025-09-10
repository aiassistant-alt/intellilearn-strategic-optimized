import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { AWS_CONFIG } from '../config'
import { awsCredentialsService } from './awsCredentialsService'

// Variable para el cliente S3
let s3Client: S3Client
let s3ClientInitialized = false

// Función para inicializar el cliente S3 con credenciales temporales
async function initializeS3Client() {
  if (s3ClientInitialized) return s3Client
  
  try {
    const credentials = await awsCredentialsService.getCredentials()
    
    s3Client = new S3Client({
      region: AWS_CONFIG.region,
      credentials: credentials
    })
    
    s3ClientInitialized = true
    return s3Client
  } catch (error) {
    console.error('❌ Error inicializando cliente S3:', error)
    throw error
  }
}

// Configuración del bucket
export const S3_CONFIG = {
  BUCKET_NAME: process.env.S3_VECTOR_BUCKET || 'cogniaintellilearncontent',
  FOLDERS: {
    VIDEOS: 'Videos',
    IMAGES: 'Images', 
    PODCAST: 'Podcast',
    DOCUMENTS: 'Documents',
    QUIZ: 'Quiz',
    TASKS: 'Tasks',
    GROSS_CONTENT: 'GrossContent'
  }
} as const

export type ContentType = keyof typeof S3_CONFIG.FOLDERS
export type FileCategory = 'video' | 'image' | 'audio' | 'document' | 'quiz' | 'task' | 'other'

/**
 * Servicio para gestionar contenido en S3 organizado por cursos y tipos
 */
export class S3ContentService {
  
  /**
   * Genera la ruta completa del archivo en S3
   */
  static generateS3Key(courseNumber: string, contentType: ContentType, fileName: string): string {
    const folder = S3_CONFIG.FOLDERS[contentType]
    return `${courseNumber}/${folder}/${fileName}`
  }

  /**
   * Sube un archivo a S3 en la carpeta correspondiente
   */
  static async uploadFile(
    courseNumber: string,
    file: File | Buffer,
    fileName: string,
    contentType: ContentType,
    metadata?: Record<string, string>
  ): Promise<string> {
    try {
      // Inicializar cliente S3 si es necesario
      const client = await initializeS3Client()
      
      const s3Key = this.generateS3Key(courseNumber, contentType, fileName)
      
      // Determinar el content type del archivo
      const mimeType = this.getMimeType(fileName, contentType)
      
      const command = new PutObjectCommand({
        Bucket: S3_CONFIG.BUCKET_NAME,
        Key: s3Key,
        Body: file instanceof File ? new Uint8Array(await file.arrayBuffer()) : file,
        ContentType: mimeType,
        Metadata: {
          courseNumber,
          contentType,
          uploadedAt: new Date().toISOString(),
          ...metadata
        }
      })

      await client.send(command)
      
      // Retornar la URL del archivo
      return `https://${S3_CONFIG.BUCKET_NAME}.s3.us-east-1.amazonaws.com/${s3Key}`
      
    } catch (error) {
      console.error('Error uploading file to S3:', error)
      throw new Error(`Failed to upload file: ${error}`)
    }
  }

  /**
   * Genera una URL firmada para subir archivos directamente desde el frontend
   */
  static async generatePresignedUploadUrl(
    courseNumber: string,
    fileName: string,
    contentType: ContentType,
    expiresIn: number = 3600
  ): Promise<string> {
    try {
      const s3Key = this.generateS3Key(courseNumber, contentType, fileName)
      const mimeType = this.getMimeType(fileName, contentType)
      
      const command = new PutObjectCommand({
        Bucket: S3_CONFIG.BUCKET_NAME,
        Key: s3Key,
        ContentType: mimeType
      })

      const client = await initializeS3Client()
      return await getSignedUrl(client, command, { expiresIn })
      
    } catch (error) {
      console.error('Error generating presigned URL:', error)
      throw new Error(`Failed to generate presigned URL: ${error}`)
    }
  }

  /**
   * Genera una URL firmada para descargar un archivo
   */
  static async generatePresignedDownloadUrl(
    courseNumber: string,
    fileName: string,
    contentType: ContentType,
    expiresIn: number = 3600
  ): Promise<string> {
    try {
      const s3Key = this.generateS3Key(courseNumber, contentType, fileName)
      
      const command = new GetObjectCommand({
        Bucket: S3_CONFIG.BUCKET_NAME,
        Key: s3Key
      })

      const client = await initializeS3Client()
      return await getSignedUrl(client, command, { expiresIn })
      
    } catch (error) {
      console.error('Error generating download URL:', error)
      throw new Error(`Failed to generate download URL: ${error}`)
    }
  }

  /**
   * Lista todos los archivos de un curso y tipo específico
   */
  static async listCourseFiles(
    courseNumber: string,
    contentType?: ContentType
  ): Promise<Array<{
    key: string
    fileName: string
    size: number
    lastModified: Date
    url: string
  }>> {
    try {
      // Inicializar cliente S3 si es necesario
      const client = await initializeS3Client()
      
      const prefix = contentType 
        ? `${courseNumber}/${S3_CONFIG.FOLDERS[contentType]}/`
        : `${courseNumber}/`
      
      const command = new ListObjectsV2Command({
        Bucket: S3_CONFIG.BUCKET_NAME,
        Prefix: prefix
      })

      const result = await client.send(command)
      
      return result.Contents?.map(object => ({
        key: object.Key!,
        fileName: object.Key!.split('/').pop()!,
        size: object.Size || 0,
        lastModified: object.LastModified || new Date(),
        url: `https://${S3_CONFIG.BUCKET_NAME}.s3.us-east-1.amazonaws.com/${object.Key}`
      })) || []
      
    } catch (error) {
      console.error('Error listing course files:', error)
      throw new Error(`Failed to list files: ${error}`)
    }
  }

  /**
   * Elimina un archivo de S3
   */
  static async deleteFile(
    courseNumber: string,
    fileName: string,
    contentType: ContentType
  ): Promise<void> {
    try {
      // Inicializar cliente S3 si es necesario
      const client = await initializeS3Client()
      
      const s3Key = this.generateS3Key(courseNumber, contentType, fileName)
      
      const command = new DeleteObjectCommand({
        Bucket: S3_CONFIG.BUCKET_NAME,
        Key: s3Key
      })

      await client.send(command)
      
    } catch (error) {
      console.error('Error deleting file from S3:', error)
      throw new Error(`Failed to delete file: ${error}`)
    }
  }

  /**
   * Crea la estructura de carpetas para un nuevo curso
   */
  static async createCourseStructure(courseNumber: string): Promise<void> {
    try {
      // Inicializar cliente S3 si es necesario
      const client = await initializeS3Client()
      
      const folders = Object.values(S3_CONFIG.FOLDERS)
      
      // Crear un archivo .keep en cada carpeta para asegurar que existan
      const createFolderPromises = folders.map(folder => {
        const command = new PutObjectCommand({
          Bucket: S3_CONFIG.BUCKET_NAME,
          Key: `${courseNumber}/${folder}/.keep`,
          Body: '',
          ContentType: 'text/plain',
          Metadata: {
            purpose: 'folder-structure',
            courseNumber,
            createdAt: new Date().toISOString()
          }
        })
        
        return client.send(command)
      })

      await Promise.all(createFolderPromises)
      
    } catch (error) {
      console.error('Error creating course structure:', error)
      throw new Error(`Failed to create course structure: ${error}`)
    }
  }

  /**
   * Determina el MIME type basado en la extensión del archivo
   */
  private static getMimeType(fileName: string, contentType: ContentType): string {
    const extension = fileName.split('.').pop()?.toLowerCase()
    
    const mimeTypes: Record<string, string> = {
      // Videos
      'mp4': 'video/mp4',
      'webm': 'video/webm',
      'avi': 'video/x-msvideo',
      'mov': 'video/quicktime',
      
      // Images
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'svg': 'image/svg+xml',
      
      // Audio
      'mp3': 'audio/mpeg',
      'wav': 'audio/wav',
      'ogg': 'audio/ogg',
      'm4a': 'audio/mp4',
      
      // Documents
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'txt': 'text/plain',
      'json': 'application/json'
    }
    
    return mimeTypes[extension || ''] || 'application/octet-stream'
  }

  /**
   * Mapea el tipo de lección al tipo de contenido S3
   */
  static mapLessonTypeToContentType(lessonType: string): ContentType {
    const mapping: Record<string, ContentType> = {
      'video': 'VIDEOS',
      'reading': 'DOCUMENTS',
      'quiz': 'QUIZ',
      'assignment': 'TASKS',
      'podcast': 'PODCAST',
      'image': 'IMAGES'
    }
    
    return mapping[lessonType] || 'GROSS_CONTENT'
  }

  /**
   * Obtiene estadísticas de uso de almacenamiento por curso
   */
  static async getCourseStorageStats(courseNumber: string): Promise<{
    totalFiles: number
    totalSize: number
    byType: Record<ContentType, { files: number; size: number }>
  }> {
    try {
      const allFiles = await this.listCourseFiles(courseNumber)
      
      const stats = {
        totalFiles: allFiles.length,
        totalSize: allFiles.reduce((sum, file) => sum + file.size, 0),
        byType: {} as Record<ContentType, { files: number; size: number }>
      }
      
      // Inicializar estadísticas por tipo
      Object.keys(S3_CONFIG.FOLDERS).forEach(type => {
        stats.byType[type as ContentType] = { files: 0, size: 0 }
      })
      
      // Calcular estadísticas por tipo
      allFiles.forEach(file => {
        const pathParts = file.key.split('/')
        if (pathParts.length >= 2) {
          const folderName = pathParts[1]
          const contentType = Object.keys(S3_CONFIG.FOLDERS).find(
            key => S3_CONFIG.FOLDERS[key as ContentType] === folderName
          ) as ContentType
          
          if (contentType) {
            stats.byType[contentType].files++
            stats.byType[contentType].size += file.size
          }
        }
      })
      
      return stats
      
    } catch (error) {
      console.error('Error getting storage stats:', error)
      throw new Error(`Failed to get storage stats: ${error}`)
    }
  }
}

// Funciones de utilidad
export const uploadCourseFile = (courseNumber: string, file: File, contentType: ContentType, metadata?: Record<string, string>) => 
  S3ContentService.uploadFile(courseNumber, file, file.name, contentType, metadata)

export const generateUploadUrl = (courseNumber: string, fileName: string, contentType: ContentType) =>
  S3ContentService.generatePresignedUploadUrl(courseNumber, fileName, contentType)

export const listFiles = (courseNumber: string, contentType?: ContentType) =>
  S3ContentService.listCourseFiles(courseNumber, contentType) 