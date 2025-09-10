'use client'

import React, { useState } from 'react'
import { FaTimes, FaRobot, FaMagic, FaSpinner } from 'react-icons/fa'

interface AIGenerateIndexModalProps {
    isOpen: boolean
    onClose: () => void
    onGenerate: (content: string) => Promise<void>
    courseId: string
}

export default function AIGenerateIndexModal({ 
    isOpen, 
    onClose, 
    onGenerate,
    courseId 
}: AIGenerateIndexModalProps) {
    const [content, setContent] = useState('')
    const [isGenerating, setIsGenerating] = useState(false)

    const handleGenerate = async () => {
        if (!content.trim()) {
            alert('Por favor, ingresa el contenido del índice')
            return
        }

        setIsGenerating(true)
        try {
            await onGenerate(content)
            setContent('')
            onClose()
        } catch (error) {
            console.error('Error generando índice:', error)
            alert('Error al generar el índice. Inténtalo de nuevo.')
        } finally {
            setIsGenerating(false)
        }
    }

    const handleClose = () => {
        if (!isGenerating) {
            setContent('')
            onClose()
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-[#3C31A3] to-[#4A3FB8]">
                    <div className="flex items-center space-x-3">
                        <div className="neuro-container w-12 h-12 rounded-xl flex items-center justify-center bg-white/20">
                            <FaRobot className="text-white text-xl" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">AI Generate Index</h2>
                            <p className="text-white/80 text-sm">Genera automáticamente módulos y lecciones</p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        disabled={isGenerating}
                        className="text-white/80 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-all duration-300 disabled:opacity-50"
                    >
                        <FaTimes />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
                    <div className="space-y-6">
                        {/* Instructions */}
                        <div className="neuro-container rounded-xl p-4 bg-blue-50 border border-blue-200">
                            <div className="flex items-start space-x-3">
                                <FaMagic className="text-[#3C31A3] mt-1 flex-shrink-0" />
                                <div>
                                    <h3 className="font-semibold text-[#132944] mb-2">¿Cómo funciona?</h3>
                                    <p className="text-gray-700 text-sm leading-relaxed">
                                        Pega el índice de tu curso en el formato de texto plano y la IA lo organizará automáticamente 
                                        en módulos y lecciones estructuradas. El sistema creará el JSON necesario y guardará 
                                        todo en la base de datos.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Example */}
                        <div className="neuro-inset rounded-xl p-4">
                            <h4 className="font-medium text-[#132944] mb-3">Ejemplo de formato:</h4>
                            <div className="text-sm text-gray-600 font-mono bg-gray-50 p-3 rounded-lg leading-relaxed">
                                <div className="text-[#3C31A3] font-semibold">MÓDULO 1: Fundamentos de la Dirección de Proyectos</div>
                                <div className="ml-2 mt-1">Lección 1.1: Introducción</div>
                                <div className="ml-2 text-gray-500">Se presenta qué es un proyecto...</div>
                                <div className="ml-2 mt-2">Lección 1.2: Conceptos Generales</div>
                                <div className="ml-2 text-gray-500">Se explican los elementos clave...</div>
                                <div className="mt-3 text-[#3C31A3] font-semibold">MÓDULO 2: Inicio del Proyecto</div>
                                <div className="ml-2 mt-1">Lección 2.1: Justificación del Proyecto</div>
                                <div className="ml-2 text-gray-500">Se desarrolla el análisis...</div>
                            </div>
                        </div>

                        {/* Input Area */}
                        <div>
                            <label className="block text-gray-700 font-medium mb-3">
                                Contenido del Índice *
                                <span className="text-gray-500 text-sm font-normal ml-2">
                                    (Pega aquí el índice de tu curso)
                                </span>
                            </label>
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="MÓDULO 1: Fundamentos de la Dirección de Proyectos
Lección 1.1: Introducción
Se presenta qué es un proyecto, su propósito dentro de una organización...

Lección 1.2: Conceptos Generales
Se explican los elementos clave como alcance, cronograma...

MÓDULO 2: Inicio del Proyecto
Lección 2.1: Justificación del Proyecto
Se desarrolla el análisis de necesidades..."
                                rows={15}
                                disabled={isGenerating}
                                className="w-full neuro-inset px-4 py-3 rounded-lg text-[#132944] bg-transparent border-none outline-none focus:ring-2 focus:ring-[#3C31A3] resize-none font-mono text-sm disabled:opacity-50"
                            />
                            <div className="flex justify-between items-center mt-2">
                                <p className="text-gray-500 text-sm">
                                    Caracteres: {content.length}
                                </p>
                                <p className="text-gray-500 text-sm">
                                    Líneas: {content.split('\n').length}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
                    <button
                        onClick={handleClose}
                        disabled={isGenerating}
                        className="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium rounded-lg hover:bg-gray-100 transition-all duration-300 disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleGenerate}
                        disabled={isGenerating || !content.trim()}
                        className="px-6 py-2 bg-gradient-to-r from-[#3C31A3] to-[#4A3FB8] text-white font-medium rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:transform-none disabled:hover:shadow-none flex items-center space-x-2"
                    >
                        {isGenerating ? (
                            <>
                                <FaSpinner className="animate-spin" />
                                <span>Generando...</span>
                            </>
                        ) : (
                            <>
                                <FaRobot />
                                <span>Generar con IA</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
} 