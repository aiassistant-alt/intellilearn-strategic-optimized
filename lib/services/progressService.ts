/**
 * Servicio para gestionar el progreso del usuario en cursos, módulos y lecciones
 */

export interface LessonProgress {
  lessonId: string
  completed: boolean
  completedAt?: string
  timeSpent?: number // en minutos
  score?: number // para quizzes
}

export interface ModuleProgress {
  moduleId: string
  completed: boolean
  completedAt?: string
  totalLessons: number
  completedLessons: number
  lessons: Record<string, LessonProgress>
}

export interface CourseProgress {
  courseId: string
  userId: string
  startedAt: string
  lastUpdated: string
  totalModules: number
  completedModules: number
  totalLessons: number
  completedLessons: number
  overallProgress: number // 0-100
  modules: Record<string, ModuleProgress>
}

const PROGRESS_STORAGE_KEY = 'intellilearn_progress'

export class ProgressService {
  
  /**
   * Obtiene el progreso de un usuario en un curso
   */
  getCourseProgress(userId: string, courseId: string): CourseProgress | null {
    try {
      const allProgress = this.loadProgressFromStorage()
      const key = `${userId}_${courseId}`
      return allProgress[key] || null
    } catch (error) {
      console.error('Error getting course progress:', error)
      return null
    }
  }

  /**
   * Inicializa el progreso de un curso para un usuario
   */
  initializeCourseProgress(
    userId: string, 
    courseId: string, 
    totalModules: number, 
    totalLessons: number,
    moduleStructure: { id: string; lessonIds: string[] }[]
  ): CourseProgress {
    try {
      const now = new Date().toISOString()
      
      const modules: Record<string, ModuleProgress> = {}
      
      // Inicializar progreso de cada módulo
      moduleStructure.forEach(module => {
        const lessons: Record<string, LessonProgress> = {}
        
        // Inicializar progreso de cada lección
        module.lessonIds.forEach(lessonId => {
          lessons[lessonId] = {
            lessonId,
            completed: false
          }
        })
        
        modules[module.id] = {
          moduleId: module.id,
          completed: false,
          totalLessons: module.lessonIds.length,
          completedLessons: 0,
          lessons
        }
      })

      const courseProgress: CourseProgress = {
        courseId,
        userId,
        startedAt: now,
        lastUpdated: now,
        totalModules,
        completedModules: 0,
        totalLessons,
        completedLessons: 0,
        overallProgress: 0,
        modules
      }

      this.saveCourseProgress(courseProgress)
      return courseProgress
    } catch (error) {
      console.error('Error initializing course progress:', error)
      throw error
    }
  }

  /**
   * Marca una lección como completada
   */
  markLessonCompleted(
    userId: string, 
    courseId: string, 
    moduleId: string, 
    lessonId: string,
    timeSpent?: number,
    score?: number
  ): CourseProgress {
    try {
      let progress = this.getCourseProgress(userId, courseId)
      
      if (!progress) {
        throw new Error('Course progress not found. Initialize progress first.')
      }

      const now = new Date().toISOString()
      
      // Actualizar progreso de la lección
      if (progress.modules[moduleId]?.lessons[lessonId]) {
        const lesson = progress.modules[moduleId].lessons[lessonId]
        
        if (!lesson.completed) {
          lesson.completed = true
          lesson.completedAt = now
          if (timeSpent) lesson.timeSpent = timeSpent
          if (score !== undefined) lesson.score = score

          // Actualizar contador de lecciones completadas del módulo
          progress.modules[moduleId].completedLessons += 1
          
          // Verificar si el módulo está completo
          const moduleProgress = progress.modules[moduleId]
          if (moduleProgress.completedLessons === moduleProgress.totalLessons) {
            moduleProgress.completed = true
            moduleProgress.completedAt = now
            progress.completedModules += 1
          }

          // Actualizar progreso general del curso
          progress.completedLessons += 1
          progress.overallProgress = Math.round((progress.completedLessons / progress.totalLessons) * 100)
          progress.lastUpdated = now

          this.saveCourseProgress(progress)
        }
      }

      return progress
    } catch (error) {
      console.error('Error marking lesson completed:', error)
      throw error
    }
  }

  /**
   * Marca una lección como no completada
   */
  markLessonIncomplete(
    userId: string, 
    courseId: string, 
    moduleId: string, 
    lessonId: string
  ): CourseProgress {
    try {
      let progress = this.getCourseProgress(userId, courseId)
      
      if (!progress) {
        throw new Error('Course progress not found')
      }

      const now = new Date().toISOString()
      
      // Actualizar progreso de la lección
      if (progress.modules[moduleId]?.lessons[lessonId]) {
        const lesson = progress.modules[moduleId].lessons[lessonId]
        
        if (lesson.completed) {
          lesson.completed = false
          lesson.completedAt = undefined
          lesson.timeSpent = undefined
          lesson.score = undefined

          // Actualizar contador de lecciones completadas del módulo
          progress.modules[moduleId].completedLessons -= 1
          
          // El módulo ya no está completo
          const moduleProgress = progress.modules[moduleId]
          if (moduleProgress.completed) {
            moduleProgress.completed = false
            moduleProgress.completedAt = undefined
            progress.completedModules -= 1
          }

          // Actualizar progreso general del curso
          progress.completedLessons -= 1
          progress.overallProgress = Math.round((progress.completedLessons / progress.totalLessons) * 100)
          progress.lastUpdated = now

          this.saveCourseProgress(progress)
        }
      }

      return progress
    } catch (error) {
      console.error('Error marking lesson incomplete:', error)
      throw error
    }
  }

  /**
   * Obtiene el progreso de un módulo específico
   */
  getModuleProgress(userId: string, courseId: string, moduleId: string): ModuleProgress | null {
    try {
      const courseProgress = this.getCourseProgress(userId, courseId)
      return courseProgress?.modules[moduleId] || null
    } catch (error) {
      console.error('Error getting module progress:', error)
      return null
    }
  }

  /**
   * Obtiene el progreso de una lección específica
   */
  getLessonProgress(userId: string, courseId: string, moduleId: string, lessonId: string): LessonProgress | null {
    try {
      const moduleProgress = this.getModuleProgress(userId, courseId, moduleId)
      return moduleProgress?.lessons[lessonId] || null
    } catch (error) {
      console.error('Error getting lesson progress:', error)
      return null
    }
  }

  /**
   * Obtiene estadísticas de progreso para mostrar en dashboard
   */
  getProgressStats(userId: string, courseId: string): {
    overallProgress: number
    completedLessons: number
    totalLessons: number
    completedModules: number
    totalModules: number
    estimatedTimeRemaining?: string
  } | null {
    try {
      const progress = this.getCourseProgress(userId, courseId)
      
      if (!progress) return null

      // Calcular tiempo estimado restante (basado en promedio de tiempo por lección)
      const completedLessons = Object.values(progress.modules)
        .flatMap(module => Object.values(module.lessons))
        .filter(lesson => lesson.completed && lesson.timeSpent)

      const avgTimePerLesson = completedLessons.length > 0 
        ? completedLessons.reduce((sum, lesson) => sum + (lesson.timeSpent || 0), 0) / completedLessons.length
        : 15 // 15 minutos por defecto

      const remainingLessons = progress.totalLessons - progress.completedLessons
      const estimatedMinutes = remainingLessons * avgTimePerLesson
      
      let estimatedTimeRemaining = ''
      if (estimatedMinutes < 60) {
        estimatedTimeRemaining = `${Math.round(estimatedMinutes)} min`
      } else {
        const hours = Math.floor(estimatedMinutes / 60)
        const minutes = Math.round(estimatedMinutes % 60)
        estimatedTimeRemaining = `${hours}h ${minutes}m`
      }

      return {
        overallProgress: progress.overallProgress,
        completedLessons: progress.completedLessons,
        totalLessons: progress.totalLessons,
        completedModules: progress.completedModules,
        totalModules: progress.totalModules,
        estimatedTimeRemaining
      }
    } catch (error) {
      console.error('Error getting progress stats:', error)
      return null
    }
  }

  /**
   * Carga el progreso desde localStorage
   */
  private loadProgressFromStorage(): Record<string, CourseProgress> {
    if (typeof window === 'undefined') {
      return {}
    }

    try {
      const stored = localStorage.getItem(PROGRESS_STORAGE_KEY)
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (error) {
      console.error('Error loading progress from localStorage:', error)
    }

    return {}
  }

  /**
   * Guarda el progreso de un curso específico
   */
  private saveCourseProgress(courseProgress: CourseProgress): void {
    if (typeof window === 'undefined') return

    try {
      const allProgress = this.loadProgressFromStorage()
      const key = `${courseProgress.userId}_${courseProgress.courseId}`
      allProgress[key] = courseProgress
      
      localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(allProgress))
      console.log(`💾 Progress saved for course ${courseProgress.courseId}`)
    } catch (error) {
      console.error('Error saving progress to localStorage:', error)
    }
  }

  /**
   * Elimina todo el progreso de un usuario (útil para testing)
   */
  clearUserProgress(userId: string): void {
    try {
      const allProgress = this.loadProgressFromStorage()
      const keysToDelete = Object.keys(allProgress).filter(key => key.startsWith(`${userId}_`))
      
      keysToDelete.forEach(key => {
        delete allProgress[key]
      })
      
      if (typeof window !== 'undefined') {
        localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(allProgress))
      }
      
      console.log(`🗑️ Cleared progress for user ${userId}`)
    } catch (error) {
      console.error('Error clearing user progress:', error)
    }
  }
}

// Instancia singleton del servicio
export const progressService = new ProgressService() 