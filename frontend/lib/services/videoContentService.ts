/**
 * ^VideoContentService
 * Author: Luis Arturo Parra - Telmo AI
 * Created: 2025-09-11
 * Usage: Service for generating presigned URLs for video content
 * Business Context: Access private S3 video content securely
 * Relations: Used by video library components
 * Reminders: Generates temporary URLs with 1-hour expiration for secure access
 */

import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { awsCredentialsService } from './awsCredentialsService'

interface VideoData {
  id: string
  title: string
  description: string
  duration: string
  size: string
  thumbnail: string
  url: string
  previewUrl: string
}

interface CourseVideoData {
  title: string
  description: string
  totalEpisodes: number
  videos: VideoData[]
}

export class VideoContentService {
  private s3Client: S3Client | null = null
  private readonly bucketName = 'intellilearn-content-076276934311'
  private readonly urlCache = new Map<string, { url: string, expires: number }>()

  private async initializeS3Client(): Promise<void> {
    if (this.s3Client) return

    try {
      console.log('🔐 [VideoContentService] Initializing S3 client for video content...')
      const credentials = await awsCredentialsService.getCredentials()
      
      this.s3Client = new S3Client({
        region: 'us-east-1',
        credentials: credentials
      })
      
      console.log('✅ [VideoContentService] S3 client initialized successfully')
    } catch (error) {
      console.error('❌ [VideoContentService] Failed to initialize S3 client:', error)
      throw error
    }
  }

  private async generatePresignedUrl(key: string): Promise<string> {
    // Check cache first (URLs expire in 50 minutes, we cache for 45 minutes)
    const cached = this.urlCache.get(key)
    if (cached && Date.now() < cached.expires) {
      console.log(`🔄 [VideoContentService] Using cached URL for ${key}`)
      return cached.url
    }

    await this.initializeS3Client()
    
    if (!this.s3Client) {
      throw new Error('S3 client not initialized')
    }

    try {
      console.log(`🔗 [VideoContentService] Generating presigned URL for: ${key}`)
      
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key
      })

      // Generate URL with 1 hour expiration
      const url = await getSignedUrl(this.s3Client, command, { 
        expiresIn: 3600 // 1 hour
      })

      // Cache for 45 minutes (50 minutes before URL expires)
      this.urlCache.set(key, {
        url,
        expires: Date.now() + (45 * 60 * 1000)
      })

      console.log(`✅ [VideoContentService] Generated presigned URL for ${key}`)
      return url
    } catch (error) {
      console.error(`❌ [VideoContentService] Failed to generate presigned URL for ${key}:`, error)
      throw error
    }
  }

  public async getCourseVideoData(courseId: string): Promise<CourseVideoData> {
    if (courseId === '000001') {
      console.log('📹 [VideoContentService] Loading video data for course 000001')
      
      try {
        // Generate presigned URLs for all videos
        const [
          episode1Url,
          episode1v2Url,
          episode2Url,
          episode3Url,
          episode3ExtUrl,
          episode4Url,
          episode4RevUrl
        ] = await Promise.all([
          this.generatePresignedUrl('video-courses/000001/_episode_1_202507032235.mp4'),
          this.generatePresignedUrl('video-courses/000001/_episode_1_202507032235(1).mp4'),
          this.generatePresignedUrl('video-courses/000001/_episode_2_202507032240.mp4'),
          this.generatePresignedUrl('video-courses/000001/_episode_3_202507032242.mp4'),
          this.generatePresignedUrl('video-courses/000001/_episode_3_202507032243.mp4'),
          this.generatePresignedUrl('video-courses/000001/_episode_4_202507032250.mp4'),
          this.generatePresignedUrl('video-courses/000001/_episode_4_202507032250(1).mp4')
        ])

        return {
          title: 'Curso 000001',
          description: 'Serie completa de episodios educativos',
          totalEpisodes: 7,
          videos: [
            {
              id: 'episode_1_202507032235',
              title: 'Episodio 1 - Introducción',
              description: 'Introducción al curso y conceptos básicos',
              duration: '15:30',
              size: '8.0 MB',
              thumbnail: '/assets/images/video-thumbnail.jpg',
              url: episode1Url,
              previewUrl: episode1Url
            },
            {
              id: 'episode_1_202507032235(1)',
              title: 'Episodio 1 - Introducción (Versión 2)',
              description: 'Versión alternativa del primer episodio',
              duration: '15:30',
              size: '8.0 MB',
              thumbnail: '/assets/images/video-thumbnail.jpg',
              url: episode1v2Url,
              previewUrl: episode1v2Url
            },
            {
              id: 'episode_2_202507032240',
              title: 'Episodio 2 - Conceptos Fundamentales',
              description: 'Profundización en los conceptos principales',
              duration: '18:45',
              size: '6.4 MB',
              thumbnail: '/assets/images/video-thumbnail.jpg',
              url: episode2Url,
              previewUrl: episode2Url
            },
            {
              id: 'episode_3_202507032242',
              title: 'Episodio 3 - Aplicaciones Prácticas',
              description: 'Ejemplos prácticos y casos de uso',
              duration: '22:15',
              size: '5.0 MB',
              thumbnail: '/assets/images/video-thumbnail.jpg',
              url: episode3Url,
              previewUrl: episode3Url
            },
            {
              id: 'episode_3_202507032243',
              title: 'Episodio 3 - Aplicaciones Prácticas (Extendido)',
              description: 'Versión extendida con más ejemplos',
              duration: '28:30',
              size: '5.0 MB',
              thumbnail: '/assets/images/video-thumbnail.jpg',
              url: episode3ExtUrl,
              previewUrl: episode3ExtUrl
            },
            {
              id: 'episode_4_202507032250',
              title: 'Episodio 4 - Técnicas Avanzadas',
              description: 'Técnicas y metodologías avanzadas',
              duration: '25:00',
              size: '5.0 MB',
              thumbnail: '/assets/images/video-thumbnail.jpg',
              url: episode4Url,
              previewUrl: episode4Url
            },
            {
              id: 'episode_4_202507032250(1)',
              title: 'Episodio 4 - Técnicas Avanzadas (Revisado)',
              description: 'Versión revisada con actualizaciones',
              duration: '26:15',
              size: '5.0 MB',
              thumbnail: '/assets/images/video-thumbnail.jpg',
              url: episode4RevUrl,
              previewUrl: episode4RevUrl
            }
          ]
        }
      } catch (error) {
        console.error('❌ [VideoContentService] Failed to load course 000001 videos:', error)
        throw error
      }
    }
    
    // Default data for other courses
    return {
      title: `Curso ${courseId}`,
      description: 'Contenido próximamente disponible',
      totalEpisodes: 0,
      videos: []
    }
  }

  public clearCache(): void {
    console.log('🗑️ [VideoContentService] Clearing URL cache')
    this.urlCache.clear()
  }
}
