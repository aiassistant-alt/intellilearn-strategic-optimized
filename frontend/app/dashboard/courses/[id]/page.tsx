'use client'

import { useState, useRef, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { 
  FaPlay, 
  FaBookOpen, 
  FaQuestionCircle, 
  FaClipboardList,
  FaEdit,
  FaSave,
  FaTimes,
  FaPlus,
  FaTrash,
  FaUpload,
  FaSpinner,
  FaUser,
  FaCog,
  FaSearch,
  FaLightbulb,
  FaBook,
  FaArrowRight,
  FaArrowLeft,
  FaMicrophone
} from 'react-icons/fa'
import { useCourse, useSemanticSearch } from '@/hooks/useCourse'
import { Course, Module, Lesson } from '@/lib/services/courseService'
import { useUserMode } from '@/lib/contexts/UserModeContext'
import AddModuleModal from '@/components/course/AddModuleModal'
import AddLessonModal from '@/components/course/AddLessonModal'
import VoiceSessionModal from '@/components/course/VoiceSessionModal'
import VoiceSessionViewerNew from '@/components/course/VoiceSessionViewerNew'

// El modo de usuario ahora se gestiona globalmente

export default function CourseDetailPage() {
  const params = useParams()
  const courseId = params.id as string
  
  // Hooks para gestión de datos
  const { 
    course, 
    loading, 
    error, 
    updateCourse,
    createModule, 
    updateModule, 
    deleteModule,
    createLesson, 
    updateLesson, 
    deleteLesson,
    uploadFile
  } = useCourse(courseId)
  
  const { searchContent, getRecommendations } = useSemanticSearch()

  // Estados del componente
  const { userMode } = useUserMode() // Usar contexto global
  const [isEditing, setIsEditing] = useState<string | null>(null)
  const [editingModule, setEditingModule] = useState<string | null>(null)
  const [editingLesson, setEditingLesson] = useState<string | null>(null)
  
  // Estados para edición
  const [editData, setEditData] = useState<Record<string, any>>({})
  const [uploading, setUploading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [showSearchModal, setShowSearchModal] = useState(false)
  
  // Estados para modales
  const [showAddModuleModal, setShowAddModuleModal] = useState(false)
  const [showAddLessonModal, setShowAddLessonModal] = useState(false)
  const [showAddVoiceSessionModal, setShowAddVoiceSessionModal] = useState(false)
  const [selectedModuleForLesson, setSelectedModuleForLesson] = useState<string | null>(null)
  
  // Estados para navegación de estudiante
  const [currentLessonId, setCurrentLessonId] = useState<string | null>(null)
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set())
  
  // Referencias
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Log del course ID para debugging
  useEffect(() => {
    console.log('📚 Course ID:', courseId)
  }, [courseId])

  // Funciones de modo de usuario
  // El toggle de modo se maneja globalmente desde el sidebar

  // Funciones para navegación de estudiante
  const selectLesson = (lessonId: string) => {
    setCurrentLessonId(lessonId)
  }

  const toggleModuleExpansion = (moduleId: string) => {
    setExpandedModules(prev => {
      const newSet = new Set(prev)
      if (newSet.has(moduleId)) {
        newSet.delete(moduleId)
      } else {
        newSet.add(moduleId)
      }
      return newSet
    })
  }

  const getCurrentLesson = () => {
    if (!currentLessonId || !course) return null
    
    for (const moduleItem of course.modules) {
      const lesson = moduleItem.lessons.find(l => l.id === currentLessonId)
      if (lesson) return lesson
    }
    return null
  }

  // Funciones de edición de curso
  const startEditingCourse = () => {
    setIsEditing('course')
    setEditData({
      title: course?.title || '',
      description: course?.description || '',
      instructor: course?.instructor || '',
      category: course?.category || '',
      duration: course?.duration || '',
      tags: course?.tags?.join(', ') || '',
      imageUrl: course?.imageUrl || ''
    })
  }

  const saveCourse = async () => {
    try {
      if (!course) return
      
      const updates: Partial<Course> = {
        title: editData.title,
        description: editData.description,
        instructor: editData.instructor,
        category: editData.category,
        duration: editData.duration,
        tags: editData.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean),
        imageUrl: editData.imageUrl
      }

      await updateCourse(updates)
      setIsEditing(null)
      setEditData({})
    } catch (error) {
      console.error('Error saving course:', error)
      alert('Error al guardar el curso')
    }
  }

  // Funciones de edición de módulos
  const startEditingModule = (moduleItem: Module) => {
    setEditingModule(moduleItem.id)
    setEditData({
      title: moduleItem.title,
      description: moduleItem.description
    })
  }

  const saveModule = async () => {
    try {
      if (!editingModule) return

      await updateModule(editingModule, {
        title: editData.title,
        description: editData.description
      })
      
      setEditingModule(null)
      setEditData({})
    } catch (error) {
      console.error('Error saving module:', error)
      alert('Error al guardar el módulo')
    }
  }

  const handleAddModule = async (moduleData: { title: string; description: string; order: number }) => {
    try {
      await createModule(moduleData)
      setShowAddModuleModal(false)
    } catch (error) {
      console.error('Error creating module:', error)
      // El error se maneja en el modal
    }
  }

  const deleteModuleConfirm = async (moduleId: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar este módulo?')) {
      try {
        await deleteModule(moduleId)
      } catch (error) {
        console.error('Error deleting module:', error)
        // TODO: Crear modal de confirmación neumórfico
      }
    }
  }

  // Funciones de edición de lecciones
  const startEditingLesson = (lesson: Lesson) => {
    setEditingLesson(lesson.id)
    setEditData({
      title: lesson.title,
      description: lesson.description,
      content: lesson.content,
      videoUrl: lesson.videoUrl || '',
      duration: lesson.duration,
      type: lesson.type
    })
  }

  const saveLesson = async () => {
    try {
      if (!editingLesson) return

      await updateLesson(editingLesson, {
        title: editData.title,
        description: editData.description,
        content: editData.content,
        videoUrl: editData.videoUrl,
        duration: editData.duration,
        type: editData.type
      })
      
      setEditingLesson(null)
      setEditData({})
    } catch (error) {
      console.error('Error saving lesson:', error)
      alert('Error al guardar la lección')
    }
  }

  const handleAddLesson = (moduleId: string) => {
    setSelectedModuleForLesson(moduleId)
    setShowAddLessonModal(true)
  }

  const handleAddVoiceSession = (moduleId: string) => {
    setSelectedModuleForLesson(moduleId)
    setShowAddVoiceSessionModal(true)
  }

  const handleSaveLesson = async (lessonData: { 
    title: string; 
    description: string; 
    type: 'video' | 'reading' | 'quiz' | 'assignment' | 'podcast' | 'image'; 
    content: string; 
    videoUrl?: string; 
    duration: string; 
    order: number 
  }) => {
    try {
      if (!selectedModuleForLesson) return
      
      await createLesson(selectedModuleForLesson, lessonData)
      setShowAddLessonModal(false)
      setSelectedModuleForLesson(null)
    } catch (error) {
      console.error('Error creating lesson:', error)
      // El error se maneja en el modal
    }
  }

  const handleSaveVoiceSession = async (sessionData: { 
    title: string; 
    description: string; 
    type: 'voice_session'; 
    content: string; 
    duration: string; 
    order: number 
  }) => {
    try {
      if (!selectedModuleForLesson) return
      
      await createLesson(selectedModuleForLesson, sessionData)
      setShowAddVoiceSessionModal(false)
      setSelectedModuleForLesson(null)
    } catch (error) {
      console.error('Error creating voice session:', error)
      alert('Error al crear la sesión de voz')
    }
  }

  const deleteLessonConfirm = async (lessonId: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar esta lección?')) {
      try {
        await deleteLesson(lessonId)
      } catch (error) {
        console.error('Error deleting lesson:', error)
        // TODO: Crear modal de confirmación neumórfico
      }
    }
  }

  // Función para subir video
  const handleVideoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validar que es un video
    if (!file.type.startsWith('video/')) {
      console.error('File is not a video')
      return
    }

    try {
      setUploading(true)
      const videoUrl = await uploadFile(file, 'videos')
      
      setEditData(prev => ({
        ...prev,
        videoUrl: videoUrl
      }))
      
      alert('Video subido exitosamente')
    } catch (error) {
      console.error('Error uploading video:', error)
      alert('Error al subir el video')
    } finally {
      setUploading(false)
    }
  }

  // Función para subir imagen del curso
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validar que es una imagen
    if (!file.type.startsWith('image/')) {
      console.error('File is not an image')
      return
    }

    try {
      setUploading(true)
      const imageUrl = await uploadFile(file, 'course-images')
      setEditData(prev => ({ ...prev, imageUrl }))
    } catch (error) {
      console.error('Error uploading image:', error)
    } finally {
      setUploading(false)
    }
  }

  // Función de búsqueda semántica
  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    try {
      const results = await searchContent(searchQuery, courseId)
      setSearchResults(results)
      setShowSearchModal(true)
    } catch (error) {
      console.error('Error searching:', error)
      alert('Error en la búsqueda')
    }
  }

  // Función para cancelar edición
  const cancelEdit = () => {
    setIsEditing(null)
    setEditingModule(null)
    setEditingLesson(null)
    setEditData({})
  }

  if (loading) {
        return (
      <div className="min-h-screen bg-gradient-to-br from-white to-gray-50 flex items-center justify-center">
        <div className="neuro-container rounded-2xl p-8 text-center">
          <FaSpinner className="animate-spin inline mr-2 text-[#3C31A3] text-2xl" />
          <span className="text-[#132944] text-xl font-medium">Cargando curso...</span>
            </div>
          </div>
        )
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white to-gray-50 flex items-center justify-center">
        <div className="neuro-container rounded-2xl p-8 text-center">
          <div className="text-red-500 text-xl font-medium">
            Error: {error || 'Curso no encontrado'}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header con controles de modo */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-4">
            <h1 className="text-3xl font-bold text-[#132944]">
              {isEditing === 'course' ? (
                <input
                  type="text"
                  value={editData.title}
                  onChange={(e) => setEditData(prev => ({...prev, title: e.target.value}))}
                  className="neuro-inset px-4 py-2 rounded-lg text-[#132944] bg-transparent border-none outline-none focus:ring-2 focus:ring-[#3C31A3]"
                />
              ) : (
                course.title
              )}
            </h1>
            {userMode === 'admin' && isEditing !== 'course' && (
              <button
                onClick={startEditingCourse}
                className="neuro-button p-2 rounded-lg hover:bg-gray-50 transition-all duration-300"
              >
                <FaEdit className="text-[#3C31A3]" />
              </button>
            )}
            </div>
            
          <div className="flex items-center space-x-4">
            {/* Búsqueda semántica */}
            <div className="flex items-center space-x-2">
              <div className="neuro-inset rounded-lg p-2">
                <input
                  type="text"
                  placeholder="Buscar en el curso..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="bg-transparent border-none outline-none text-sm text-[#132944] placeholder-gray-500 w-48"
                />
              </div>
              <button
                onClick={handleSearch}
                className="neuro-button p-2 rounded-lg hover:bg-gray-50 transition-all duration-300"
              >
                <FaSearch className="text-[#3C31A3]" />
              </button>
            </div>

            {/* Indicador de modo actual */}
            <div className={`neuro-container flex items-center space-x-2 px-4 py-2 rounded-lg ${
              userMode === 'admin' 
                ? 'bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200' 
                : 'bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200'
            }`}>
              {userMode === 'admin' ? <FaCog className="text-orange-600" /> : <FaUser className="text-blue-600" />}
              <span className={`font-medium ${
                userMode === 'admin' ? 'text-orange-700' : 'text-blue-700'
              }`}>
                Modo {userMode === 'admin' ? 'Administrador' : 'Estudiante'}
              </span>
            </div>
          </div>
        </div>

        {/* Información del curso */}
        {isEditing === 'course' && (
          <div className="neuro-container rounded-2xl p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-gray-700 font-medium mb-2">Instructor</label>
                <input
                  type="text"
                  value={editData.instructor}
                  onChange={(e) => setEditData(prev => ({...prev, instructor: e.target.value}))}
                  className="w-full neuro-inset px-4 py-2 rounded-lg text-[#132944] bg-transparent border-none outline-none focus:ring-2 focus:ring-[#3C31A3]"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2">Categoría</label>
                <input
                  type="text"
                  value={editData.category}
                  onChange={(e) => setEditData(prev => ({...prev, category: e.target.value}))}
                  className="w-full neuro-inset px-4 py-2 rounded-lg text-[#132944] bg-transparent border-none outline-none focus:ring-2 focus:ring-[#3C31A3]"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2">Duración</label>
                <input
                  type="text"
                  value={editData.duration}
                  onChange={(e) => setEditData(prev => ({...prev, duration: e.target.value}))}
                  className="w-full neuro-inset px-4 py-2 rounded-lg text-[#132944] bg-transparent border-none outline-none focus:ring-2 focus:ring-[#3C31A3]"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2">Tags (separados por comas)</label>
                <input
                  type="text"
                  value={editData.tags}
                  onChange={(e) => setEditData(prev => ({...prev, tags: e.target.value}))}
                  className="w-full neuro-inset px-4 py-2 rounded-lg text-[#132944] bg-transparent border-none outline-none focus:ring-2 focus:ring-[#3C31A3]"
                />
        </div>
      </div>
            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">Descripción</label>
              <textarea
                value={editData.description}
                onChange={(e) => setEditData(prev => ({...prev, description: e.target.value}))}
                rows={3}
                className="w-full neuro-inset px-4 py-2 rounded-lg text-[#132944] bg-transparent border-none outline-none focus:ring-2 focus:ring-[#3C31A3] resize-none"
              />
            </div>
            
            {/* Imagen del curso */}
            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">Imagen del Curso</label>
              <div className="flex items-center space-x-4">
                {editData.imageUrl && (
                  <div className="neuro-container rounded-lg p-2">
                    <img
                      src={editData.imageUrl}
                      alt="Vista previa"
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <input
                    type="text"
                    value={editData.imageUrl}
                    onChange={(e) => setEditData(prev => ({...prev, imageUrl: e.target.value}))}
                    placeholder="URL de la imagen o sube un archivo"
                    className="w-full neuro-inset px-4 py-2 rounded-lg text-[#132944] bg-transparent border-none outline-none focus:ring-2 focus:ring-[#3C31A3] mb-2"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="neuro-button px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center space-x-2 transition-all duration-300 disabled:opacity-50"
                  >
                    {uploading ? <FaSpinner className="animate-spin" /> : <FaUpload />}
                    <span>{uploading ? 'Subiendo...' : 'Subir Imagen'}</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
              </div>
              </div>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={saveCourse}
                className="neuro-button-primary px-6 py-2 rounded-lg text-white flex items-center space-x-2 transition-all duration-300"
              >
                <FaSave />
                <span>Guardar Curso</span>
              </button>
              <button
                onClick={cancelEdit}
                className="neuro-button px-6 py-2 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center space-x-2 transition-all duration-300"
              >
                <FaTimes />
                <span>Cancelar</span>
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sidebar con contenido del curso */}
          <div className="lg:col-span-1">
            <div className="neuro-container rounded-2xl p-6 sticky top-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-[#132944]">Contenido del Curso</h2>
                {userMode === 'admin' && (
                  <button
                    onClick={() => setShowAddModuleModal(true)}
                    className="neuro-button p-2 rounded-lg hover:bg-gray-50 transition-all duration-300"
                    title="Agregar Módulo"
                  >
                    <FaPlus className="text-[#3C31A3]" />
                  </button>
                )}
          </div>

              {userMode === 'admin' ? (
                // Vista de administrador
                <div className="space-y-4">
                  {course.modules.map((moduleItem) => (
                    <div key={moduleItem.id} className="border-b border-gray-200 pb-4 last:border-b-0">
                      <div className="flex justify-between items-start mb-2">
                        {editingModule === moduleItem.id ? (
                          <div className="flex-1 space-y-2">
                            <input
                              type="text"
                              value={editData.title}
                              onChange={(e) => setEditData(prev => ({...prev, title: e.target.value}))}
                              className="w-full neuro-inset px-3 py-1 rounded text-sm text-[#132944] bg-transparent border-none outline-none focus:ring-1 focus:ring-[#3C31A3]"
                            />
                            <textarea
                              value={editData.description}
                              onChange={(e) => setEditData(prev => ({...prev, description: e.target.value}))}
                              rows={2}
                              className="w-full neuro-inset px-3 py-1 rounded text-sm text-[#132944] bg-transparent border-none outline-none focus:ring-1 focus:ring-[#3C31A3] resize-none"
                            />
                            <div className="flex space-x-2">
                              <button
                                onClick={saveModule}
                                className="neuro-button-primary px-3 py-1 rounded text-sm text-white"
                              >
                                <FaSave />
                              </button>
                <button
                                onClick={cancelEdit}
                                className="neuro-button px-3 py-1 rounded text-sm text-gray-700 hover:bg-gray-50"
                              >
                                <FaTimes />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex-1">
                              <h3 className="font-medium text-[#132944]">{moduleItem.title}</h3>
                              <p className="text-gray-600 text-sm mt-1">{moduleItem.description}</p>
                  </div>
                            <div className="flex space-x-2 ml-2">
                              <button
                                onClick={() => startEditingModule(moduleItem)}
                                className="text-gray-400 hover:text-[#3C31A3] text-sm transition-colors"
                              >
                                <FaEdit />
                              </button>
                              <button
                                onClick={() => deleteModuleConfirm(moduleItem.id)}
                                className="text-gray-400 hover:text-red-500 text-sm transition-colors"
                              >
                                <FaTrash />
                </button>
                            </div>
                          </>
                        )}
                      </div>
                      
                      <div className="ml-4 space-y-2">
                        {moduleItem.lessons.map((lesson) => (
                          <div key={lesson.id} className="flex items-center justify-between group neuro-inset rounded-lg p-2 hover:bg-gray-50 transition-all duration-300">
                            <div className="flex items-center space-x-3 flex-1">
                              <div className="text-[#3C31A3]">
                                {lesson.type === 'video' && <FaPlay />}
                                {lesson.type === 'reading' && <FaBookOpen />}
                                {lesson.type === 'quiz' && <FaQuestionCircle />}
                                {lesson.type === 'assignment' && <FaClipboardList />}
                                {lesson.type === 'voice_session' && <FaMicrophone />}
                              </div>
                              <div className="flex-1">
                                <p className="text-[#132944] text-sm font-medium">{lesson.title}</p>
                                <p className="text-gray-500 text-xs">{lesson.duration}</p>
                              </div>
                            </div>
                            <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => startEditingLesson(lesson)}
                                className="text-gray-400 hover:text-[#3C31A3] text-xs transition-colors"
                              >
                                <FaEdit />
                              </button>
                              <button
                                onClick={() => deleteLessonConfirm(lesson.id)}
                                className="text-gray-400 hover:text-red-500 text-xs transition-colors"
                              >
                                <FaTrash />
                              </button>
                            </div>
                          </div>
                        ))}
                        <div className="flex items-center space-x-2 ml-6">
                          <button
                            onClick={() => handleAddLesson(moduleItem.id)}
                            className="flex items-center space-x-2 text-[#3C31A3] hover:text-[#132944] text-sm transition-colors neuro-button p-2 rounded-lg hover:bg-gray-50"
                          >
                            <FaPlus />
                            <span>Agregar Lección</span>
                          </button>
                          <button
                            onClick={() => handleAddVoiceSession(moduleItem.id)}
                            className="flex items-center space-x-2 text-[#8b5cf6] hover:text-[#6366f1] text-sm transition-colors neuro-button p-2 rounded-lg hover:bg-gray-50"
                          >
                            <FaMicrophone />
                            <span>Generar Sesión de Voz</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                // Vista de estudiante - LMS style
                <div className="space-y-2">
                  {course.modules.map((moduleItem) => (
                    <div key={moduleItem.id} className="neuro-container rounded-lg">
                      <button
                        onClick={() => toggleModuleExpansion(moduleItem.id)}
                        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-all duration-300 rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="text-[#3C31A3]">
                            <FaBook />
                          </div>
                          <div className="text-left">
                            <h3 className="font-medium text-[#132944]">{moduleItem.title}</h3>
                            <p className="text-gray-500 text-sm">{moduleItem.lessons.length} lecciones</p>
                          </div>
                        </div>
                        <div className={`text-gray-400 transition-transform duration-300 ${expandedModules.has(moduleItem.id) ? 'rotate-90' : ''}`}>
                          <FaArrowRight />
                        </div>
                      </button>
                      
                      {expandedModules.has(moduleItem.id) && (
                        <div className="px-4 pb-4 space-y-1">
                          {moduleItem.lessons.map((lesson, index) => (
                            <button
                              key={lesson.id}
                              onClick={() => selectLesson(lesson.id)}
                              className={`w-full flex items-center space-x-3 p-3 rounded-lg text-left transition-all duration-300 ${
                                currentLessonId === lesson.id 
                                  ? 'neuro-button-primary text-white' 
                                  : 'hover:bg-gray-50 neuro-inset'
                              }`}
                            >
                              <div className="flex items-center space-x-2 text-sm">
                                <span className="text-xs bg-gray-200 px-2 py-1 rounded-full font-medium">
                                  {index + 1}
                                </span>
                                <div className={currentLessonId === lesson.id ? 'text-white' : 'text-[#3C31A3]'}>
                                  {lesson.type === 'video' && <FaPlay />}
                                  {lesson.type === 'reading' && <FaBookOpen />}
                                  {lesson.type === 'quiz' && <FaQuestionCircle />}
                                  {lesson.type === 'assignment' && <FaClipboardList />}
                                  {lesson.type === 'voice_session' && <FaMicrophone />}
                                </div>
                              </div>
                              <div className="flex-1">
                                <p className={`text-sm font-medium ${currentLessonId === lesson.id ? 'text-white' : 'text-[#132944]'}`}>
                                  {lesson.title}
                                </p>
                                <p className={`text-xs ${currentLessonId === lesson.id ? 'text-white/80' : 'text-gray-500'}`}>
                                  {lesson.duration}
                                </p>
                              </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
              )}
            </div>
          </div>

          {/* Contenido principal */}
          <div className="lg:col-span-2">
            <div className="neuro-container rounded-2xl p-8">
              {editingLesson ? (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-[#132944] mb-6">Editando Lección</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-700 font-medium mb-2">Título</label>
                      <input
                        type="text"
                        value={editData.title}
                        onChange={(e) => setEditData(prev => ({...prev, title: e.target.value}))}
                        className="w-full neuro-inset px-4 py-2 rounded-lg text-[#132944] bg-transparent border-none outline-none focus:ring-2 focus:ring-[#3C31A3]"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 font-medium mb-2">Duración</label>
                      <input
                        type="text"
                        value={editData.duration}
                        onChange={(e) => setEditData(prev => ({...prev, duration: e.target.value}))}
                        className="w-full neuro-inset px-4 py-2 rounded-lg text-[#132944] bg-transparent border-none outline-none focus:ring-2 focus:ring-[#3C31A3]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Descripción</label>
                    <textarea
                      value={editData.description}
                      onChange={(e) => setEditData(prev => ({...prev, description: e.target.value}))}
                      rows={3}
                      className="w-full neuro-inset px-4 py-2 rounded-lg text-[#132944] bg-transparent border-none outline-none focus:ring-2 focus:ring-[#3C31A3] resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Tipo de Lección</label>
                    <select
                      value={editData.type}
                      onChange={(e) => setEditData(prev => ({...prev, type: e.target.value}))}
                      className="w-full neuro-inset px-4 py-2 rounded-lg text-[#132944] bg-transparent border-none outline-none focus:ring-2 focus:ring-[#3C31A3]"
                    >
                      <option value="reading">Lectura</option>
                      <option value="video">Video</option>
                      <option value="quiz">Quiz</option>
                      <option value="assignment">Tarea</option>
                    </select>
        </div>

                  {editData.type === 'video' && (
                    <div>
                      <label className="block text-gray-700 font-medium mb-2">Video URL</label>
                      <div className="flex space-x-4">
                        <input
                          type="text"
                          value={editData.videoUrl}
                          onChange={(e) => setEditData(prev => ({...prev, videoUrl: e.target.value}))}
                          placeholder="URL del video o sube un archivo"
                          className="flex-1 neuro-inset px-4 py-2 rounded-lg text-[#132944] bg-transparent border-none outline-none focus:ring-2 focus:ring-[#3C31A3]"
                        />
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploading}
                          className="neuro-button-primary px-4 py-2 rounded-lg text-white flex items-center space-x-2 transition-all duration-300 disabled:opacity-50"
                        >
                          {uploading ? <FaSpinner className="animate-spin" /> : <FaUpload />}
                          <span>{uploading ? 'Subiendo...' : 'Subir Video'}</span>
                        </button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="video/*"
                          onChange={handleVideoUpload}
                          className="hidden"
                        />
                      </div>
                    </div>
                  )}

            <div>
                    <label className="block text-gray-700 font-medium mb-2">Contenido</label>
                    <textarea
                      value={editData.content}
                      onChange={(e) => setEditData(prev => ({...prev, content: e.target.value}))}
                      rows={8}
                      className="w-full neuro-inset px-4 py-2 rounded-lg text-[#132944] bg-transparent border-none outline-none focus:ring-2 focus:ring-[#3C31A3] resize-none"
                    />
                  </div>

                  <div className="flex space-x-4">
                    <button
                      onClick={saveLesson}
                      className="neuro-button-primary px-6 py-2 rounded-lg text-white flex items-center space-x-2 transition-all duration-300"
                    >
                      <FaSave />
                      <span>Guardar Lección</span>
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="neuro-button px-6 py-2 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center space-x-2 transition-all duration-300"
                    >
                      <FaTimes />
                      <span>Cancelar</span>
                    </button>
                  </div>

                  {/* Info box sobre S3 Vectors */}
                  <div className="neuro-inset rounded-lg p-4 mt-6">
                    <div className="flex items-center space-x-2 mb-2">
                      <FaLightbulb className="text-[#3C31A3]" />
                      <h4 className="font-medium text-[#132944]">Integración con S3 Vectors</h4>
                    </div>
                    <p className="text-gray-600 text-sm">
                      El contenido de esta lección se almacenará automáticamente como vectores en el bucket 
                      <code className="bg-gray-100 px-2 py-1 rounded text-xs mx-1">cognia-intellilearn</code>
                      para búsquedas semánticas y recomendaciones inteligentes.
                    </p>
                  </div>
                </div>
              ) : (
                <div>
                  {userMode === 'student' && currentLessonId ? (
                    // Vista de estudiante con lección seleccionada
                    (() => {
                      const currentLesson = getCurrentLesson()
                      if (!currentLesson) return <div>Selecciona una lección para comenzar</div>
                      
                      return (
                        <div>
                          {/* Header de la lección - Solo mostrar para lecciones que NO sean voice_session */}
                          {currentLesson.type !== 'voice_session' && (
                            <div className="mb-8">
                              <div className="flex items-center space-x-4 mb-4">
                                <div className="neuro-container w-12 h-12 rounded-xl flex items-center justify-center">
                                  <div className="text-[#3C31A3] text-xl">
                                    {currentLesson.type === 'video' && <FaPlay />}
                                    {currentLesson.type === 'reading' && <FaBookOpen />}
                                    {currentLesson.type === 'quiz' && <FaQuestionCircle />}
                                    {currentLesson.type === 'assignment' && <FaClipboardList />}
                                  </div>
                                </div>
                                <div>
                                  <h1 className="text-3xl font-bold text-[#132944]">{currentLesson.title}</h1>
                                  <p className="text-gray-600 mt-1">{currentLesson.description}</p>
                                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                                    <span>⏱️ {currentLesson.duration}</span>
                                    <span className="capitalize">📚 {currentLesson.type}</span>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Imagen del curso si existe */}
                              {course.imageUrl && (
                                <div className="neuro-container rounded-xl p-4 mb-6">
                                  <img
                                    src={course.imageUrl}
                                    alt={course.title}
                                    className="w-full h-48 object-cover rounded-lg"
                                  />
                                </div>
                              )}
                            </div>
                          )}

              {/* Contenido de la lección */}
                          <div className="neuro-container rounded-xl p-8">
                            {currentLesson.type === 'video' && currentLesson.videoUrl && (
                              <div className="mb-8">
                                <div className="neuro-inset rounded-lg p-4">
                                  <video
                                    controls
                                    className="w-full rounded-lg"
                                    poster="/assets/images/video-placeholder.jpg"
                                  >
                                    <source src={currentLesson.videoUrl} type="video/mp4" />
                                    Tu navegador no soporta videos HTML5.
                                  </video>
                                </div>
                              </div>
                            )}

                            {currentLesson.type === 'voice_session' && (
                              <VoiceSessionViewerNew lesson={currentLesson} />
                            )}
                            
                            {currentLesson.type !== 'voice_session' && (
                              <div className="prose prose-gray max-w-none">
                                <div 
                                  className="text-gray-700 leading-relaxed"
                                  dangerouslySetInnerHTML={{ 
                                    __html: currentLesson.content || 'Contenido no disponible' 
                                  }}
                                />
                              </div>
                            )}
                          </div>

                          {/* Navegación entre lecciones */}
                          <div className="mt-8 flex justify-between items-center">
                            <button className="neuro-button px-6 py-3 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center space-x-2 transition-all duration-300">
                              <FaArrowLeft />
                              <span>Lección Anterior</span>
                            </button>
                            <button className="neuro-button-primary px-6 py-3 rounded-lg text-white flex items-center space-x-2 transition-all duration-300">
                              <span>Siguiente Lección</span>
                              <FaArrowRight />
                </button>
                          </div>
                        </div>
                      )
                    })()
                  ) : (
                    // Vista por defecto (admin o estudiante sin lección seleccionada)
                    <div>
                      <h2 className="text-2xl font-bold text-[#132944] mb-6">
                        {userMode === 'student' ? 'Bienvenido al Curso' : course.modules[0]?.lessons[1]?.title || 'Metodologías Ágiles vs Tradicionales'}
                      </h2>
                      
                      {userMode === 'student' ? (
                        <div className="text-center py-12">
                          <div className="neuro-container w-24 h-24 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <FaBook className="text-4xl text-[#3C31A3]" />
                          </div>
                          <h3 className="text-xl font-semibold text-[#132944] mb-4">¡Comienza tu Aprendizaje!</h3>
                          <p className="text-gray-600 mb-8 max-w-md mx-auto">
                            Selecciona un módulo del menú lateral para comenzar con las lecciones. 
                            Cada lección está diseñada para llevarte paso a paso hacia el dominio del Project Management.
                          </p>
                          
                          {/* Imagen del curso si existe */}
                          {course.imageUrl && (
                            <div className="neuro-container rounded-xl p-4 mb-6 max-w-lg mx-auto">
                              <img
                                src={course.imageUrl}
                                alt={course.title}
                                className="w-full h-48 object-cover rounded-lg"
                              />
                            </div>
                          )}
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                            <div className="neuro-container rounded-lg p-4">
                              <div className="text-[#3C31A3] text-2xl mb-2">📚</div>
                              <h4 className="font-medium text-[#132944] mb-1">{course.modules.length} Módulos</h4>
                              <p className="text-gray-600 text-sm">Contenido estructurado</p>
                            </div>
                            <div className="neuro-container rounded-lg p-4">
                              <div className="text-[#3C31A3] text-2xl mb-2">🎯</div>
                              <h4 className="font-medium text-[#132944] mb-1">Práctica Guiada</h4>
                              <p className="text-gray-600 text-sm">Ejercicios y ejemplos</p>
                            </div>
                            <div className="neuro-container rounded-lg p-4">
                              <div className="text-[#3C31A3] text-2xl mb-2">🏆</div>
                              <h4 className="font-medium text-[#132944] mb-1">Certificación</h4>
                              <p className="text-gray-600 text-sm">Al completar el curso</p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="prose prose-gray max-w-none">
                            <div 
                              className="text-gray-700 leading-relaxed"
                              dangerouslySetInnerHTML={{ 
                                __html: course.modules[0]?.lessons[1]?.content || 'Contenido no disponible' 
                              }}
                            />
                          </div>

                          {/* Lecciones relacionadas */}
                          <div className="mt-12 pt-8 border-t border-gray-200">
                            <div className="flex items-center space-x-2 mb-6">
                              <FaLightbulb className="text-[#3C31A3]" />
                              <h3 className="text-xl font-semibold text-[#132944]">Lecciones Relacionadas</h3>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {course.modules[0]?.lessons.slice(0, 2).map((lesson) => (
                                <div key={lesson.id} className="neuro-container rounded-lg p-4 hover:bg-gray-50 transition-all duration-300 cursor-pointer">
                                  <div className="flex items-center space-x-3 mb-2">
                                    <div className="text-[#3C31A3]">
                                      {lesson.type === 'video' && <FaPlay />}
                                      {lesson.type === 'reading' && <FaBookOpen />}
                                      {lesson.type === 'quiz' && <FaQuestionCircle />}
                                    </div>
                                    <h4 className="font-medium text-[#132944]">{lesson.title}</h4>
                                  </div>
                                  <p className="text-gray-600 text-sm">{lesson.description}</p>
                                  <p className="text-gray-500 text-xs mt-2">{lesson.duration}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de resultados de búsqueda */}
      {showSearchModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="neuro-container rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-[#132944]">Resultados de búsqueda para &ldquo;{searchQuery}&rdquo;</h3>
                <button
                  onClick={() => setShowSearchModal(false)}
                  className="neuro-button p-2 rounded-lg hover:bg-gray-50 transition-all duration-300"
                >
                  <FaTimes className="text-gray-600" />
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto max-h-96">
              {searchResults.length > 0 ? (
                <div className="space-y-4">
                  {searchResults.map((result, index) => (
                    <div key={index} className="border-b border-gray-200 pb-4 last:border-b-0">
                      <h4 className="font-medium text-[#132944] mb-2">{result.title}</h4>
                      <p className="text-gray-600 text-sm mb-2">{result.excerpt}</p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span className="capitalize">{result.type}</span>
                        <span>Similitud: {Math.round(result.similarity * 100)}%</span>
                      </div>
                    </div>
                  ))}
            </div>
          ) : (
                <div className="text-center py-8">
                  <FaSearch className="text-4xl text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No se encontraron resultados</p>
              </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modales */}
      <AddModuleModal
        isOpen={showAddModuleModal}
        onClose={() => setShowAddModuleModal(false)}
        onSave={handleAddModule}
        moduleCount={course?.modules.length || 0}
      />

      <AddLessonModal
        isOpen={showAddLessonModal}
        onClose={() => {
          setShowAddLessonModal(false)
          setSelectedModuleForLesson(null)
        }}
        onSave={handleSaveLesson}
        onUploadFile={uploadFile}
        moduleId={selectedModuleForLesson || ''}
        lessonCount={selectedModuleForLesson ? course?.modules.find(m => m.id === selectedModuleForLesson)?.lessons.length || 0 : 0}
      />

      <VoiceSessionModal
        isOpen={showAddVoiceSessionModal}
        onClose={() => {
          setShowAddVoiceSessionModal(false)
          setSelectedModuleForLesson(null)
        }}
        onSave={handleSaveVoiceSession}
        moduleTitle={selectedModuleForLesson ? course?.modules.find(m => m.id === selectedModuleForLesson)?.title || '' : ''}
      />
    </div>
  )
}