/**
 * @fileoverview Dashboard Layout Component
 * @author Luis Arturo Parra Rosas
 * @created 2023-12-12
 * @updated 2023-12-18
 * @version 1.0.0
 * 
 * @description
 * Main layout component for all dashboard pages.
 * Provides consistent UI structure including sidebar, header, and floating assistant.
 * 
 * @context
 * Used as the primary layout for all authenticated pages.
 * Handles common UI elements and user-specific data display.
 * Integrates with authentication system to display user information.
 * 
 * @changelog
 * v1.0.0 - Initial implementation
 * v1.0.1 - Added notifications panel
 * v1.0.2 - Fixed duplicate sidebar issue
 */

'use client'
import React, { ReactNode, useState } from 'react'
import Head from 'next/head'
import { Sidebar } from '@/components/common/Sidebar'
import { FloatingAssistant } from '@/components/common/FloatingAssistant'
import { FaSearch, FaBell, FaChevronDown } from 'react-icons/fa'
import { useAuth } from '@/lib/AuthContext'

/**
 * Dashboard Layout Props
 * @context Defines the expected props for the DashboardLayout component
 */
export type DashboardLayoutProps = {
  children: ReactNode
  title?: string
  description?: string
}

/**
 * Dashboard Layout Component
 * 
 * @param {object} props - Component props
 * @param {ReactNode} props.children - Child components to render in the main content area
 * @param {string} [props.title=Dashboard] - Page title for SEO and browser tab
 * @param {string} [props.description=CognIA IntelliLearn Platform] - Page description for SEO
 * @returns {JSX.Element} Complete dashboard layout with sidebar, header, and main content
 * 
 * @context
 * Primary layout component for authenticated pages.
 * 
 * @description
 * Renders a complete dashboard layout with:
 * - Sidebar navigation
 * - Header with search bar
 * - User profile section
 * - Notifications panel
 * - Main content area (children)
 * - Floating AI assistant
 */
export const DashboardLayout = ({ 
  children, 
  title = 'Dashboard', 
  description = 'CognIA IntelliLearn Platform' 
}: DashboardLayoutProps) => {
  // Get authenticated user data
  const { user } = useAuth();
  
  // State for search and notifications
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  
  /**
   * Handle search input changes
   * @param {React.ChangeEvent<HTMLInputElement>} e - Change event
   */
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };
  
  /**
   * Handle search form submission
   * @param {React.FormEvent} e - Form event
   */
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Implement search functionality
    console.log('Buscar:', searchQuery);
  };
  
  /**
   * Toggle notifications panel visibility
   */
  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };
  
  return (
    <div className="flex min-h-screen" data-theme="">
      {/* Sidebar Navigation */}
      <Sidebar />
      
      <div className="flex-1 flex flex-col" data-theme="">
        {/* Head section for SEO */}
        <Head>
          <title>{title} | CognIA IntelliLearn</title>
          <meta name="description" content={description} />
          <link rel="icon" href="/favicon.ico" />
        </Head>
        
        {/* Header with search bar */}
        <header className="border-b py-3 px-6 flex items-center justify-between" data-theme="">
          {/* Search form */}
          <div className="w-full max-w-xl">
            <form onSubmit={handleSearchSubmit} className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Buscar cursos, tareas..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#13294e] focus:border-[#13294e] text-sm"
              />
            </form>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Notifications */}
            <div className="relative">
              <button 
                onClick={toggleNotifications}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full relative"
              >
                <FaBell />
                <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
              </button>
              
              {/* Notifications dropdown panel */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 rounded-md shadow-lg py-1 z-10 border" data-theme="">
                  <div className="px-4 py-2 border-b">
                    <p className="text-sm font-medium">Notificaciones</p>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    <div className="px-4 py-3 hover:opacity-80 border-b">
                      <p className="text-sm font-medium">Nuevo curso disponible</p>
                      <p className="text-xs opacity-60">Se ha añadido un nuevo curso a tu catálogo</p>
                    </div>
                    <div className="px-4 py-3 hover:opacity-80">
                      <p className="text-sm font-medium">Tarea próxima a vencer</p>
                      <p className="text-xs opacity-60">La tarea &quot;Análisis de datos&quot; vence mañana</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* User profile section */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#13294e] rounded-full flex items-center justify-center text-white uppercase font-medium text-sm">
                {user?.displayName ? user.displayName.charAt(0) : 'U'}
              </div>
              <span className="text-sm font-medium text-gray-700 hidden sm:block">
                {user?.displayName || 'Usuario Demo'}
              </span>
              <FaChevronDown className="text-gray-400 text-xs" />
            </div>
          </div>
        </header>
        
        {/* Main content area */}
        <main className="flex-1">
          {children}
        </main>
      </div>
      
      {/* Floating AI assistant */}
      <FloatingAssistant />
    </div>
  )
} 