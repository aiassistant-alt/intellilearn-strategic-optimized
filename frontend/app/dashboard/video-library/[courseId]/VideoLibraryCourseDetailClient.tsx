/**
 * ^VideoLibraryCourseDetailClient
 * Author: Luis Arturo Parra - Telmo AI
 * Created: 2025-09-11
 * Usage: Client component for detailed video course episode view with grid/list toggle
 * Business Context: Interactive video browser with state management
 * Relations: Used by VideoLibraryCourseDetailPage server component
 * Reminders: Handles all client-side interactions for video browsing
 */

'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FiVideo, FiGrid, FiList, FiArrowLeft, FiPlay, FiClock, FiDownload, FiShare2, FiLoader, FiUpload, FiCheckSquare, FiSquare, FiCheck, FiX } from 'react-icons/fi'
import { VideoContentService } from '../../../../lib/services/videoContentService'

interface VideoData {
  id: string
  title: string
  description: string
  duration: string
  size: string
  thumbnail: string
  url: string
  previewUrl: string
}

interface CourseVideoData {
  title: string
  description: string
  totalEpisodes: number
  videos: VideoData[]
}

interface VideoLibraryCourseDetailClientProps {
  courseId: string
}

export default function VideoLibraryCourseDetailClient({ courseId }: VideoLibraryCourseDetailClientProps) {
  const router = useRouter()
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [focusMode, setFocusMode] = useState(false)
  const [currentVideo, setCurrentVideo] = useState<VideoData | null>(null)
  const [courseData, setCourseData] = useState<CourseVideoData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedVideos, setSelectedVideos] = useState<Set<string>>(new Set())
  const [selectMode, setSelectMode] = useState(false)
  
  // Load video data with presigned URLs
  useEffect(() => {
    const loadVideoData = async () => {
      try {
        setLoading(true)
        setError(null)
        console.log('📹 [VideoLibrary] Loading video data for course:', courseId)
        
        const videoService = new VideoContentService()
        const data = await videoService.getCourseVideoData(courseId)
        
        console.log('✅ [VideoLibrary] Video data loaded successfully:', data)
        setCourseData(data)
      } catch (error) {
        console.error('❌ [VideoLibrary] Failed to load video data:', error)
        setError('Error al cargar los videos. Por favor, intenta de nuevo.')
      } finally {
        setLoading(false)
      }
    }

    loadVideoData()
  }, [courseId])
  
  const handleVideoPlay = (video: VideoData) => {
    console.log('Playing video:', video.title)
    setCurrentVideo(video)
    setFocusMode(true)
  }
  
  const handleCloseFocusMode = () => {
    setFocusMode(false)
    setCurrentVideo(null)
  }
  
  const handleVideoDownload = (video: VideoData) => {
    console.log('Downloading video:', video.title)
    // Here you would implement download logic
  }
  
  const handleVideoShare = (video: VideoData) => {
    console.log('Sharing video:', video.title)
    // Here you would implement share logic
  }

  const handleVideoSelect = (videoId: string) => {
    const newSelected = new Set(selectedVideos)
    if (newSelected.has(videoId)) {
      newSelected.delete(videoId)
    } else {
      newSelected.add(videoId)
    }
    setSelectedVideos(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedVideos.size === courseData?.videos.length) {
      setSelectedVideos(new Set())
    } else {
      setSelectedVideos(new Set(courseData?.videos.map(v => v.id) || []))
    }
  }

  const handleUpload = () => {
    console.log('📁 [VideoLibrary] Opening upload dialog...')
    // Implementar funcionalidad de upload
  }

  // ESC key handler for focus mode
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && focusMode) {
        handleCloseFocusMode()
      }
    }

    if (focusMode) {
      document.addEventListener('keydown', handleKeyPress)
      // Prevent body scroll when in focus mode
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleKeyPress)
      document.body.style.overflow = 'unset'
    }
  }, [focusMode])

  // Focus Mode - Neomorphic Video Modal
  if (focusMode && currentVideo) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(10px)'
      }}>
        {/* Neomorphic Modal */}
        <div className="relative w-full max-w-5xl mx-auto nm-white-card rounded-3xl p-8 shadow-2xl">
          {/* Close Button */}
          <button
            onClick={handleCloseFocusMode}
            className="absolute top-4 right-4 w-12 h-12 nm-white-button rounded-full flex items-center justify-center hover:scale-105 transition-transform duration-200 z-10"
          >
            <FiArrowLeft className="text-gray-600 text-lg rotate-180" />
          </button>
          
          {/* Neomorphic Title */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 nm-white-text-shadow mb-2">
              {currentVideo.title}
            </h2>
            <p className="text-gray-600 text-sm">{currentVideo.description}</p>
            <div className="flex items-center justify-center space-x-4 mt-3">
              <div className="flex items-center space-x-1 text-gray-500">
                <FiClock className="text-sm" />
                <span className="text-sm">{currentVideo.duration}</span>
              </div>
              <span className="text-gray-300">•</span>
              <div className="text-sm text-gray-500">{currentVideo.size}</div>
            </div>
          </div>
          
          {/* Video Container */}
          <div className="relative rounded-2xl overflow-hidden nm-inset-card p-2">
            <video
              key={currentVideo.id}
              controls
              autoPlay
              className="w-full rounded-xl"
              style={{ 
                maxHeight: '70vh',
                aspectRatio: '16/9'
              }}
              src={currentVideo.url}
            >
              Tu navegador no soporta la reproducción de videos.
            </video>
          </div>
          
          {/* Action Buttons */}
          <div className="flex justify-center space-x-4 mt-6">
            <button className="nm-white-button px-6 py-3 rounded-xl flex items-center space-x-2 hover:scale-105 transition-transform duration-200">
              <FiDownload />
              <span>Descargar</span>
            </button>
            <button className="nm-white-button px-6 py-3 rounded-xl flex items-center space-x-2 hover:scale-105 transition-transform duration-200">
              <FiShare2 />
              <span>Compartir</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="nm-white-icon-large w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <FiLoader className="text-4xl text-purple-600 animate-spin" />
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Cargando videos...</h3>
          <p className="text-gray-600">Generando URLs de acceso seguro</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="nm-white-icon-large w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <FiVideo className="text-4xl text-red-500" />
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Error al cargar videos</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="nm-white-button-primary px-6 py-3 rounded-xl hover:scale-105 transition-transform duration-200"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  // No course data
  if (!courseData) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="nm-white-icon-large w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <FiVideo className="text-4xl text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Curso no encontrado</h3>
          <p className="text-gray-600">Este curso no existe o no está disponible</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <button
            onClick={() => router.back()}
            className="nm-white-button p-2 rounded-lg mr-4 flex items-center justify-center hover:scale-105 transition-transform duration-200"
          >
            <FiArrowLeft className="text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-800 page-title">{courseData.title}</h1>
            <p className="text-gray-600">{courseData.description}</p>
          </div>
        </div>
        
        {/* Course Stats */}
        <div className="flex items-center space-x-6 mb-6">
          <div className="flex items-center space-x-2">
            <FiVideo className="text-purple-500" />
            <span className="text-gray-700 font-medium">{courseData.totalEpisodes} episodios</span>
          </div>
          {courseData.totalEpisodes > 0 && (
            <div className="flex items-center space-x-2">
              <FiClock className="text-blue-500" />
              <span className="text-gray-700">Serie completa</span>
            </div>
          )}
        </div>
        
        {/* View Controls */}
        {courseData.videos.length > 0 && (
          <div className="flex items-center justify-between">
            {/* Left Side - View Mode Toggle */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-gray-600 text-sm font-medium">Vista:</span>
                <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`px-4 py-2 text-sm flex items-center space-x-2 transition-colors duration-200 ${
                      viewMode === 'grid' 
                        ? 'bg-purple-100 text-purple-700' 
                        : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <FiGrid />
                    <span>Mosaico</span>
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`px-4 py-2 text-sm flex items-center space-x-2 transition-colors duration-200 ${
                      viewMode === 'list' 
                        ? 'bg-purple-100 text-purple-700' 
                        : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <FiList />
                    <span>Lista</span>
                  </button>
                </div>
              </div>

              {/* Upload Button */}
              <button
                onClick={handleUpload}
                className="nm-white-button px-4 py-2 text-sm flex items-center space-x-2 hover:scale-105 transition-transform duration-200"
              >
                <FiUpload />
                <span>Subir</span>
              </button>
            </div>

            {/* Right Side - Selection Controls */}
            <div className="flex items-center space-x-2">
              {selectMode && (
                <>
                  <span className="text-sm text-gray-600">
                    {selectedVideos.size} seleccionados
                  </span>
                  <button
                    onClick={handleSelectAll}
                    className="nm-white-button px-3 py-2 text-sm flex items-center space-x-2 hover:scale-105 transition-transform duration-200"
                  >
                    <FiCheck />
                    <span>Todos</span>
                  </button>
                </>
              )}
              <button
                onClick={() => {
                  setSelectMode(!selectMode)
                  if (selectMode) setSelectedVideos(new Set())
                }}
                className={`px-4 py-2 text-sm flex items-center space-x-2 rounded-lg transition-colors duration-200 ${
                  selectMode 
                    ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                    : 'nm-white-button hover:scale-105 transition-transform duration-200'
                }`}
              >
                <FiCheckSquare />
                <span>{selectMode ? 'Cancelar' : 'Seleccionar'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Videos Content */}
      {courseData.videos.length > 0 ? (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'grid grid-cols-1 md:grid-cols-2 gap-6'}>
          {courseData.videos.map((video: VideoData, index: number) => (
            <div
              key={video.id}
              className={`nm-white-card rounded-2xl overflow-hidden hover:scale-105 transition-transform duration-300 group relative ${
                viewMode === 'list' ? 'flex items-center p-4' : 'p-6'
              } ${selectedVideos.has(video.id) ? 'ring-2 ring-blue-400' : ''}`}
            >
              {/* Selection Checkbox */}
              {selectMode && (
                <div className="absolute top-3 right-3 z-10">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleVideoSelect(video.id)
                    }}
                    className="w-6 h-6 rounded-md border-2 border-gray-300 bg-white flex items-center justify-center hover:border-blue-400 transition-colors duration-200"
                  >
                    {selectedVideos.has(video.id) && (
                      <FiCheck className="text-blue-600 text-sm" />
                    )}
                  </button>
                </div>
              )}
              {/* Video Thumbnail */}
              <div className={`relative ${viewMode === 'list' ? 'w-32 h-20 flex-shrink-0 mr-4' : 'w-full h-48 mb-4'} bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg overflow-hidden`}>
                {/* Miniatura de video real */}
                <div className="relative w-full h-full bg-gray-900 rounded-lg overflow-hidden">
                  <video
                    src={video.url}
                    className="w-full h-full object-cover"
                    preload="metadata"
                    muted
                    poster="/assets/images/video-thumbnail.jpg"
                    playsInline
                    controls={false}
                    onLoadedData={(e) => {
                      // Capturar frame del video como miniatura (segundo 2)
                      const videoElement = e.currentTarget as HTMLVideoElement;
                      if (videoElement.duration > 2) {
                        videoElement.currentTime = 2;
                        // Crear canvas para capturar frame
                        setTimeout(() => {
                          const canvas = document.createElement('canvas');
                          const ctx = canvas.getContext('2d');
                          if (ctx) {
                            canvas.width = videoElement.videoWidth;
                            canvas.height = videoElement.videoHeight;
                            ctx.drawImage(videoElement, 0, 0);
                            const dataURL = canvas.toDataURL('image/jpeg', 0.8);
                            // Usar como poster
                            videoElement.poster = dataURL;
                          }
                        }, 100);
                      }
                    }}
                    onError={(e) => {
                      // Si falla el video, mostrar imagen por defecto
                      const target = e.currentTarget as HTMLVideoElement;
                      const parent = target.parentElement;
                      if (parent) {
                        parent.innerHTML = `
                          <div class="w-full h-full bg-gray-800 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 200 200" class="text-gray-400">
                              <rect width="200" height="200" fill="currentColor" opacity="0.1"/>
                              <path d="M80 60h40v20L140 60v80l-20-20v20H80V60z" fill="currentColor" opacity="0.6"/>
                            </svg>
                          </div>
                        `;
                      }
                    }}
                  />
                  
                  {/* Overlay con efecto de hover */}
                  <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button
                      onClick={() => handleVideoPlay(video)}
                      className="bg-white bg-opacity-90 p-3 rounded-full hover:scale-110 transition-transform duration-200 shadow-lg"
                    >
                      <FiPlay className="text-purple-600 text-xl" />
                    </button>
                  </div>
                  
                  {/* Marco decorativo para mosaico */}
                  {viewMode === 'grid' && (
                    <div className="absolute inset-0 border-2 border-transparent group-hover:border-purple-400 transition-colors duration-200 rounded-lg"></div>
                  )}
                </div>
                
                {/* Episode Number Badge */}
                <div className="absolute top-2 left-2 bg-purple-600 text-white px-2 py-1 rounded-md text-xs font-semibold shadow-md">
                  Ep. {index + 1}
                </div>
                
                {/* Video Duration Badge */}
                <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs">
                  {video.duration}
                </div>
              </div>
              
              {/* Video Info */}
              <div className={`flex-1 ${viewMode === 'list' ? '' : 'text-center'}`}>
                <h3 className={`font-semibold text-gray-800 course-title mb-2 ${viewMode === 'list' ? 'text-lg' : 'text-xl'}`}>
                  {video.title}
                </h3>
                <p className={`text-gray-600 mb-4 ${viewMode === 'list' ? 'text-sm' : 'text-sm leading-relaxed'}`}>
                  {video.description}
                </p>
                
                {/* Video Meta */}
                <div className={`flex ${viewMode === 'list' ? 'items-center space-x-4' : 'justify-center space-x-6'} text-sm text-gray-500 mb-4`}>
                  <div className="flex items-center space-x-1">
                    <FiClock />
                    <span>{video.duration}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span>{video.size}</span>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className={`flex ${viewMode === 'list' ? 'space-x-2' : 'justify-center space-x-3'}`}>
                  <button
                    onClick={() => handleVideoPlay(video)}
                    className="nm-white-button-primary px-4 py-2 rounded-lg flex items-center space-x-2 text-sm transition-all duration-200 hover:scale-105"
                  >
                    <FiPlay />
                    <span>Reproducir</span>
                  </button>
                  <button
                    onClick={() => handleVideoDownload(video)}
                    className="nm-white-button px-3 py-2 rounded-lg flex items-center justify-center text-sm transition-all duration-200 hover:scale-105"
                  >
                    <FiDownload />
                  </button>
                  <button
                    onClick={() => handleVideoShare(video)}
                    className="nm-white-button px-3 py-2 rounded-lg flex items-center justify-center text-sm transition-all duration-200 hover:scale-105"
                  >
                    <FiShare2 />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-16">
          <div className="nm-white-icon-large w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <FiVideo className="text-4xl text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">No hay videos disponibles</h3>
          <p className="text-gray-600">Este curso aún no tiene contenido de video.</p>
        </div>
      )}
    </div>
  )
}