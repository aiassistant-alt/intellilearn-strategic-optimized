'use client'
import React, { ReactNode, useState, createContext, useContext } from 'react'
import { Sidebar } from '@/components/common/Sidebar'
import { FloatingAssistant } from '@/components/common/FloatingAssistant'
import { NeumorphicThemeToggle } from '@/components/common/NeumorphicThemeToggle'
import { NeumorphicNotification } from '@/components/common/NeumorphicNotification'
import { FaSearch, FaBars } from 'react-icons/fa'
import { useAuth } from '@/lib/AuthContext'

// Context para el estado de la sidebar
interface SidebarContextType {
  isCollapsed: boolean
  toggleSidebar: () => void
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

export const useSidebarContext = () => {
  const context = useContext(SidebarContext)
  if (!context) {
    throw new Error('useSidebarContext must be used within a SidebarProvider')
  }
  return context
}

export default function DashboardLayout({
  children,
}: {
  children: ReactNode
}) {
  const { user } = useAuth()
  const [showNotifications, setShowNotifications] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed)
  }

  const notifications = [
    { id: 1, message: 'Nueva lección disponible', time: '5 min ago' },
    { id: 2, message: 'Tarea revisada', time: '1 hour ago' },
    { id: 3, message: 'Nuevo certificado obtenido', time: '2 hours ago' },
  ]

  return (
    <SidebarContext.Provider value={{ isCollapsed, toggleSidebar }}>
      <div className="flex h-screen" style={{ background: 'var(--nm-bg)' }}>
        <Sidebar />
        
        <div className={`flex-1 overflow-y-auto transition-all duration-300 ${
          isCollapsed ? 'ml-0' : 'ml-0'
        }`}>
          {/* Header */}
          <header className="nm-card m-4 mb-0 rounded-2xl">
            <div className="px-6 py-4 flex items-center justify-between">
              {/* Left section with sidebar toggle */}
              <div className="flex items-center gap-4">
                {/* Sidebar Toggle Button */}
                <button
                  onClick={toggleSidebar}
                  className="neuro-button p-2 rounded-lg hover:bg-gray-50 transition-all duration-300"
                  title={isCollapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
                >
                  <FaBars className="text-gray-600" />
                </button>
                
                {/* Search Bar */}
                <div className="flex-1 max-w-xl">
                  <div className="relative">
                    <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 z-10" />
                    <input
                      type="text"
                      placeholder="Buscar cursos, lecciones, o estudiantes..."
                      className="nm-input pl-12"
                      style={{ borderRadius: '12px' }}
                    />
                  </div>
                </div>
              </div>

              {/* Header Right Section */}
              <div className="flex items-center gap-3 ml-4">
                {/* Notifications */}
                <NeumorphicNotification
                  count={3}
                  onClick={() => setShowNotifications(!showNotifications)}
                />
                
                {/* Theme Toggle */}
                <NeumorphicThemeToggle />
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="p-4">
            <div className="nm-card rounded-2xl min-h-[calc(100vh-180px)] p-6">
              {children}
            </div>
          </main>
        </div>

        <FloatingAssistant />
        
        {/* Notifications Dropdown */}
        {showNotifications && (
          <div className="fixed top-20 right-4 nm-card rounded-2xl w-80 z-40">
            <div className="p-4 border-b" style={{ borderColor: 'var(--nm-shadow-dark)' }}>
              <h3 className="font-semibold" style={{ color: 'var(--nm-text)' }}>Notificaciones</h3>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {notifications.map(notif => (
                <div key={notif.id} className="p-4 border-b hover:bg-opacity-50" style={{ borderColor: 'var(--nm-shadow-dark)' }}>
                  <p className="text-sm" style={{ color: 'var(--nm-text)' }}>{notif.message}</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--nm-text-secondary)' }}>{notif.time}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <style jsx>{`
          @keyframes wave {
            0%, 100% {
              transform: scaleY(0.5);
              opacity: 0.5;
            }
            50% {
              transform: scaleY(1);
              opacity: 1;
            }
          }
        `}</style>
      </div>
    </SidebarContext.Provider>
  )
}