'use client'

import { ReactNode } from 'react'
import { FaTimes } from 'react-icons/fa'

interface NeumorphicModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
  maxWidth?: string
}

export default function NeumorphicModal({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  maxWidth = 'max-w-2xl' 
}: NeumorphicModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`neuro-container rounded-2xl ${maxWidth} w-full max-h-[90vh] overflow-hidden animate-scale-in`}>
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-white to-gray-50">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-[#132944]">{title}</h2>
            <button
              onClick={onClose}
              className="neuro-button p-2 rounded-lg hover:bg-gray-50 transition-all duration-300 group"
            >
              <FaTimes className="text-gray-600 group-hover:text-red-500 transition-colors" />
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {children}
        </div>
      </div>
    </div>
  )
}

// Agregar animación CSS
const styles = `
  @keyframes scale-in {
    from {
      opacity: 0;
      transform: scale(0.9);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
  
  .animate-scale-in {
    animation: scale-in 0.2s ease-out;
  }
`

// Inyectar estilos globalmente
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style')
  styleSheet.textContent = styles
  document.head.appendChild(styleSheet)
} 