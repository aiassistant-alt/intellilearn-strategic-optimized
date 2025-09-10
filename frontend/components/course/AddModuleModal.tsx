'use client'

import { useState } from 'react'
import { FaBook, FaArrowRight, FaArrowLeft, FaSave, FaCheck } from 'react-icons/fa'
import NeumorphicModal from '@/components/common/NeumorphicModal'

interface AddModuleModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (moduleData: { title: string; description: string; order: number }) => Promise<void>
  moduleCount: number
}

enum Step {
  BASIC_INFO = 'basic_info',
  DETAILS = 'details',
  CONFIRMATION = 'confirmation'
}

export default function AddModuleModal({ isOpen, onClose, onSave, moduleCount }: AddModuleModalProps) {
  const [currentStep, setCurrentStep] = useState<Step>(Step.BASIC_INFO)
  const [loading, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    order: moduleCount + 1
  })

  const handleClose = () => {
    setCurrentStep(Step.BASIC_INFO)
    setFormData({
      title: '',
      description: '',
      order: moduleCount + 1
    })
    onClose()
  }

  const handleNext = () => {
    if (currentStep === Step.BASIC_INFO) {
      setCurrentStep(Step.DETAILS)
    } else if (currentStep === Step.DETAILS) {
      setCurrentStep(Step.CONFIRMATION)
    }
  }

  const handleBack = () => {
    if (currentStep === Step.DETAILS) {
      setCurrentStep(Step.BASIC_INFO)
    } else if (currentStep === Step.CONFIRMATION) {
      setCurrentStep(Step.DETAILS)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      await onSave(formData)
      handleClose()
    } catch (error) {
      console.error('Error saving module:', error)
    } finally {
      setSaving(false)
    }
  }

  const isStepValid = () => {
    switch (currentStep) {
      case Step.BASIC_INFO:
        return formData.title.trim().length > 0
      case Step.DETAILS:
        return formData.description.trim().length > 0
      case Step.CONFIRMATION:
        return true
      default:
        return false
    }
  }

  const getStepTitle = () => {
    switch (currentStep) {
      case Step.BASIC_INFO:
        return 'Información Básica del Módulo'
      case Step.DETAILS:
        return 'Detalles del Módulo'
      case Step.CONFIRMATION:
        return 'Confirmar Nuevo Módulo'
      default:
        return 'Agregar Módulo'
    }
  }

  return (
    <NeumorphicModal
      isOpen={isOpen}
      onClose={handleClose}
      title={getStepTitle()}
      maxWidth="max-w-3xl"
    >
      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-center space-x-4">
          <div className={`flex items-center space-x-2 ${currentStep === Step.BASIC_INFO ? 'text-[#3C31A3]' : currentStep === Step.DETAILS || currentStep === Step.CONFIRMATION ? 'text-green-500' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === Step.BASIC_INFO ? 'neuro-button-primary text-white' : currentStep === Step.DETAILS || currentStep === Step.CONFIRMATION ? 'bg-green-500 text-white' : 'neuro-inset text-gray-400'}`}>
              {currentStep === Step.DETAILS || currentStep === Step.CONFIRMATION ? <FaCheck /> : '1'}
            </div>
            <span className="font-medium">Información</span>
          </div>
          
          <div className={`w-12 h-0.5 ${currentStep === Step.DETAILS || currentStep === Step.CONFIRMATION ? 'bg-green-500' : 'bg-gray-300'}`} />
          
          <div className={`flex items-center space-x-2 ${currentStep === Step.DETAILS ? 'text-[#3C31A3]' : currentStep === Step.CONFIRMATION ? 'text-green-500' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === Step.DETAILS ? 'neuro-button-primary text-white' : currentStep === Step.CONFIRMATION ? 'bg-green-500 text-white' : 'neuro-inset text-gray-400'}`}>
              {currentStep === Step.CONFIRMATION ? <FaCheck /> : '2'}
            </div>
            <span className="font-medium">Detalles</span>
          </div>
          
          <div className={`w-12 h-0.5 ${currentStep === Step.CONFIRMATION ? 'bg-green-500' : 'bg-gray-300'}`} />
          
          <div className={`flex items-center space-x-2 ${currentStep === Step.CONFIRMATION ? 'text-[#3C31A3]' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === Step.CONFIRMATION ? 'neuro-button-primary text-white' : 'neuro-inset text-gray-400'}`}>
              3
            </div>
            <span className="font-medium">Confirmar</span>
          </div>
        </div>
      </div>

      {/* Step Content */}
      <div className="min-h-[300px]">
        {currentStep === Step.BASIC_INFO && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="neuro-container w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FaBook className="text-2xl text-[#3C31A3]" />
              </div>
              <p className="text-gray-600">Comencemos con la información básica del módulo</p>
            </div>
            
            <div>
              <label className="block text-gray-700 font-medium mb-3">Título del Módulo *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Ej: Introducción al Project Management"
                className="w-full neuro-inset px-4 py-3 rounded-lg text-[#132944] bg-transparent border-none outline-none focus:ring-2 focus:ring-[#3C31A3] text-lg"
                autoFocus
              />
            </div>
            
            <div>
              <label className="block text-gray-700 font-medium mb-3">Orden del Módulo</label>
              <div className="neuro-inset rounded-lg p-4">
                <p className="text-gray-600 text-sm mb-2">Este módulo será el número:</p>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData(prev => ({ ...prev, order: parseInt(e.target.value) || 1 }))}
                    min="1"
                    className="neuro-inset px-3 py-2 rounded w-20 text-center text-[#132944] bg-transparent border-none outline-none focus:ring-2 focus:ring-[#3C31A3]"
                  />
                  <span className="text-gray-600">en el curso</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentStep === Step.DETAILS && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="neuro-container w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FaBook className="text-2xl text-[#3C31A3]" />
              </div>
              <p className="text-gray-600">Agrega una descripción detallada del módulo</p>
            </div>
            
            <div>
              <label className="block text-gray-700 font-medium mb-3">Descripción del Módulo *</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe los objetivos, contenido y lo que los estudiantes aprenderán en este módulo..."
                rows={6}
                className="w-full neuro-inset px-4 py-3 rounded-lg text-[#132944] bg-transparent border-none outline-none focus:ring-2 focus:ring-[#3C31A3] resize-none"
              />
              <p className="text-gray-500 text-sm mt-2">
                Caracteres: {formData.description.length} (mínimo 10 recomendado)
              </p>
            </div>
            
            <div className="neuro-inset rounded-lg p-4">
              <h4 className="font-medium text-[#132944] mb-2">💡 Consejos para una buena descripción:</h4>
              <ul className="text-gray-600 text-sm space-y-1">
                <li>• Explica claramente los objetivos de aprendizaje</li>
                <li>• Menciona los temas principales que se cubrirán</li>
                <li>• Indica el nivel de dificultad esperado</li>
                <li>• Incluye cualquier prerrequisito importante</li>
              </ul>
            </div>
          </div>
        )}

        {currentStep === Step.CONFIRMATION && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="neuro-container w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FaCheck className="text-2xl text-green-500" />
              </div>
              <p className="text-gray-600">Revisa la información antes de crear el módulo</p>
            </div>
            
            <div className="neuro-container rounded-xl p-6">
              <h3 className="text-xl font-bold text-[#132944] mb-4">Resumen del Módulo</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-gray-500 text-sm font-medium">Título:</label>
                  <p className="text-[#132944] font-medium text-lg">{formData.title}</p>
                </div>
                
                <div>
                  <label className="text-gray-500 text-sm font-medium">Orden:</label>
                  <p className="text-[#132944]">Módulo #{formData.order}</p>
                </div>
                
                <div>
                  <label className="text-gray-500 text-sm font-medium">Descripción:</label>
                  <p className="text-gray-700 leading-relaxed">{formData.description}</p>
                </div>
              </div>
            </div>
            
            <div className="neuro-inset rounded-lg p-4">
              <p className="text-gray-600 text-sm">
                <strong>Nota:</strong> Una vez creado el módulo, podrás agregar lecciones y contenido adicional desde la vista principal del curso.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
        <div>
          {currentStep !== Step.BASIC_INFO && (
            <button
              onClick={handleBack}
              className="neuro-button px-6 py-3 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center space-x-2 transition-all duration-300"
            >
              <FaArrowLeft />
              <span>Anterior</span>
            </button>
          )}
        </div>
        
        <div className="flex space-x-4">
          <button
            onClick={handleClose}
            className="neuro-button px-6 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-all duration-300"
          >
            Cancelar
          </button>
          
          {currentStep === Step.CONFIRMATION ? (
            <button
              onClick={handleSave}
              disabled={loading}
              className="neuro-button-primary px-6 py-3 rounded-lg text-white flex items-center space-x-2 transition-all duration-300 disabled:opacity-50"
            >
              <FaSave />
              <span>{loading ? 'Creando...' : 'Crear Módulo'}</span>
            </button>
          ) : (
            <button
              onClick={handleNext}
              disabled={!isStepValid()}
              className="neuro-button-primary px-6 py-3 rounded-lg text-white flex items-center space-x-2 transition-all duration-300 disabled:opacity-50"
            >
              <span>Siguiente</span>
              <FaArrowRight />
            </button>
          )}
        </div>
      </div>
    </NeumorphicModal>
  )
} 