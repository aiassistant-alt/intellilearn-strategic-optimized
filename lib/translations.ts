/**
 * Translation system for Intellilearn
 * Author: Luis Arturo Parra - Telmo AI
 * Created: 2025-09-13
 */

'use client'

import { useState, useEffect } from 'react'

// Translation keys and values
const translations = {
  es: {
    nav: {
      myProgress: 'Mi Progreso',
      myCourses: 'Mis Cursos',
      myTasks: 'Mis Tareas',
      videoLibrary: 'Biblioteca de Videos',
      library: 'Biblioteca',
      certificates: 'Certificados',
      profile: 'Perfil',
      settings: 'Configuración',
      assistant: 'Asistente IA',
      analytics: 'Analíticas',
      gamification: 'Gamificación',
      content: 'Contenido'
    },
    common: {
      loading: 'Cargando...',
      error: 'Error',
      success: 'Éxito',
      cancel: 'Cancelar',
      save: 'Guardar',
      delete: 'Eliminar',
      edit: 'Editar',
      create: 'Crear',
      search: 'Buscar'
    }
  },
  en: {
    nav: {
      myProgress: 'My Progress',
      myCourses: 'My Courses',
      myTasks: 'My Tasks',
      videoLibrary: 'Video Library',
      library: 'Library',
      certificates: 'Certificates',
      profile: 'Profile',
      settings: 'Settings',
      assistant: 'AI Assistant',
      analytics: 'Analytics',
      gamification: 'Gamification',
      content: 'Content'
    },
    common: {
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      cancel: 'Cancel',
      save: 'Save',
      delete: 'Delete',
      edit: 'Edit',
      create: 'Create',
      search: 'Search'
    }
  }
}

export type Language = 'es' | 'en'
export type SupportedLanguage = Language
type TranslationKey = keyof typeof translations.es

// Translation hook
export function useTranslation() {
  const [language, setLanguage] = useState<Language>('es')

  useEffect(() => {
    // Get language from localStorage or browser
    if (typeof window !== 'undefined') {
      const savedLanguage = localStorage.getItem('intellilearn_language') as Language
      if (savedLanguage && (savedLanguage === 'es' || savedLanguage === 'en')) {
        setLanguage(savedLanguage)
      } else {
        // Default to Spanish
        setLanguage('es')
      }
    }
  }, [])

  const changeLanguage = (newLanguage: Language) => {
    setLanguage(newLanguage)
    if (typeof window !== 'undefined') {
      localStorage.setItem('intellilearn_language', newLanguage)
    }
  }

  const t = (key: string): string => {
    const keys = key.split('.')
    let value: any = translations[language]
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k]
      } else {
        // Fallback to Spanish if key not found
        value = translations.es
        for (const fallbackKey of keys) {
          if (value && typeof value === 'object' && fallbackKey in value) {
            value = value[fallbackKey]
          } else {
            return key // Return key if not found
          }
        }
        break
      }
    }
    
    return typeof value === 'string' ? value : key
  }

  const getLanguages = () => [
    { code: 'es' as Language, name: 'Español', flag: '🇪🇸' },
    { code: 'en' as Language, name: 'English', flag: '🇺🇸' }
  ]

  return {
    t,
    language,
    currentLanguage: language,
    changeLanguage,
    availableLanguages: ['es', 'en'] as Language[],
    getLanguages
  }
}

export default useTranslation
