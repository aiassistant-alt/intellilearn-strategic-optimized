/**
 * @fileoverview Dashboard Sidebar Navigation Component with Neumorphism
 * @author Luis Arturo Parra Rosas
 * @created 2023-12-14
 * @updated 2025-01-27
 * @version 2.0.0
 * 
 * @description
 * Main navigation sidebar for the dashboard interface with neumorphic design.
 * Provides access to all major sections of the application.
 * 
 * @context
 * Core navigation component used in the dashboard layout.
 * Handles user profile display, main navigation, and logout functionality.
 * Responsive design with mobile toggle functionality and neumorphic styling.
 * 
 * @changelog
 * v1.0.0 - Initial implementation
 * v1.0.1 - Added mobile responsiveness
 * v1.0.2 - Added active link highlighting
 * v2.0.0 - Added neumorphic design system
 */

'use client'
import React, { useState, useRef, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { StaticLink } from './StaticLink';
import { 
  FiHome, 
  FiBookOpen, 
  FiUsers, 
  FiSettings, 
  FiLogOut, 
  FiMenu, 
  FiX,
  FiBarChart,
  FiAward,
  FiMessageSquare,
  FiUser,
  FiTrendingUp,
  FiFileText,
  FiToggleLeft,
  FiToggleRight,
  FiChevronDown,
  FiVideo,
  FiDatabase,
  FiSidebar
} from 'react-icons/fi';
import { FaRobot } from 'react-icons/fa';
import { useAuth } from '@/lib/AuthContext'
import { useUserMode } from '@/lib/contexts/UserModeContext';
import { useTranslation } from '@/lib/translations';
import { NeumorphicLanguageSelector } from './NeumorphicLanguageSelector';

// Import del contexto de sidebar
interface SidebarContextType {
  isCollapsed: boolean
  toggleSidebar: () => void
}

// Hook para usar el contexto de sidebar
function useSidebarContext(): SidebarContextType {
  try {
    // Dinamically import the context to avoid circular dependencies
    const { useSidebarContext: useContext } = require('../../app/dashboard/layout')
    return useContext()
  } catch {
    // Fallback if context is not available
    return {
      isCollapsed: false,
      toggleSidebar: () => {}
    }
  }
}

/**
 * Sidebar Navigation Component with Neumorphism
 * 
 * @returns {JSX.Element} Sidebar navigation component with neumorphic design
 * 
 * @context
 * Main navigation interface for authenticated users with modern neumorphic styling.
 * 
 * @description
 * Renders a responsive sidebar with neumorphic design including:
 * - User profile information with neumorphic avatar
 * - Primary navigation menu with neumorphic buttons
 * - Secondary tools menu
 * - Neumorphic sign out button
 * - Mobile toggle functionality
 * 
 * Features:
 * - Active link highlighting with neumorphic inset effect
 * - Responsive design with mobile overlay
 * - User authentication integration
 * - Smooth animations and transitions
 */
export const Sidebar = () => {
  const router = useRouter()
  const pathname = usePathname()
  const { user, signOut } = useAuth()
  const { userMode, toggleUserMode } = useUserMode()
  const { isCollapsed, toggleSidebar } = useSidebarContext()
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false)

  /**
   * Handle user sign out
   * @context User session termination
   */
  const handleSignOut = async () => {
    await signOut()
  }

  /**
   * Toggle mobile sidebar visibility
   * @context Mobile responsiveness
   */
  const toggleMobileSidebar = () => {
    setIsOpen(!isOpen)
  }

  /**
   * Determine if a navigation link is active
   * @param {string} path - The path to check
   * @returns {boolean} True if the link is active
   * @context Active link highlighting with neumorphic effects
   */
  const isActive = (path: string) => {
    if (path === '/dashboard' && pathname === '/dashboard') {
      return true
    }
    if (path !== '/dashboard' && pathname.startsWith(path)) {
      return true
    }
    return false
  }

  /**
   * Main navigation items
   * @context Primary application sections
   */
  const mainNavItems = [
    { path: '/dashboard', label: t('nav.myProgress'), icon: <FiTrendingUp /> },
    { path: '/dashboard/courses', label: t('nav.myCourses'), icon: <FiBookOpen /> },
    { path: '/dashboard/assignments', label: t('nav.myTasks'), icon: <FiFileText /> },
    ...(userMode === 'admin' ? [
      { path: '/dashboard/video-library', label: t('nav.videoLibrary'), icon: <FiVideo /> },
      { path: '/dashboard/library', label: t('nav.library'), icon: <FiDatabase /> }
    ] : []),
    { path: '/dashboard/ai-course-generator', label: 'AI Course Generator', icon: <FaRobot /> },
  ]

  /**
   * Secondary navigation items (Tools section)
   * @context Additional tools and user settings
   */
  const secondaryNavItems = [
    { path: '/dashboard/certificates', label: t('nav.certificates'), icon: <FiAward /> },
    { path: '/dashboard/profile', label: t('nav.profile'), icon: <FiUser /> },
  ]

  return (
    <>
      {/* Mobile sidebar toggle button with neumorphism */}
      <button
        className="fixed top-4 left-4 neuro-button p-3 rounded-full shadow-md md:hidden z-30"
        onClick={toggleMobileSidebar}
        aria-label="Toggle sidebar"
      >
        {isOpen ? <FiX /> : <FiMenu />}
      </button>

      {/* Sidebar container with neumorphic design */}
      <aside
        className={`fixed md:static h-screen z-20 transform transition-all duration-300 ${
          isCollapsed ? 'w-[80px]' : 'w-[280px]'
        } ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 flex flex-col neuro-sidebar overflow-hidden`}
      >
        {/* Header section with logo and toggle button */}
        <div className="py-6 px-4 relative">
          {/* Toggle button - Dynamic positioning based on sidebar state */}
          <button
            onClick={toggleSidebar}
            className={`absolute neuro-button p-2 rounded-lg transition-all duration-300 hover:scale-105 z-10 ${
              isCollapsed 
                ? 'top-4 left-1/2 transform -translate-x-1/2' // Encima del logo cuando cerrada
                : 'top-2 right-2' // Esquina superior derecha cuando abierta
            }`}
            title={t('nav.toggleSidebar')}
            aria-label={t('nav.toggleSidebar')}
            style={!isCollapsed ? { 
              marginTop: '1px',
              marginRight: '1px'
            } : {}}
          >
            {isCollapsed ? (
              <FiMenu className="text-gray-600 transition-all duration-300" />
            ) : (
              <FiX className="text-gray-600 transition-all duration-300" />
            )}
          </button>
          
          {/* Logo container - Only visible when sidebar is expanded */}
          <div className="flex justify-center" style={{ marginTop: '1px' }}>
            {!isCollapsed && (
              <div className="neuro-container p-4 rounded-lg">
                <StaticLink href="/dashboard" className="block">
                  <img
                    src="/assets/images/Logo.svg"
                    alt="CognIA Logo"
                    width={160}
                    height={40}
                    className="object-contain"
                    style={{ 
                      maxWidth: '100%', 
                      height: 'auto',
                      filter: 'brightness(0) invert(1)' // Makes the logo white
                    }}
                    onLoad={() => console.log('✅ Sidebar logo loaded successfully')}
                    onError={(e) => {
                      console.error('❌ Sidebar logo failed to load:', e);
                      console.error('Sidebar logo src:', e.currentTarget.src);
                    }}
                  />
                </StaticLink>
              </div>
            )}
            
            {/* Collapsed logo - Just the "C" letter without container */}
            {isCollapsed && (
              <StaticLink href="/dashboard" className="block">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-purple-700 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                     style={{ background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-quaternary))' }}>
                  C
                </div>
              </StaticLink>
            )}
          </div>
        </div>

        {/* User profile section with neumorphic elements */}
        {!isCollapsed && (
          <div className="px-5 py-4 mb-6">
            <div className="neuro-container p-4 rounded-lg flex items-center">
              <div className="neuro-avatar w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center uppercase font-bold text-white">
                {user?.displayName ? user.displayName.charAt(0) : 'U'}
              </div>
              <div className="ml-3">
                <p className="text-gray-800 text-sm font-medium">
                  {user?.displayName || 'Demo User'}
                </p>
                <p className="text-xs text-gray-500">
                  {user?.email || 'user@example.com'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Main navigation menu with neumorphic items */}
        <nav className="flex-1 px-4 py-2 overflow-y-auto">
          <div className={`neuro-inset rounded-lg mb-6 ${isCollapsed ? 'p-2' : 'p-4'}`}>
            <ul className="space-y-2">
              {mainNavItems.map((item) => (
                <li key={item.path}>
                  <div title={isCollapsed ? item.label : undefined}>
                    <StaticLink
                      href={item.path}
                      className={`neuro-nav-item flex items-center rounded-lg text-sm transition-all duration-300 ${
                        isCollapsed ? 'justify-center p-3' : 'gap-3 px-4 py-3'
                      } ${
                        isActive(item.path)
                          ? 'text-white font-medium'
                          : 'text-gray-700 hover:text-gray-900'
                      }`}
                      style={isActive(item.path) ? {
                        background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                        color: '#000000',
                        boxShadow: '0 2px 8px rgba(187, 134, 252, 0.25)'
                      } : {}}
                    >
                      <span className="text-lg">{item.icon}</span>
                      {!isCollapsed && <span>{item.label}</span>}
                    </StaticLink>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Tools section header */}
          {!isCollapsed && (
            <div className="mb-4">
              <p className="px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('nav.tools')}
              </p>
            </div>
          )}

          {/* Secondary navigation menu with neumorphic items */}
          <div className={`neuro-inset rounded-lg ${isCollapsed ? 'p-2' : 'p-4'}`}>
            <ul className="space-y-2">
              {secondaryNavItems.map((item) => (
                <li key={item.path}>
                  <div title={isCollapsed ? item.label : undefined}>
                    <StaticLink
                      href={item.path}
                      className={`neuro-nav-item flex items-center rounded-lg text-sm transition-all duration-300 ${
                        isCollapsed ? 'justify-center p-3' : 'gap-3 px-4 py-3'
                      } ${
                        isActive(item.path)
                          ? 'text-white font-medium'
                          : 'text-gray-700 hover:text-gray-900'
                      }`}
                      style={isActive(item.path) ? {
                        background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                        color: '#000000',
                        boxShadow: '0 2px 8px rgba(187, 134, 252, 0.25)'
                      } : {}}
                    >
                      <span className="text-lg">{item.icon}</span>
                      {!isCollapsed && <span>{item.label}</span>}
                    </StaticLink>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        {/* Profile dropdown and sign out */}
        <div className="p-4 mt-auto space-y-3">
          {/* Language selector */}
          <NeumorphicLanguageSelector 
            isCollapsed={isCollapsed}
            className="mb-3"
          />
          
          {/* Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
              className={`neuro-button flex items-center w-full py-3 text-gray-700 text-sm rounded-lg transition-all duration-300 hover:text-gray-900 ${
                isCollapsed ? 'justify-center px-3' : 'justify-between px-4'
              }`}
              title={isCollapsed ? `${user?.email || 'Demo User'} - ${userMode === 'admin' ? 'Administrator' : 'Student'}` : undefined}
            >
              <div className={`flex items-center ${isCollapsed ? '' : 'gap-3'}`}>
                <div className="w-8 h-8 neuro-container rounded-full flex items-center justify-center">
                  <FiUser className="text-gray-600" />
                </div>
                {!isCollapsed && (
                <div className="text-left ml-3">
                  <div className="font-semibold text-xs text-gray-800">
                    {user?.email || t('user.demoUser')}
                  </div>
                  <div className={`text-xs font-medium ${
                    userMode === 'admin' 
                      ? 'text-orange-600' 
                      : 'text-blue-600'
                  }`}>
                    {userMode === 'admin' ? t('nav.administrator') : t('nav.student')}
                  </div>
                </div>
                )}
              </div>
              {!isCollapsed && (
                <FiChevronDown className={`transition-transform duration-200 ${
                  isProfileDropdownOpen ? 'rotate-180' : ''
                }`} />
              )}
            </button>

            {/* Dropdown Menu */}
            {isProfileDropdownOpen && !isCollapsed && (
              <div className="absolute bottom-full left-0 right-0 mb-2 neuro-container rounded-lg shadow-lg border z-50">
                <div className="p-2">
                  {/* Mode Toggle */}
                  <button
                    onClick={() => {
                      toggleUserMode()
                      setIsProfileDropdownOpen(false)
                    }}
                    className="flex items-center gap-3 w-full px-3 py-2 text-sm hover:opacity-80 rounded-lg transition-all"
                  >
                    {userMode === 'admin' ? (
                      <FiToggleRight className="text-orange-500" />
                    ) : (
                      <FiToggleLeft className="text-blue-500" />
                    )}
                                         <span>{userMode === 'admin' ? t('nav.switchToStudent') : t('nav.switchToAdmin')}</span>
                  </button>

                  {/* Profile Settings */}
                  <button
                    onClick={() => setIsProfileDropdownOpen(false)}
                    className="flex items-center gap-3 w-full px-3 py-2 text-sm hover:opacity-80 rounded-lg transition-all"
                  >
                    <FiSettings className="text-gray-500" />
                                        <span>{t('nav.settings')}</span>
                  </button>

                  <hr className="my-2 border-gray-100" />

                  {/* Sign Out */}
                  <button
                    onClick={() => {
                      handleSignOut()
                      setIsProfileDropdownOpen(false)
                    }}
                    className="flex items-center gap-3 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <FiLogOut className="text-red-500" />
                                        <span>{t('nav.signOut')}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile overlay background */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-10 md:hidden transition-opacity duration-300"
          onClick={toggleMobileSidebar}
        ></div>
      )}
    </>
  )
} 