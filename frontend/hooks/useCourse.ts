import { useState, useEffect } from 'react'
import { courseService, Course, Module, Lesson, UserProgress } from '@/lib/services/courseService'

export interface UseCourseResult {
  course: Course | null
  loading: boolean
  error: string | null
  
  // Course operations
  updateCourse: (updates: Partial<Course>) => Promise<void>
  refreshCourse: () => Promise<void>
  
  // Module operations
  createModule: (moduleData: { title: string; description: string; order: number }) => Promise<void>
  updateModule: (moduleId: string, updates: Partial<Module>) => Promise<void>
  deleteModule: (moduleId: string) => Promise<void>
  
  // Lesson operations
  createLesson: (moduleId: string, lessonData: { title: string; description: string; type: 'video' | 'reading' | 'quiz' | 'assignment' | 'podcast' | 'image' | 'voice_session'; content: string; videoUrl?: string; duration: string; order: number }) => Promise<void>
  updateLesson: (lessonId: string, updates: Partial<Lesson>) => Promise<void>
  deleteLesson: (lessonId: string) => Promise<void>
  
  // File operations
  uploadFile: (file: File, folder?: string) => Promise<string>
  
  // User progress
  updateProgress: (progress: UserProgress) => Promise<void>
  getUserProgress: (userId: string) => Promise<UserProgress[]>
}

/**
 * Hook personalizado para gestión de cursos con persistencia real
 */
export function useCourse(courseId: string): UseCourseResult {
  const [course, setCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Cargar curso inicial
  const loadCourse = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log(`🔄 Loading course: ${courseId}`)
      
      const courseData = await courseService.getCourse(courseId)
      setCourse(courseData)
      
      if (courseData) {
        console.log(`✅ Course loaded: ${courseData.title}`)
      } else {
        console.log(`❌ Course not found: ${courseId}`)
      }
    } catch (err) {
      console.error('Error loading course:', err)
      setError(err instanceof Error ? err.message : 'Failed to load course')
    } finally {
      setLoading(false)
    }
  }

  // Actualizar curso completo
  const updateCourse = async (updates: Partial<Course>) => {
    try {
      setError(null)
      console.log(`🔄 Updating course: ${courseId}`, updates)
      
      const updatedCourse = await courseService.updateCourse(courseId, updates)
      setCourse(updatedCourse)
      
      console.log(`✅ Course updated successfully`)
    } catch (err) {
      console.error('Error updating course:', err)
      setError(err instanceof Error ? err.message : 'Failed to update course')
      throw err
    }
  }

  // Refrescar curso
  const refreshCourse = async () => {
    await loadCourse()
  }

  // Crear módulo
  const createModule = async (moduleData: { title: string; description: string; order: number }) => {
    try {
      setError(null)
      console.log('➕ Creating new module:', moduleData)
      
      await courseService.createModule({
        ...moduleData,
        courseId: courseId
      })
      
      // Recargar curso para mostrar el nuevo módulo
      await loadCourse()
      
      console.log('✅ Module created successfully')
    } catch (err) {
      console.error('Error creating module:', err)
      setError(err instanceof Error ? err.message : 'Failed to create module')
      throw err
    }
  }

  // Actualizar módulo
  const updateModule = async (moduleId: string, updates: Partial<Module>) => {
    try {
      setError(null)
      console.log(`🔄 Updating module: ${moduleId}`, updates)
      
      await courseService.updateModule(moduleId, updates)
      
      // Recargar curso para mostrar los cambios
      await loadCourse()
      
      console.log('✅ Module updated successfully')
    } catch (err) {
      console.error('Error updating module:', err)
      setError(err instanceof Error ? err.message : 'Failed to update module')
      throw err
    }
  }

  // Eliminar módulo
  const deleteModule = async (moduleId: string) => {
    try {
      setError(null)
      console.log(`🗑️ Deleting module: ${moduleId}`)
      
      await courseService.deleteModule(moduleId)
      
      // Recargar curso para mostrar los cambios
      await loadCourse()
      
      console.log('✅ Module deleted successfully')
    } catch (err) {
      console.error('Error deleting module:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete module')
      throw err
    }
  }

  // Crear lección
  const createLesson = async (moduleId: string, lessonData: { title: string; description: string; type: 'video' | 'reading' | 'quiz' | 'assignment' | 'podcast' | 'image' | 'voice_session'; content: string; videoUrl?: string; duration: string; order: number }) => {
    try {
      setError(null)
      console.log('➕ Creating new lesson:', lessonData)
      
      await courseService.createLesson({
        ...lessonData,
        moduleId: moduleId,
        courseId: courseId,
        resources: []
      })
      
      // Recargar curso para mostrar la nueva lección
      await loadCourse()
      
      console.log('✅ Lesson created successfully')
    } catch (err) {
      console.error('Error creating lesson:', err)
      setError(err instanceof Error ? err.message : 'Failed to create lesson')
      throw err
    }
  }

  // Actualizar lección
  const updateLesson = async (lessonId: string, updates: Partial<Lesson>) => {
    try {
      setError(null)
      console.log(`🔄 Updating lesson: ${lessonId}`, updates)
      
      await courseService.updateLesson(lessonId, updates)
      
      // Recargar curso para mostrar los cambios
      await loadCourse()
      
      console.log('✅ Lesson updated successfully')
    } catch (err) {
      console.error('Error updating lesson:', err)
      setError(err instanceof Error ? err.message : 'Failed to update lesson')
      throw err
    }
  }

  // Eliminar lección
  const deleteLesson = async (lessonId: string) => {
    try {
      setError(null)
      console.log(`🗑️ Deleting lesson: ${lessonId}`)
      
      await courseService.deleteLesson(lessonId)
      
      // Recargar curso para mostrar los cambios
      await loadCourse()
      
      console.log('✅ Lesson deleted successfully')
    } catch (err) {
      console.error('Error deleting lesson:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete lesson')
      throw err
    }
  }

  // Subir archivo
  const uploadFile = async (file: File, folder: string = 'uploads'): Promise<string> => {
    try {
      setError(null)
      console.log(`📤 Uploading file: ${file.name}`)
      
      const url = await courseService.uploadFile(file, folder)
      
      console.log(`✅ File uploaded: ${url}`)
      return url
    } catch (err) {
      console.error('Error uploading file:', err)
      setError(err instanceof Error ? err.message : 'Failed to upload file')
      throw err
    }
  }

  // Actualizar progreso del usuario
  const updateProgress = async (progress: UserProgress) => {
    try {
      setError(null)
      await courseService.updateUserProgress(progress)
    } catch (err) {
      console.error('Error updating progress:', err)
      setError(err instanceof Error ? err.message : 'Failed to update progress')
      throw err
    }
  }

  // Obtener progreso del usuario
  const getUserProgress = async (userId: string): Promise<UserProgress[]> => {
    try {
      setError(null)
      return await courseService.getUserProgress(userId, courseId)
    } catch (err) {
      console.error('Error getting user progress:', err)
      setError(err instanceof Error ? err.message : 'Failed to get user progress')
      throw err
    }
  }

  // Cargar curso al montar el componente
  useEffect(() => {
    if (courseId) {
      loadCourse()
    }
  }, [courseId])

  return {
    course,
    loading,
    error,
    updateCourse,
    refreshCourse,
    createModule,
    updateModule,
    deleteModule,
    createLesson,
    updateLesson,
    deleteLesson,
    uploadFile,
    updateProgress,
    getUserProgress
  }
}

export interface UseSemanticSearchResult {
  searchContent: (query: string, courseId?: string) => Promise<any[]>
  getRecommendations: (lessonId: string) => Promise<Lesson[]>
  loading: boolean
  error: string | null
}

/**
 * Hook para búsqueda semántica y recomendaciones
 */
export function useSemanticSearch(): UseSemanticSearchResult {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const searchContent = async (query: string, courseId?: string): Promise<any[]> => {
    try {
      setLoading(true)
      setError(null)
      console.log(`🔍 Searching for: "${query}"`)
      
      const results = await courseService.semanticSearch(query, courseId)
      
      console.log(`✅ Found ${results.length} results`)
      return results
    } catch (err) {
      console.error('Error searching content:', err)
      setError(err instanceof Error ? err.message : 'Failed to search content')
      return []
    } finally {
      setLoading(false)
    }
  }

  const getRecommendations = async (lessonId: string): Promise<Lesson[]> => {
    try {
      setLoading(true)
      setError(null)
      console.log(`💡 Getting recommendations for lesson: ${lessonId}`)
      
      const recommendations = await courseService.getRecommendations(lessonId)
      
      console.log(`✅ Found ${recommendations.length} recommendations`)
      return recommendations
    } catch (err) {
      console.error('Error getting recommendations:', err)
      setError(err instanceof Error ? err.message : 'Failed to get recommendations')
      return []
    } finally {
      setLoading(false)
    }
  }

  return {
    searchContent,
    getRecommendations,
    loading,
    error
  }
} 