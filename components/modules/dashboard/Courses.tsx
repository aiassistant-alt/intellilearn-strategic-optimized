'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { StaticLink } from '@/components/common/StaticLink'
import { FaSearch, FaFilter, FaSort, FaEye, FaRegClock, FaUser, FaStar } from 'react-icons/fa'
import { courseService, Course } from '@/lib/services/courseService'

// Add styled-jsx for neumorphic styles
const NeumorphicStyles = () => (
  <style jsx global>{`
    .nm-white-card {
      background: #ffffff;
      box-shadow: 
        15px 15px 30px #d9d9d9,
        -15px -15px 30px #ffffff;
    }

    .nm-white-input {
      background: #ffffff;
      box-shadow: 
        inset 4px 4px 8px #e6e6e6,
        inset -4px -4px 8px #ffffff;
      border: none;
      outline: none;
    }

    .nm-white-input:focus {
      box-shadow: 
        inset 6px 6px 12px #e6e6e6,
        inset -6px -6px 12px #ffffff;
    }

    .nm-white-badge {
      background: #ffffff;
      box-shadow: 
        3px 3px 6px #d9d9d9,
        -3px -3px 6px #ffffff;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 600;
      color: #4a5568;
    }

    .nm-white-progress {
      width: 100%;
      height: 8px;
      background: #ffffff;
      box-shadow: 
        inset 2px 2px 4px #e6e6e6,
        inset -2px -2px 4px #ffffff;
      border-radius: 4px;
      overflow: hidden;
    }

    .nm-white-progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #e0e0e0, #f0f0f0);
      border-radius: 4px;
      transition: width 0.3s ease;
    }

    .nm-white-button-primary {
      background: #ffffff;
      box-shadow: 
        8px 8px 16px #d9d9d9,
        -8px -8px 16px #ffffff;
      border: none;
      cursor: pointer;
      transition: all 0.3s ease;
      color: #4a5568;
    }

    .nm-white-button-primary:hover {
      box-shadow: 
        10px 10px 20px #d9d9d9,
        -10px -10px 20px #ffffff;
      transform: translateY(-2px);
    }

    .nm-white-button-primary:active {
      box-shadow: 
        inset 4px 4px 8px #d9d9d9,
        inset -4px -4px 8px #ffffff;
      transform: translateY(0);
    }
  `}</style>
)

// Interfaz para el componente de curso
interface CourseCard {
  id: string
  title: string
  instructor: string
  description: string
  progress: number
  image: string
  lessons: number
  duration: string
  category: string
  level: string
  rating: number
  totalStudents: number
  lastAccessed?: string
}

/**
 * Componente principal de cursos con diseño neumórfico
 * Muestra la lista de cursos disponibles con filtros y búsqueda
 */
const Courses = () => {
  // Estado para filtros y búsqueda
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('Todos')
  const [levelFilter, setLevelFilter] = useState('Todos')
  const [sortBy, setSortBy] = useState('progress')
  const [courses, setCourses] = useState<CourseCard[]>([])
  const [loading, setLoading] = useState(true)

  // Cargar cursos reales al montar el componente
  useEffect(() => {
    const loadCourses = async () => {
      try {
        setLoading(true)
        
        // Limpiar localStorage manualmente antes de cargar
        if (typeof window !== 'undefined') {
          const keysToRemove = []
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i)
            if (key && (key.includes('intellilearn') || key.includes('course'))) {
              keysToRemove.push(key)
            }
          }
          keysToRemove.forEach(key => localStorage.removeItem(key))
          console.log('🧹 Manual localStorage cleanup completed')
        }
        
        // Cargar todos los cursos disponibles dinámicamente
        const allCourses = await courseService.getAllCourses()
        
        const courseCards: CourseCard[] = allCourses.map(course => ({
          id: course.id,
          title: course.title,
          instructor: course.instructor,
          description: course.description,
          progress: 0, // Sin progreso por defecto (se puede calcular después)
          image: course.imageUrl || '/assets/images/course-default.jpg',
          lessons: course.modules.reduce((total, module) => total + module.lessons.length, 0),
          duration: course.duration,
          category: course.category,
          level: course.level === 'beginner' ? 'Básico' : 
                 course.level === 'intermediate' ? 'Intermedio' : 'Avanzado',
          rating: course.rating,
          totalStudents: course.totalStudents,
          lastAccessed: 'Nuevo'
        }))
        
        setCourses(courseCards)
        console.log(`✅ Loaded ${courseCards.length} courses dynamically`)
        
      } catch (error) {
        console.error('Error loading courses:', error)
        setCourses([])
      } finally {
        setLoading(false)
      }
    }

    loadCourses()
  }, [])

  // Obtener categorías únicas para el filtro
  const categories = ['Todos', ...new Set(courses.map(course => course.category))]
  const levels = ['Todos', 'Básico', 'Intermedio', 'Avanzado']

  /**
   * Filtra y ordena los cursos según los criterios seleccionados
   */
  const filteredCourses = courses
    .filter(course => 
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (categoryFilter === 'Todos' || course.category === categoryFilter) &&
      (levelFilter === 'Todos' || course.level === levelFilter)
    )
    .sort((a, b) => {
      if (sortBy === 'title') return a.title.localeCompare(b.title)
      if (sortBy === 'progress') return b.progress - a.progress
      if (sortBy === 'recent') return (a.lastAccessed || '').localeCompare(b.lastAccessed || '')
      return 0
    })

  if (loading) {
    return (
      <div className="p-6 min-h-screen flex items-center justify-center" style={{ background: '#ffffff' }}>
        <div className="nm-white-card p-8 rounded-2xl">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-400 mx-auto"></div>
          <p className="text-center mt-4 text-gray-600">Cargando cursos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 min-h-screen" style={{ background: '#ffffff' }}>
      <NeumorphicStyles />
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Mis Cursos</h1>
        <p className="text-gray-600">Explora y continúa con tu aprendizaje en los siguientes cursos</p>
      </div>

      {/* Filtros y búsqueda con neumorfismo blanco */}
      <div className="nm-white-card p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Búsqueda */}
          <div className="relative">
            <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar cursos..."
              className="nm-white-input pl-12 pr-4 py-3 w-full text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filtro por categoría */}
          <div className="relative">
            <FaFilter className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 z-10" />
            <select
              className="nm-white-input pl-12 pr-4 py-3 w-full appearance-none cursor-pointer"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          {/* Filtro por nivel */}
          <div className="relative">
            <FaFilter className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 z-10" />
            <select
              className="nm-white-input pl-12 pr-4 py-3 w-full appearance-none cursor-pointer"
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
            >
              {levels.map(level => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
          </div>

          {/* Ordenamiento */}
          <div className="relative">
            <FaSort className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 z-10" />
            <select
              className="nm-white-input pl-12 pr-4 py-3 w-full appearance-none cursor-pointer"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="progress">Mayor progreso</option>
              <option value="title">Alfabético</option>
              <option value="recent">Más reciente</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de cursos */}
      {filteredCourses.length === 0 ? (
        <div className="nm-white-card p-8 text-center rounded-2xl">
          <p className="text-gray-600 text-lg">No se encontraron cursos que coincidan con tus criterios de búsqueda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map(course => (
            <div key={course.id} className="nm-white-card rounded-2xl p-6 flex flex-col">
              <div className="relative h-48 mb-4 rounded-lg overflow-hidden">
                <Image 
                  src={course.image} 
                  alt={course.title}
                  fill
                  style={{ objectFit: 'cover' }}
                  className="rounded-lg"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#132944]/70 to-transparent rounded-lg"></div>
                <div className="absolute bottom-0 left-0 p-4 w-full">
                  <span className="nm-white-badge mr-2">{course.category}</span>
                  <span className="nm-white-badge">{course.level}</span>
                </div>
              </div>
              
              <div className="flex-1 flex flex-col">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">{course.title}</h3>
                <p className="text-sm text-gray-600 mb-2 flex items-center">
                  <FaUser className="mr-2" />
                  Instructor: {course.instructor}
                </p>
                <p className="text-sm text-gray-500 mb-4 flex-1">{course.description}</p>
                
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <FaRegClock className="text-gray-500 mr-2" />
                    <span className="text-sm text-gray-500">{course.duration}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm text-gray-500">{course.lessons} lecciones</span>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <FaStar className="text-yellow-500 mr-1" />
                    <span className="text-sm text-gray-600">{course.rating}</span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {course.totalStudents.toLocaleString()} estudiantes
                  </div>
                </div>
                
                <div className="mt-3">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-600 font-medium">Progreso: {course.progress}%</span>
                    {course.lastAccessed && (
                      <span className="text-xs text-gray-500">{course.lastAccessed}</span>
                    )}
                  </div>
                  <div className="nm-white-progress">
                    <div 
                      className="nm-white-progress-fill" 
                      style={{ width: `${course.progress}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              
              <div className="pt-4 mt-4 border-t border-gray-100">
                <StaticLink 
                  href={`/dashboard/courses/${course.id}`}
                  className="nm-white-button-primary w-full flex items-center justify-center py-3 px-4 rounded-lg transition-all duration-300 font-semibold"
                >
                  <FaEye className="mr-2" />
                  {course.progress > 0 ? 'Continuar aprendiendo' : 'Comenzar curso'}
                </StaticLink>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Courses