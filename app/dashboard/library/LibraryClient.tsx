/**
 * ^LibraryClient
 * Author: Luis Arturo Parra - Telmo AI
 * Created: 2025-09-11
 * Usage: Client component for educational resources library management
 * Business Context: Admin interface for managing educational content, documents, and resources
 * Relations: Connected to Video Library, course content, and file management systems
 * Reminders: Only accessible in admin mode, includes upload and organization features
 */

'use client'

import React, { useState } from 'react'
import { FiDatabase, FiFolder, FiFileText, FiImage, FiVideo, FiMusic, FiUpload, FiSearch, FiFilter, FiGrid, FiList } from 'react-icons/fi'

export default function LibraryClient() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedCategory, setSelectedCategory] = useState('documents')

  const categories = [
    { id: 'documents', label: 'Documentos', icon: <FiFileText />, count: 89 },
    { id: 'images', label: 'Imágenes', icon: <FiImage />, count: 134 },
    { id: 'videos', label: 'Videos', icon: <FiVideo />, count: 18 },
  ]

  const libraryItems = [
    {
      id: '1',
      name: 'Curso de Python Básico.pdf',
      type: 'document',
      size: '2.4 MB',
      modified: '2025-09-10',
      category: 'Programación'
    },
    {
      id: '2',
      name: 'Diagrama UML - Sistema.png',
      type: 'image',
      size: '834 KB',
      modified: '2025-09-09',
      category: 'Diseño'
    },
    {
      id: '3',
      name: 'Introducción Machine Learning.mp4',
      type: 'video',
      size: '45.2 MB',
      modified: '2025-09-08',
      category: 'IA & ML'
    },
    {
      id: '4',
      name: 'Ejercicios JavaScript.pdf',
      type: 'document',
      size: '1.8 MB',
      modified: '2025-09-07',
      category: 'Programación'
    },
    {
      id: '5',
      name: 'Presentación React.pptx',
      type: 'document',
      size: '5.6 MB',
      modified: '2025-09-06',
      category: 'Frameworks'
    },
    {
      id: '6',
      name: 'Base de Datos NoSQL.pdf',
      type: 'document',
      size: '3.2 MB',
      modified: '2025-09-05',
      category: 'Base de Datos'
    }
  ]

  const filteredItems = libraryItems.filter(item => {
    if (selectedCategory === 'documents') return item.type === 'document'
    if (selectedCategory === 'images') return item.type === 'image'
    if (selectedCategory === 'videos') return item.type === 'video'
    return item.type === 'document' // default to documents
  })

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'document': return <FiFileText className="text-blue-500" />
      case 'image': return <FiImage className="text-green-500" />
      case 'video': return <FiVideo className="text-purple-500" />
      case 'audio': return <FiMusic className="text-orange-500" />
      default: return <FiFileText className="text-gray-500" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Library</h1>
          <p className="text-gray-600">Gestiona todos los recursos educativos y materiales de aprendizaje</p>
        </div>
        
        {/* Upload Button */}
        <button className="nm-white-button-primary px-6 py-3 rounded-xl flex items-center space-x-2 hover:scale-105 transition-transform duration-200">
          <FiUpload />
          <span>Subir Archivo</span>
        </button>
      </div>

      {/* Categories - Solo 3 Cards Neumórficas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`nm-white-card p-6 rounded-xl text-left hover:scale-105 transition-transform duration-200 ${
              selectedCategory === category.id ? 'ring-2 ring-purple-400' : ''
            }`}
          >
            <div className="flex items-center space-x-4 mb-4">
              <div className="p-3 rounded-xl bg-gray-100">
                {category.icon}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">{category.label}</h3>
                <p className="text-3xl font-bold text-purple-600">{category.count}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Search and Controls */}
      <div className="nm-white-card p-4 rounded-xl">
        <div className="flex items-center justify-between space-x-4">
          {/* Search Bar */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar archivos..."
                className="nm-input pl-10 w-full"
              />
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center space-x-2">
            {/* Filter Button */}
            <button className="nm-white-button px-3 py-2 rounded-lg flex items-center space-x-2">
              <FiFilter />
              <span>Filtrar</span>
            </button>

            {/* View Mode Toggle */}
            <div className="flex rounded-lg border border-gray-200 overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 text-sm flex items-center space-x-2 transition-colors duration-200 ${
                  viewMode === 'grid' 
                    ? 'bg-purple-100 text-purple-700' 
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                <FiGrid />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 text-sm flex items-center space-x-2 transition-colors duration-200 ${
                  viewMode === 'list' 
                    ? 'bg-purple-100 text-purple-700' 
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                <FiList />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Library Content */}
      <div className="nm-white-card p-6 rounded-xl">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          {categories.find(c => c.id === selectedCategory)?.label}
          <span className="text-gray-500 font-normal ml-2">({filteredItems.length} elementos)</span>
        </h2>

        {viewMode === 'grid' ? (
          /* Grid View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredItems.map((item) => (
              <div key={item.id} className="nm-white-card p-4 rounded-xl hover:scale-105 transition-transform duration-200 group">
                <div className="flex items-start space-x-3">
                  <div className="p-3 rounded-lg bg-gray-50">
                    {getFileIcon(item.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-800 truncate group-hover:text-purple-600 transition-colors duration-200">
                      {item.name}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">{item.category}</p>
                    <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                      <span>{item.size}</span>
                      <span>{item.modified}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* List View */
          <div className="space-y-2">
            {/* Header */}
            <div className="grid grid-cols-12 gap-4 px-4 py-2 text-sm font-medium text-gray-500 border-b border-gray-200">
              <div className="col-span-6">Nombre</div>
              <div className="col-span-2">Categoría</div>
              <div className="col-span-2">Tamaño</div>
              <div className="col-span-2">Modificado</div>
            </div>
            
            {/* Items */}
            {filteredItems.map((item) => (
              <div key={item.id} className="grid grid-cols-12 gap-4 px-4 py-3 hover:bg-gray-50 rounded-lg transition-colors duration-200 group">
                <div className="col-span-6 flex items-center space-x-3">
                  {getFileIcon(item.type)}
                  <span className="font-medium text-gray-800 group-hover:text-purple-600 transition-colors duration-200">
                    {item.name}
                  </span>
                </div>
                <div className="col-span-2 text-gray-600">{item.category}</div>
                <div className="col-span-2 text-gray-600">{item.size}</div>
                <div className="col-span-2 text-gray-500">{item.modified}</div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {filteredItems.length === 0 && (
          <div className="text-center py-12">
            <FiFolder className="text-gray-300 text-6xl mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-600 mb-2">No hay archivos</h3>
            <p className="text-gray-500">No se encontraron archivos en esta categoría</p>
          </div>
        )}
      </div>
    </div>
  )
}
