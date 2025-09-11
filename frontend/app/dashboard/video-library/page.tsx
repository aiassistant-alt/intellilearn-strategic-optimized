/**
 * ^VideoLibraryPage
 * Author: Luis Arturo Parra - Telmo AI
 * Created: 2025-09-11
 * Usage: Admin-only video library management interface
 * Business Context: Provides centralized video content management for administrators
 * Relations: Only accessible when userMode === 'admin'
 * Reminders: Follows neumorphic design pattern with 6 card layout
 */

'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { FiVideo, FiUpload, FiFolder, FiSettings, FiBarChart, FiUsers } from 'react-icons/fi'

export default function VideoLibraryPage() {
  const router = useRouter()
  
  // Dynamic video folders - will expand as new folders are added
  const videoFolders = [
    {
      id: '000001',
      title: 'Curso 000001',
      description: '7 episodios disponibles',
      icon: FiVideo,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
      episodeCount: 7
    },
    {
      id: '000002',
      title: 'Curso 000002',
      description: 'Próximamente disponible',
      icon: FiFolder,
      color: 'text-green-500',
      bgColor: 'bg-green-50',
      episodeCount: 0
    },
    {
      id: '000003',
      title: 'Curso 000003',
      description: 'Próximamente disponible',
      icon: FiFolder,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50',
      episodeCount: 0
    },
    {
      id: '000004',
      title: 'Curso 000004',
      description: 'Próximamente disponible',
      icon: FiFolder,
      color: 'text-orange-500',
      bgColor: 'bg-orange-50',
      episodeCount: 0
    },
    {
      id: '000005',
      title: 'Curso 000005',
      description: 'Próximamente disponible',
      icon: FiFolder,
      color: 'text-red-500',
      bgColor: 'bg-red-50',
      episodeCount: 0
    },
    {
      id: '000006',
      title: 'Curso 000006',
      description: 'Próximamente disponible',
      icon: FiFolder,
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-50',
      episodeCount: 0
    }
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2 page-title">Video Library</h1>
        <p className="text-gray-600">Manage and organize your educational video content</p>
      </div>

      {/* Video Folders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {videoFolders.map((folder) => {
          const IconComponent = folder.icon
          
          return (
            <div
              key={folder.id}
              onClick={() => router.push(`/dashboard/video-library/${folder.id}`)}
              className="nm-white-card rounded-2xl p-8 flex flex-col items-center text-center cursor-pointer hover:scale-105 transition-transform duration-300 group relative"
            >
              {/* Folder ID Badge */}
              <div className="absolute top-4 right-4 bg-gray-100 text-gray-600 text-xs font-mono px-2 py-1 rounded-md">
                {folder.id}
              </div>
              
              {/* Icon Container */}
              <div className={`w-16 h-16 ${folder.bgColor} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                <IconComponent className={`text-2xl ${folder.color}`} />
              </div>
              
              {/* Card Content */}
              <div className="space-y-3">
                <h3 className="text-xl font-semibold text-gray-800 course-title">{folder.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{folder.description}</p>
                
                {/* Episode Count Badge */}
                {folder.episodeCount > 0 && (
                  <div className="flex items-center justify-center mt-4">
                    <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
                      {folder.episodeCount} episodios
                    </div>
                  </div>
                )}
                
                {folder.episodeCount === 0 && (
                  <div className="flex items-center justify-center mt-4">
                    <div className="bg-gray-100 text-gray-500 px-3 py-1 rounded-full text-xs">
                      Sin contenido
                    </div>
                  </div>
                )}
              </div>
              
              {/* Hover Indicator */}
              <div className="mt-6 w-12 h-1 bg-gray-200 rounded-full group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-purple-600 transition-all duration-300"></div>
            </div>
          )
        })}
      </div>

      {/* Footer Info */}
      <div className="mt-12 p-6 nm-white-summary-card rounded-xl">
        <div className="flex items-center justify-center space-x-4 text-gray-500">
          <FiVideo className="text-lg" />
          <span className="text-sm">Administrator Video Library Management</span>
          <FiVideo className="text-lg" />
        </div>
        <p className="text-center text-xs text-gray-400 mt-2">
          Centralized video content management for educational courses
        </p>
      </div>
    </div>
  )
}
