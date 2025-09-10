'use client'

import React, { useState, useRef, useEffect } from 'react'
import { FaTimes, FaCog, FaLightbulb } from 'react-icons/fa'

interface VoiceSessionModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (sessionData: {
    title: string
    description: string
    type: 'voice_session'
    content: string
    duration: string
    order: number
  }) => void
  moduleTitle: string
}

// Nova Sonic Real Configuration Parameters
const NOVA_SONIC_CONFIG = {
  voices: ['matthew', 'joanna', 'lupe', 'pedro', 'amy', 'brian'],
  styles: ['conversational', 'formal', 'enthusiastic', 'calm', 'friendly'],
  personalities: ['profesional', 'amigable', 'mentor', 'entusiasta', 'paciente'],
  temperatureRange: { min: 0.1, max: 1.0, step: 0.1, default: 0.7 },
  maxTokensRange: { min: 50, max: 4096, step: 50, default: 1024 },
  sessionDurationRange: { min: 1, max: 30, step: 1, default: 5 },
  interactionLevels: ['bajo', 'medio', 'alto', 'muy alto'],
  responseSpeed: ['lento', 'normal', 'rápido'],
  topP: { min: 0.1, max: 1.0, step: 0.1, default: 0.9 },
  topK: { min: 1, max: 500, step: 10, default: 250 }
}

export default function VoiceSessionModal({ 
  isOpen, 
  onClose, 
  onSave, 
  moduleTitle 
}: VoiceSessionModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  
  // Nova Sonic Configuration Parameters
  const [voiceId, setVoiceId] = useState('matthew')
  const [voiceStyle, setVoiceStyle] = useState('conversational')
  const [sessionDuration, setSessionDuration] = useState('5')
  const [interactionLevel, setInteractionLevel] = useState('medium')
  const [temperature, setTemperature] = useState('0.7')
  const [maxTokens, setMaxTokens] = useState('1024')
  const [voicePersonality, setVoicePersonality] = useState('friendly')

  useEffect(() => {
    if (!isOpen) {
      // Reset state when modal closes
      setTitle('')
      setDescription('')
      setVoiceId('matthew')
      setVoiceStyle('conversational')
      setSessionDuration('5')
      setInteractionLevel('medium')
      setTemperature('0.7')
      setMaxTokens('1024')
      setVoicePersonality('friendly')
    }
  }, [isOpen])

  const handleSave = () => {
    if (!title.trim()) {
      alert('Por favor ingresa un título para la sesión')
      return
    }

    const configData = {
      voiceId,
      voiceStyle,
      sessionDuration,
      interactionLevel,
      temperature: parseFloat(temperature),
      maxTokens: parseInt(maxTokens),
      voicePersonality,
      model: 'amazon.nova-sonic-v1:0'
    }

    const sessionData = {
      title: title.trim(),
      description: description.trim(),
      type: 'voice_session' as const,
      content: JSON.stringify(configData),
      duration: `${sessionDuration} min`,
      order: Date.now() // Temporary order
    }

    onSave(sessionData)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4">
      <div className="nm-modal-white w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header - Centered Title Neumorphic */}
        <div className="nm-modal-header p-6">
          <h2 className="nm-modal-title">Nueva Sesión de Voz - Nova Sonic AI</h2>
          <p className="text-sm text-gray-500 text-center mt-1">Módulo: {moduleTitle}</p>
          <button
            onClick={onClose}
            className="nm-close-button"
          >
            <FaTimes />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Título de la Sesión *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="nm-white-input w-full p-3 rounded-lg text-gray-800"
                placeholder="Ej: Conversación sobre Project Management"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="nm-white-input w-full p-3 rounded-lg text-gray-800 resize-none"
                placeholder="Describe brevemente el contenido de esta sesión de voz..."
              />
            </div>
          </div>

          {/* Voice Assistant Configuration */}
          <div className="nm-white-section p-6 rounded-2xl">
            <div className="space-y-6">
              <div className="flex items-center justify-center space-x-3 mb-4">
                <FaCog className="text-gray-600 text-lg" />
                <h3 className="text-lg font-semibold text-gray-800">
                  Configuración Nova Sonic - Parámetros del Modelo
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Nova Sonic Voice ID */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Voz Nova Sonic
                  </label>
                  <select
                    value={voiceId}
                    onChange={(e) => setVoiceId(e.target.value)}
                    className="neuro-input w-full p-3 rounded-lg border-none outline-none text-gray-800"
                  >
                    <option value="matthew">Matthew - Masculina Natural</option>
                    <option value="joanna">Joanna - Femenina Cálida</option>
                    <option value="brian">Brian - Masculina Británica</option>
                    <option value="emma">Emma - Femenina Británica</option>
                    <option value="amy">Amy - Femenina Profesional</option>
                  </select>
                </div>

                {/* Voice Style */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estilo de Conversación
                  </label>
                  <select
                    value={voiceStyle}
                    onChange={(e) => setVoiceStyle(e.target.value)}
                    className="neuro-input w-full p-3 rounded-lg border-none outline-none text-gray-800"
                  >
                    <option value="conversational">Conversacional</option>
                    <option value="formal">Formal</option>
                    <option value="casual">Casual</option>
                    <option value="educational">Educativo</option>
                  </select>
                </div>

                {/* Session Duration */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duración de Sesión (minutos)
                  </label>
                  <select
                    value={sessionDuration}
                    onChange={(e) => setSessionDuration(e.target.value)}
                    className="neuro-input w-full p-3 rounded-lg border-none outline-none text-gray-800"
                  >
                    <option value="3">3 minutos</option>
                    <option value="5">5 minutos</option>
                    <option value="10">10 minutos</option>
                    <option value="15">15 minutos</option>
                    <option value="20">20 minutos</option>
                  </select>
                </div>

                {/* Interaction Level */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nivel de Interacción
                  </label>
                  <select
                    value={interactionLevel}
                    onChange={(e) => setInteractionLevel(e.target.value)}
                    className="neuro-input w-full p-3 rounded-lg border-none outline-none text-gray-800"
                  >
                    <option value="low">Básico - Respuestas cortas</option>
                    <option value="medium">Intermedio - Conversación fluida</option>
                    <option value="high">Avanzado - Interacción profunda</option>
                  </select>
                </div>

                {/* Nova Sonic Temperature */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Creatividad (Temperature)
                  </label>
                  <select
                    value={temperature}
                    onChange={(e) => setTemperature(e.target.value)}
                    className="neuro-input w-full p-3 rounded-lg border-none outline-none text-gray-800"
                  >
                    <option value="0.3">0.3 - Muy Enfocado</option>
                    <option value="0.5">0.5 - Equilibrado</option>
                    <option value="0.7">0.7 - Creativo</option>
                    <option value="0.9">0.9 - Muy Creativo</option>
                  </select>
                </div>

                {/* Max Tokens */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Longitud de Respuesta
                  </label>
                  <select
                    value={maxTokens}
                    onChange={(e) => setMaxTokens(e.target.value)}
                    className="neuro-input w-full p-3 rounded-lg border-none outline-none text-gray-800"
                  >
                    <option value="512">512 - Respuestas Cortas</option>
                    <option value="1024">1024 - Respuestas Medianas</option>
                    <option value="2048">2048 - Respuestas Largas</option>
                  </select>
                </div>

                {/* Voice Personality */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Personalidad del Asistente
                  </label>
                  <select
                    value={voicePersonality}
                    onChange={(e) => setVoicePersonality(e.target.value)}
                    className="neuro-input w-full p-3 rounded-lg border-none outline-none text-gray-800"
                  >
                    <option value="friendly">Amigable</option>
                    <option value="professional">Profesional</option>
                    <option value="encouraging">Motivador</option>
                    <option value="patient">Paciente</option>
                    <option value="enthusiastic">Entusiasta</option>
                  </select>
                </div>
              </div>

              {/* Configuration Tips */}
              <div className="neuro-card p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50">
                <div className="flex items-start space-x-3">
                  <FaLightbulb className="text-[#6366f1] text-lg mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-[#132944] mb-2">Nova Sonic - Consejos de Configuración:</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>• <strong>Matthew:</strong> Voz masculina natural, ideal para explicaciones técnicas</p>
                      <p>• <strong>Temperature 0.7:</strong> Balance perfecto entre coherencia y creatividad</p>
                      <p>• <strong>1024 Tokens:</strong> Respuestas medianas, conversación fluida</p>
                      <p>• <strong>Nova Sonic:</strong> Conversación bidireccional con voz en tiempo real</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-100">
          <button
            onClick={onClose}
            className="nm-white-button px-6 py-3 rounded-lg text-gray-600"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!title.trim()}
            className="nm-white-button-primary px-6 py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Crear Sesión de Voz
          </button>
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

        .nm-close-button:active {
          box-shadow: 
            inset 2px 2px 4px #d9d9d9,
            inset -2px -2px 4px #ffffff;
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

        .nm-white-section {
          background: #ffffff;
          box-shadow: 
            8px 8px 16px #e6e6e6,
            -8px -8px 16px #ffffff;
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
      `}</style>
    </div>
  )
} 