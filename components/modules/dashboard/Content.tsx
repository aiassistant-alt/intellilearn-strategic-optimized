'use client'
import { useState } from 'react'
import Image from 'next/image'
import { FaFile, FaVideo, FaHeadphones, FaQuestionCircle, FaCheck, FaPlay, FaEye, FaUpload, FaSearch, FaFilter } from 'react-icons/fa'

type ContentItem = {
  id: string
  title: string
  type: 'document' | 'video' | 'audio' | 'quiz'
  duration?: string
  thumbnail?: string
  status: 'completed' | 'in-progress' | 'not-started'
  dateCreated: Date
}

type ContentFolder = {
  id: string
  name: string
  items: ContentItem[]
}

const Content = () => {
  const [activeFolder, setActiveFolder] = useState<string>('folder1')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [showUploadModal, setShowUploadModal] = useState(false)
  
  // Datos de muestra
  const contentFolders: ContentFolder[] = [
    {
      id: 'folder1',
      name: 'Introducción al Machine Learning',
      items: [
        {
          id: 'doc1',
          title: 'Fundamentos de aprendizaje automático',
          type: 'document',
          status: 'completed',
          dateCreated: new Date('2023-12-10')
        },
        {
          id: 'vid1',
          title: 'Video: Introducción a algoritmos de ML',
          type: 'video',
          duration: '18:35',
          thumbnail: '/assets/images/Image.svg',
          status: 'completed',
          dateCreated: new Date('2023-12-12')
        },
        {
          id: 'quiz1',
          title: 'Evaluación: Conceptos básicos',
          type: 'quiz',
          status: 'completed',
          dateCreated: new Date('2023-12-15')
        }
      ]
    },
    {
      id: 'folder2',
      name: 'Algoritmos de Machine Learning',
      items: [
        {
          id: 'doc2',
          title: 'Regresión Lineal y Logística',
          type: 'document',
          status: 'in-progress',
          dateCreated: new Date('2024-01-05')
        },
        {
          id: 'aud1',
          title: 'Podcast: Entrevista con experto en ML',
          type: 'audio',
          duration: '45:20',
          status: 'not-started',
          dateCreated: new Date('2024-01-10')
        },
        {
          id: 'vid2',
          title: 'Video: Implementación de regresión',
          type: 'video',
          duration: '24:15',
          thumbnail: '/assets/images/Image.svg',
          status: 'not-started',
          dateCreated: new Date('2024-01-12')
        }
      ]
    },
    {
      id: 'folder3',
      name: 'Deep Learning',
      items: [
        {
          id: 'doc3',
          title: 'Redes neuronales: Fundamentos',
          type: 'document',
          status: 'not-started',
          dateCreated: new Date('2024-02-01')
        },
        {
          id: 'vid3',
          title: 'Video: Construyendo modelos CNN',
          type: 'video',
          duration: '32:40',
          thumbnail: '/assets/images/Image.svg',
          status: 'not-started',
          dateCreated: new Date('2024-02-05')
        }
      ]
    }
  ]
  
  // Obtener los items de la carpeta activa
  const activeItems = contentFolders.find(folder => folder.id === activeFolder)?.items || []
  
  // Filtrar por búsqueda y tipo
  const filteredItems = activeItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = filterType === 'all' || item.type === filterType
    return matchesSearch && matchesType
  })
  
  // Función para renderizar el icono según el tipo de contenido
  const renderTypeIcon = (type: string) => {
    switch (type) {
      case 'document':
        return <FaFile className="text-blue-500" />
      case 'video':
        return <FaVideo className="text-red-500" />
      case 'audio':
        return <FaHeadphones className="text-green-500" />
      case 'quiz':
        return <FaQuestionCircle className="text-yellow-500" />
      default:
        return <FaFile className="text-gray-500" />
    }
  }
  
  // Función para renderizar el indicador de estado
  const renderStatusIndicator = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
            <FaCheck className="mr-1" size={10} /> Completado
          </span>
        )
      case 'in-progress':
        return (
          <span className="inline-flex items-center px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
            <FaPlay className="mr-1" size={10} /> En progreso
          </span>
        )
      case 'not-started':
        return (
          <span className="inline-flex items-center px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
            <FaEye className="mr-1" size={10} /> No iniciado
          </span>
        )
      default:
        return null
    }
  }
  
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Contenido</h1>
        <p className="text-gray-600">Gestiona y organiza el material de estudio de tus cursos</p>
      </div>
      
      {/* Grid de carpetas y contenido */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Panel lateral de carpetas */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="font-semibold text-gray-800 mb-4">Carpetas de contenido</h3>
            <ul className="space-y-2">
              {contentFolders.map(folder => (
                <li key={folder.id}>
                  <button
                    onClick={() => setActiveFolder(folder.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      activeFolder === folder.id
                        ? 'bg-purple-100 text-purple-700'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center">
                      <span className="flex-grow truncate">{folder.name}</span>
                      <span className="text-xs text-gray-500 ml-2">{folder.items.length}</span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
            
            <button className="w-full mt-4 px-3 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
              + Nueva carpeta
            </button>
          </div>
        </div>
        
        {/* Contenido principal */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow-md p-6">
            {/* Cabecera con título y acciones */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 sm:mb-0">
                {contentFolders.find(folder => folder.id === activeFolder)?.name || 'Contenido'}
              </h2>
              <div className="flex flex-col sm:flex-row gap-3">
                <button 
                  onClick={() => setShowUploadModal(true)}
                  className="flex items-center justify-center px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <FaUpload className="mr-2" /> Subir contenido
                </button>
              </div>
            </div>
            
            {/* Filtros y búsqueda */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-grow relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaSearch className="text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Buscar contenido..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div className="flex items-center">
                <FaFilter className="text-gray-400 mr-2" />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="all">Todos los tipos</option>
                  <option value="document">Documentos</option>
                  <option value="video">Videos</option>
                  <option value="audio">Audio</option>
                  <option value="quiz">Cuestionarios</option>
                </select>
              </div>
            </div>
            
            {/* Lista de contenido */}
            {filteredItems.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contenido
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tipo
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha
                      </th>
                      <th scope="col" className="relative px-6 py-3">
                        <span className="sr-only">Acciones</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredItems.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center">
                              {item.thumbnail ? (
                                <Image
                                  src={item.thumbnail}
                                  alt={item.title}
                                  width={40}
                                  height={40}
                                  className="rounded-lg"
                                />
                              ) : (
                                <div className="text-xl">{renderTypeIcon(item.type)}</div>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{item.title}</div>
                              {item.duration && <div className="text-xs text-gray-500">{item.duration}</div>}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-500">
                            <span className="mr-2">{renderTypeIcon(item.type)}</span>
                            <span className="capitalize">{item.type}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {renderStatusIndicator(item.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.dateCreated.toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button className="text-purple-600 hover:text-purple-900">
                            Ver
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-10">
                <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <FaSearch className="text-gray-400 text-xl" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">No se encontraron resultados</h3>
                <p className="text-gray-500">Intenta con otros términos de búsqueda o criterios de filtro</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Modal de carga de contenido (oculto por defecto) */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Subir nuevo contenido</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                  <input 
                    type="text" 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Nombre del contenido"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de contenido</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                    <option value="document">Documento</option>
                    <option value="video">Video</option>
                    <option value="audio">Audio</option>
                    <option value="quiz">Cuestionario</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Archivo</label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
                    <div className="space-y-1 text-center">
                      <FaUpload className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="flex text-sm text-gray-600">
                        <label className="relative cursor-pointer bg-white rounded-md font-medium text-purple-600 hover:text-purple-500">
                          <span>Subir archivo</span>
                          <input type="file" className="sr-only" />
                        </label>
                        <p className="pl-1">o arrastra y suelta</p>
                      </div>
                      <p className="text-xs text-gray-500">
                        PDF, DOC, MP4, MP3 hasta 50MB
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse rounded-b-lg">
              <button
                type="button"
                className="w-full sm:w-auto sm:ml-3 inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-purple-600 text-base font-medium text-white hover:bg-purple-700 focus:outline-none sm:text-sm"
              >
                Subir
              </button>
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="mt-3 w-full sm:mt-0 sm:w-auto inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:text-sm"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Content