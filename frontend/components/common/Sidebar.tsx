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
  FiChevronDown
} from 'react-icons/fi';
import { useAuth } from '@/lib/AuthContext'
import { useUserMode } from '@/lib/contexts/UserModeContext';

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
   * Toggle sidebar visibility on mobile
   * @context Mobile responsiveness
   */
  const toggleSidebar = () => {
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
    { path: '/dashboard', label: 'My Progress', icon: <FiTrendingUp /> },
    { path: '/dashboard/courses', label: 'My Courses', icon: <FiBookOpen /> },
    { path: '/dashboard/assignments', label: 'My Tasks', icon: <FiFileText /> },
  ]

  /**
   * Secondary navigation items (Tools section)
   * @context Additional tools and user settings
   */
  const secondaryNavItems = [
    { path: '/dashboard/certificates', label: 'Certificates', icon: <FiAward /> },
    { path: '/dashboard/profile', label: 'Profile', icon: <FiUser /> },
  ]

  return (
    <>
      {/* Mobile sidebar toggle button with neumorphism */}
      <button
        className="fixed top-4 left-4 neuro-button p-3 rounded-full shadow-md md:hidden z-30"
        onClick={toggleSidebar}
        aria-label="Toggle sidebar"
      >
        {isOpen ? <FiX /> : <FiMenu />}
      </button>

      {/* Sidebar container with neumorphic design */}
      <aside
        className={`fixed md:static w-[280px] h-screen z-20 transform transition-all duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 flex flex-col neuro-sidebar`}
      >
        {/* Logo section with neumorphic container */}
        <div className="py-6 px-4 flex justify-center">
          <div className="neuro-container p-4 rounded-lg">
            <StaticLink href="/dashboard" className="block">
              <img
                src="/assets/images/Logo.svg"
                alt="CognIA Logo"
                width={160}
                height={40}
                className="object-contain"
                style={{ maxWidth: '100%', height: 'auto' }}
                onLoad={() => console.log('✅ Sidebar logo loaded successfully')}
                onError={(e) => {
                  console.error('❌ Sidebar logo failed to load:', e);
                  console.error('Sidebar logo src:', e.currentTarget.src);
                }}
              />
            </StaticLink>
          </div>
        </div>

        {/* User profile section with neumorphic elements */}
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

        {/* Main navigation menu with neumorphic items */}
        <nav className="flex-1 px-4 py-2 overflow-y-auto">
          <div className="neuro-inset p-4 rounded-lg mb-6">
            <ul className="space-y-2">
              {mainNavItems.map((item) => (
                <li key={item.path}>
                  <StaticLink
                    href={item.path}
                    className={`neuro-nav-item flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all duration-300 ${
                      isActive(item.path)
                        ? 'text-white font-medium'
                        : 'text-gray-700 hover:text-gray-900'
                    }`}
                    style={isActive(item.path) ? {
                      background: 'linear-gradient(135deg, var(--cognia-blue-dark), var(--cognia-blue-purple))',
                      color: 'white',
                      boxShadow: '0 2px 8px rgba(19, 41, 68, 0.25)'
                    } : {}}
                  >
                    <span className="text-lg">{item.icon}</span>
                    {item.label}
                  </StaticLink>
                </li>
              ))}
            </ul>
          </div>

          {/* Tools section header */}
          <div className="mb-4">
            <p className="px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
              Tools
            </p>
          </div>

          {/* Secondary navigation menu with neumorphic items */}
          <div className="neuro-inset p-4 rounded-lg">
            <ul className="space-y-2">
              {secondaryNavItems.map((item) => (
                <li key={item.path}>
                  <StaticLink
                    href={item.path}
                    className={`neuro-nav-item flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all duration-300 ${
                      isActive(item.path)
                        ? 'text-white font-medium'
                        : 'text-gray-700 hover:text-gray-900'
                    }`}
                    style={isActive(item.path) ? {
                      background: 'linear-gradient(135deg, var(--cognia-blue-dark), var(--cognia-blue-purple))',
                      color: 'white',
                      boxShadow: '0 2px 8px rgba(19, 41, 68, 0.25)'
                    } : {}}
                  >
                    <span className="text-lg">{item.icon}</span>
                    {item.label}
                  </StaticLink>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        {/* Profile dropdown and sign out */}
        <div className="p-4 mt-auto space-y-3">
          {/* Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
              className="neuro-button flex items-center justify-between w-full py-3 px-4 text-gray-700 text-sm rounded-lg transition-all duration-300 hover:text-gray-900"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 neuro-container rounded-full flex items-center justify-center">
                  <FiUser className="text-gray-600" />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-xs text-gray-800">
                    {user?.email || 'Demo User'}
                  </div>
                  <div className={`text-xs font-medium ${
                    userMode === 'admin' 
                      ? 'text-orange-600' 
                      : 'text-blue-600'
                  }`}>
                    {userMode === 'admin' ? 'Administrator' : 'Student'}
                  </div>
                </div>
              </div>
              <FiChevronDown className={`transition-transform duration-200 ${
                isProfileDropdownOpen ? 'rotate-180' : ''
              }`} />
            </button>

            {/* Dropdown Menu */}
            {isProfileDropdownOpen && (
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
                                         <span>Switch to {userMode === 'admin' ? 'Student' : 'Admin'}</span>
                  </button>

                  {/* Profile Settings */}
                  <button
                    onClick={() => setIsProfileDropdownOpen(false)}
                    className="flex items-center gap-3 w-full px-3 py-2 text-sm hover:opacity-80 rounded-lg transition-all"
                  >
                    <FiSettings className="text-gray-500" />
                                         <span>Settings</span>
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
                                         <span>Sign Out</span>
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
          onClick={toggleSidebar}
        ></div>
      )}
    </>
  )
} 