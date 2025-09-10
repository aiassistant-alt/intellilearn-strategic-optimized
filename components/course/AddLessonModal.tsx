'use client'

import { useState, useRef } from 'react'
import { FaPlay, FaBookOpen, FaQuestionCircle, FaClipboardList, FaArrowRight, FaArrowLeft, FaSave, FaCheck, FaUpload, FaSpinner, FaMicrophone, FaImage, FaTimes } from 'react-icons/fa'

interface AddLessonModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (lessonData: { 
    title: string; 
    description: string; 
    type: 'video' | 'reading' | 'quiz' | 'assignment' | 'podcast' | 'image'; 
    content: string; 
    videoUrl?: string; 
    duration: string; 
    order: number 
  }) => Promise<void>
  onUploadFile: (file: File, folder?: string) => Promise<string>
  moduleId: string
  lessonCount: number
}

enum Step {
  TYPE_SELECTION = 'type_selection',
  BASIC_INFO = 'basic_info',
  CONTENT = 'content',
  MEDIA = 'media',
  CONFIRMATION = 'confirmation'
}

const lessonTypes = [
  {
    type: 'video' as const,
    icon: FaPlay,
    title: 'Video Lección',
    description: 'Se guardará en S3/Videos/',
    color: 'text-red-500',
    bgColor: 'bg-red-50',
    s3Folder: 'Videos'
  },
  {
    type: 'reading' as const,
    icon: FaBookOpen,
    title: 'Lectura',
    description: 'Se guardará en S3/Documents/',
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
    s3Folder: 'Documents'
  },
  {
    type: 'podcast' as const,
    icon: FaMicrophone,
    title: 'Podcast',
    description: 'Se guardará en S3/Podcast/',
    color: 'text-orange-500',
    bgColor: 'bg-orange-50',
    s3Folder: 'Podcast'
  },
  {
    type: 'quiz' as const,
    icon: FaQuestionCircle,
    title: 'Quiz',
    description: 'Se guardará en S3/Quiz/',
    color: 'text-green-500',
    bgColor: 'bg-green-50',
    s3Folder: 'Quiz'
  },
  {
    type: 'assignment' as const,
    icon: FaClipboardList,
    title: 'Tarea',
    description: 'Se guardará en S3/Tasks/',
    color: 'text-purple-500',
    bgColor: 'bg-purple-50',
    s3Folder: 'Tasks'
  },
  {
    type: 'image' as const,
    icon: FaImage,
    title: 'Imagen',
    description: 'Se guardará en S3/Images/',
    color: 'text-pink-500',
    bgColor: 'bg-pink-50',
    s3Folder: 'Images'
  }
]

export default function AddLessonModal({ 
  isOpen, 
  onClose, 
  onSave, 
  onUploadFile,
  moduleId, 
  lessonCount 
}: AddLessonModalProps) {
  const [currentStep, setCurrentStep] = useState<Step>(Step.TYPE_SELECTION)
  const [loading, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'reading' as 'video' | 'reading' | 'quiz' | 'assignment' | 'podcast' | 'image',
    content: '',
    videoUrl: '',
    duration: '',
    order: lessonCount + 1
  })

  const handleClose = () => {
    setCurrentStep(Step.TYPE_SELECTION)
    setFormData({
      title: '',
      description: '',
      type: 'reading',
      content: '',
      videoUrl: '',
      duration: '',
      order: lessonCount + 1
    })
    onClose()
  }

  const handleNext = () => {
    switch (currentStep) {
      case Step.TYPE_SELECTION:
        setCurrentStep(Step.BASIC_INFO)
        break
      case Step.BASIC_INFO:
        setCurrentStep(Step.CONTENT)
        break
      case Step.CONTENT:
        if (formData.type === 'video') {
          setCurrentStep(Step.MEDIA)
        } else {
          setCurrentStep(Step.CONFIRMATION)
        }
        break
      case Step.MEDIA:
        setCurrentStep(Step.CONFIRMATION)
        break
    }
  }

  const handleBack = () => {
    switch (currentStep) {
      case Step.BASIC_INFO:
        setCurrentStep(Step.TYPE_SELECTION)
        break
      case Step.CONTENT:
        setCurrentStep(Step.BASIC_INFO)
        break
      case Step.MEDIA:
        setCurrentStep(Step.CONTENT)
        break
      case Step.CONFIRMATION:
        if (formData.type === 'video') {
          setCurrentStep(Step.MEDIA)
        } else {
          setCurrentStep(Step.CONTENT)
        }
        break
    }
  }

  const handleVideoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setUploading(true)
      const videoUrl = await onUploadFile(file, 'videos')
      setFormData(prev => ({ ...prev, videoUrl }))
    } catch (error) {
      console.error('Error uploading video:', error)
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      await onSave(formData)
      handleClose()
    } catch (error) {
      console.error('Error saving lesson:', error)
    } finally {
      setSaving(false)
    }
  }

  const isStepValid = () => {
    switch (currentStep) {
      case Step.TYPE_SELECTION:
        return true
      case Step.BASIC_INFO:
        return formData.title.trim().length > 0 && formData.description.trim().length > 0
      case Step.CONTENT:
        return formData.content.trim().length > 0
      case Step.MEDIA:
        return formData.type !== 'video' || formData.videoUrl.trim().length > 0
      case Step.CONFIRMATION:
        return true
      default:
        return false
    }
  }

  const getStepTitle = () => {
    switch (currentStep) {
      case Step.TYPE_SELECTION:
        return 'Seleccionar Tipo de Lección'
      case Step.BASIC_INFO:
        return 'Información Básica'
      case Step.CONTENT:
        return 'Contenido de la Lección'
      case Step.MEDIA:
        return 'Material de Video'
      case Step.CONFIRMATION:
        return 'Confirmar Nueva Lección'
      default:
        return 'Agregar Lección'
    }
  }

  const selectedType = lessonTypes.find(t => t.type === formData.type)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4">
      <div className="nm-modal-white w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header - Centered Title Neumorphic */}
        <div className="nm-modal-header p-6">
          <h2 className="nm-modal-title">{getStepTitle()}</h2>
          <button
            onClick={handleClose}
            className="nm-close-button"
          >
            <FaTimes />
          </button>
        </div>

        <div className="p-6">
          {/* Progress Indicator */}
          <div className="mb-8">
        <div className="flex items-center justify-center space-x-2">
          {[Step.TYPE_SELECTION, Step.BASIC_INFO, Step.CONTENT, ...(formData.type === 'video' ? [Step.MEDIA] : []), Step.CONFIRMATION].map((step, index) => {
            const isActive = currentStep === step
            const isCompleted = [Step.TYPE_SELECTION, Step.BASIC_INFO, Step.CONTENT, Step.MEDIA].indexOf(currentStep) > [Step.TYPE_SELECTION, Step.BASIC_INFO, Step.CONTENT, Step.MEDIA].indexOf(step)
            
            return (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  isActive ? 'nm-white-button-active' : 
                  isCompleted ? 'nm-white-button-completed' : 
                  'nm-white-button-inactive'
                }`}>
                  {isCompleted ? <FaCheck /> : index + 1}
                </div>
                {index < ([Step.TYPE_SELECTION, Step.BASIC_INFO, Step.CONTENT, ...(formData.type === 'video' ? [Step.MEDIA] : []), Step.CONFIRMATION].length - 1) && (
                  <div className={`w-8 h-0.5 mx-2 ${isCompleted ? 'bg-green-500' : 'bg-gray-300'}`} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="min-h-[400px]">
        {currentStep === Step.TYPE_SELECTION && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <p className="text-gray-600 text-lg">¿Qué tipo de lección quieres crear?</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {lessonTypes.map((lessonType) => {
                const Icon = lessonType.icon
                const isSelected = formData.type === lessonType.type
                
                return (
                  <button
                    key={lessonType.type}
                    onClick={() => setFormData(prev => ({ ...prev, type: lessonType.type }))}
                    className={`nm-white-card rounded-xl p-6 text-left transition-all duration-300 ${
                      isSelected ? 'nm-white-card-selected' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-4">
                      <div className={`nm-white-icon-box w-12 h-12 rounded-xl flex items-center justify-center ${lessonType.bgColor}`}>
                        <Icon className={`text-xl ${lessonType.color}`} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-[#132944] mb-2">{lessonType.title}</h3>
                        <p className="text-gray-600 text-sm">{lessonType.description}</p>
                      </div>
                      {isSelected && (
                        <div className="text-[#3C31A3]">
                          <FaCheck />
                        </div>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {currentStep === Step.BASIC_INFO && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="nm-white-icon-large w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                {selectedType && <selectedType.icon className={`text-2xl ${selectedType.color}`} />}
              </div>
              <p className="text-gray-600">Información básica para tu {selectedType?.title.toLowerCase()}</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-700 font-medium mb-3">Título de la Lección *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Ej: Introducción a Metodologías Ágiles"
                  className="nm-white-input w-full px-4 py-3 rounded-lg text-gray-800"
                  autoFocus
                />
              </div>
              
              <div>
                <label className="block text-gray-700 font-medium mb-3">Duración Estimada *</label>
                <input
                  type="text"
                  value={formData.duration}
                  onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                  placeholder="Ej: 15 min, 1 hora, 30 min"
                  className="nm-white-input w-full px-4 py-3 rounded-lg text-gray-800"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-gray-700 font-medium mb-3">Descripción Breve *</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe brevemente el objetivo y contenido de esta lección..."
                rows={3}
                className="w-full neuro-inset px-4 py-3 rounded-lg text-[#132944] bg-transparent border-none outline-none focus:ring-2 focus:ring-[#3C31A3] resize-none"
              />
            </div>
            
            <div>
              <label className="block text-gray-700 font-medium mb-3">Orden en el Módulo</label>
              <div className="nm-white-section rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <span className="text-gray-600">Lección #</span>
                  <input
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData(prev => ({ ...prev, order: parseInt(e.target.value) || 1 }))}
                    min="1"
                    className="nm-white-input px-3 py-2 rounded w-20 text-center text-gray-800"
                  />
                  <span className="text-gray-600">del módulo</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentStep === Step.CONTENT && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="nm-white-icon-large w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                {selectedType && <selectedType.icon className={`text-2xl ${selectedType.color}`} />}
              </div>
              <p className="text-gray-600">Contenido principal de la lección</p>
            </div>
            
            <div>
              <label className="block text-gray-700 font-medium mb-3">
                Contenido de la Lección *
                <span className="text-gray-500 text-sm font-normal ml-2">
                  (Puedes usar HTML básico para formato)
                </span>
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                placeholder={`Escribe el contenido completo para tu ${selectedType?.title.toLowerCase()}...

Ejemplos de formato:
- <h3>Subtítulo</h3>
- <p>Párrafo normal</p>
- <strong>Texto en negrita</strong>
- <ul><li>Lista con viñetas</li></ul>
- <ol><li>Lista numerada</li></ol>`}
                rows={12}
                className="w-full neuro-inset px-4 py-3 rounded-lg text-[#132944] bg-transparent border-none outline-none focus:ring-2 focus:ring-[#3C31A3] resize-none font-mono text-sm"
              />
              <p className="text-gray-500 text-sm mt-2">
                Caracteres: {formData.content.length}
              </p>
            </div>
            
            <div className="nm-white-info-box rounded-lg p-4">
              <h4 className="font-medium text-[#132944] mb-2">💡 Consejos para el contenido:</h4>
              <ul className="text-gray-600 text-sm space-y-1">
                <li>• Usa títulos y subtítulos para organizar el contenido</li>
                <li>• Incluye ejemplos prácticos cuando sea posible</li>
                <li>• Mantén párrafos cortos y fáciles de leer</li>
                <li>• Agrega puntos clave o resúmenes al final</li>
              </ul>
            </div>
          </div>
        )}

        {currentStep === Step.MEDIA && formData.type === 'video' && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="nm-white-icon-large w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FaPlay className="text-2xl text-red-500" />
              </div>
              <p className="text-gray-600">Agrega el video para tu lección</p>
            </div>
            
            <div>
              <label className="block text-gray-700 font-medium mb-3">URL del Video o Subir Archivo</label>
              <div className="space-y-4">
                <input
                  type="text"
                  value={formData.videoUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, videoUrl: e.target.value }))}
                  placeholder="https://youtube.com/watch?v=... o URL directa del video"
                  className="nm-white-input w-full px-4 py-3 rounded-lg text-gray-800"
                />
                
                <div className="text-center">
                  <span className="text-gray-500">o</span>
                </div>
                
                <div className="nm-white-upload-area border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="nm-white-button-primary px-6 py-3 rounded-lg flex items-center space-x-2 mx-auto transition-all duration-300 disabled:opacity-50"
                  >
                    {uploading ? <FaSpinner className="animate-spin" /> : <FaUpload />}
                    <span>{uploading ? 'Subiendo...' : 'Subir Video'}</span>
                  </button>
                  <p className="text-gray-500 text-sm mt-2">
                    Formatos soportados: MP4, MOV, AVI (máx. 100MB)
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*"
                    onChange={handleVideoUpload}
                    className="hidden"
                  />
                </div>
                
                {formData.videoUrl && (
                  <div className="nm-white-success-box rounded-lg p-4">
                    <div className="flex items-center space-x-2 text-green-600">
                      <FaCheck />
                      <span className="font-medium">Video configurado</span>
                    </div>
                    <p className="text-gray-600 text-sm mt-1 truncate">{formData.videoUrl}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {currentStep === Step.CONFIRMATION && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="nm-white-icon-large w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FaCheck className="text-2xl text-green-500" />
              </div>
              <p className="text-gray-600">Revisa toda la información antes de crear la lección</p>
            </div>
            
            <div className="nm-white-summary-card rounded-xl p-6">
              <h3 className="text-xl font-bold text-[#132944] mb-6">Resumen de la Lección</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-gray-500 text-sm font-medium">Tipo:</label>
                    <div className="flex items-center space-x-2 mt-1">
                      {selectedType && <selectedType.icon className={`${selectedType.color}`} />}
                      <span className="text-[#132944] font-medium">{selectedType?.title}</span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-gray-500 text-sm font-medium">Título:</label>
                    <p className="text-[#132944] font-medium">{formData.title}</p>
                  </div>
                  
                  <div>
                    <label className="text-gray-500 text-sm font-medium">Duración:</label>
                    <p className="text-[#132944]">{formData.duration}</p>
                  </div>
                  
                  <div>
                    <label className="text-gray-500 text-sm font-medium">Orden:</label>
                    <p className="text-[#132944]">Lección #{formData.order}</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-gray-500 text-sm font-medium">Descripción:</label>
                    <p className="text-gray-700 text-sm leading-relaxed">{formData.description}</p>
                  </div>
                  
                  {formData.type === 'video' && formData.videoUrl && (
                    <div>
                      <label className="text-gray-500 text-sm font-medium">Video:</label>
                      <p className="text-gray-700 text-sm truncate">{formData.videoUrl}</p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="mt-6 pt-4 border-t border-gray-200">
                <label className="text-gray-500 text-sm font-medium">Vista previa del contenido:</label>
                <div className="nm-white-preview-box rounded-lg p-4 mt-2 max-h-32 overflow-y-auto">
                  <div 
                    className="text-gray-700 text-sm prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: formData.content.substring(0, 200) + (formData.content.length > 200 ? '...' : '') }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-100">
        <div>
          {currentStep !== Step.TYPE_SELECTION && (
            <button
              onClick={handleBack}
              className="nm-white-button px-6 py-3 rounded-lg text-gray-600 flex items-center space-x-2 transition-all duration-300"
            >
              <FaArrowLeft />
              <span>Anterior</span>
            </button>
          )}
        </div>
        
        <div className="flex space-x-4">
          <button
            onClick={handleClose}
            className="nm-white-button px-6 py-3 rounded-lg text-gray-600 transition-all duration-300"
          >
            Cancelar
          </button>
          
          {currentStep === Step.CONFIRMATION ? (
            <button
              onClick={handleSave}
              disabled={loading}
              className="nm-white-button-primary px-6 py-3 rounded-lg flex items-center space-x-2 transition-all duration-300 disabled:opacity-50"
            >
              <FaSave />
              <span>{loading ? 'Creando...' : 'Crear Lección'}</span>
            </button>
          ) : (
            <button
              onClick={handleNext}
              disabled={!isStepValid()}
              className="nm-white-button-primary px-6 py-3 rounded-lg flex items-center space-x-2 transition-all duration-300 disabled:opacity-50"
            >
              <span>Siguiente</span>
              <FaArrowRight />
            </button>
          )}
        </div>
          </div>
        </div>
      </div>

      {/* Neumorphic White Styles */}
      <style jsx>{`
        .nm-modal-white {
          background: #ffffff;
          border-radius: 24px;
          box-shadow: 
            30px 30px 60px #d9d9d9,
            -30px -30px 60px #ffffff;
        }

        .nm-modal-header {
          position: relative;
          background: #ffffff;
          border-bottom: 1px solid #f0f0f0;
        }

        .nm-modal-title {
          text-align: center;
          font-size: 1.25rem;
          font-weight: 600;
          color: #2d3748;
          background: linear-gradient(145deg, #ffffff, #f0f0f0);
          padding: 12px 24px;
          border-radius: 12px;
          box-shadow: 
            inset 3px 3px 6px #e6e6e6,
            inset -3px -3px 6px #ffffff;
          display: inline-block;
          margin: 0 auto;
          width: fit-content;
        }

        .nm-close-button {
          position: absolute;
          top: 20px;
          right: 20px;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: #ffffff;
          box-shadow: 
            4px 4px 8px #d9d9d9,
            -4px -4px 8px #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s ease;
          border: none;
          color: #6b7280;
        }

        .nm-close-button:hover {
          box-shadow: 
            2px 2px 4px #d9d9d9,
            -2px -2px 4px #ffffff;
        }

        .nm-white-input {
          background: #ffffff;
          box-shadow: 
            inset 4px 4px 8px #e6e6e6,
            inset -4px -4px 8px #ffffff;
          border: none;
          outline: none;
          transition: all 0.3s ease;
        }

        .nm-white-input:focus {
          box-shadow: 
            inset 6px 6px 12px #e6e6e6,
            inset -6px -6px 12px #ffffff;
        }

        .nm-white-card {
          background: #ffffff;
          box-shadow: 
            8px 8px 16px #e6e6e6,
            -8px -8px 16px #ffffff;
          cursor: pointer;
        }

        .nm-white-card:hover {
          box-shadow: 
            10px 10px 20px #e6e6e6,
            -10px -10px 20px #ffffff;
        }

        .nm-white-card-selected {
          box-shadow: 
            inset 4px 4px 8px #e6e6e6,
            inset -4px -4px 8px #ffffff;
          background: linear-gradient(145deg, #f9f9f9, #ffffff);
        }

        .nm-white-icon-box,
        .nm-white-icon-large {
          background: #ffffff;
          box-shadow: 
            4px 4px 8px #e6e6e6,
            -4px -4px 8px #ffffff;
        }

        .nm-white-section,
        .nm-white-info-box,
        .nm-white-summary-card {
          background: #ffffff;
          box-shadow: 
            8px 8px 16px #e6e6e6,
            -8px -8px 16px #ffffff;
        }

        .nm-white-upload-area {
          background: #ffffff;
          box-shadow: 
            inset 2px 2px 4px #e6e6e6,
            inset -2px -2px 4px #ffffff;
        }

        .nm-white-success-box {
          background: linear-gradient(145deg, #f0fff4, #ffffff);
          box-shadow: 
            6px 6px 12px #e6e6e6,
            -6px -6px 12px #ffffff;
        }

        .nm-white-preview-box {
          background: #fafafa;
          box-shadow: 
            inset 3px 3px 6px #e6e6e6,
            inset -3px -3px 6px #ffffff;
        }

        .nm-white-button {
          background: #ffffff;
          box-shadow: 
            6px 6px 12px #d9d9d9,
            -6px -6px 12px #ffffff;
          border: none;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .nm-white-button:hover {
          box-shadow: 
            8px 8px 16px #d9d9d9,
            -8px -8px 16px #ffffff;
        }

        .nm-white-button:active {
          box-shadow: 
            inset 3px 3px 6px #d9d9d9,
            inset -3px -3px 6px #ffffff;
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
          font-weight: 600;
        }

        .nm-white-button-primary:hover:not(:disabled) {
          box-shadow: 
            10px 10px 20px #d9d9d9,
            -10px -10px 20px #ffffff;
          transform: translateY(-1px);
        }

        .nm-white-button-primary:active:not(:disabled) {
          box-shadow: 
            inset 4px 4px 8px #d9d9d9,
            inset -4px -4px 8px #ffffff;
          transform: translateY(0);
        }

        .nm-white-button-active {
          background: linear-gradient(145deg, #f0f0f0, #ffffff);
          box-shadow: 
            inset 3px 3px 6px #d9d9d9,
            inset -3px -3px 6px #ffffff;
          color: #4a5568;
        }

        .nm-white-button-completed {
          background: linear-gradient(145deg, #10b981, #059669);
          color: white;
          box-shadow: 
            4px 4px 8px #d9d9d9,
            -4px -4px 8px #ffffff;
        }

        .nm-white-button-inactive {
          background: #ffffff;
          box-shadow: 
            inset 2px 2px 4px #e6e6e6,
            inset -2px -2px 4px #ffffff;
          color: #9ca3af;
        }
      `}</style>
    </div>
  )
} 