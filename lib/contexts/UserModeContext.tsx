'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

export type UserMode = 'student' | 'admin'

interface UserModeContextType {
  userMode: UserMode
  setUserMode: (mode: UserMode) => void
  toggleUserMode: () => void
}

const UserModeContext = createContext<UserModeContextType | undefined>(undefined)

const USER_MODE_STORAGE_KEY = 'intellilearn_user_mode'

export function UserModeProvider({ children }: { children: React.ReactNode }) {
  const [userMode, setUserModeState] = useState<UserMode>('student')

  // Cargar modo desde localStorage al inicializar
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedMode = localStorage.getItem(USER_MODE_STORAGE_KEY) as UserMode
      if (savedMode && (savedMode === 'student' || savedMode === 'admin')) {
        setUserModeState(savedMode)
      }
    }
  }, [])

  // Función para cambiar el modo y persistirlo
  const setUserMode = (mode: UserMode) => {
    setUserModeState(mode)
    if (typeof window !== 'undefined') {
      localStorage.setItem(USER_MODE_STORAGE_KEY, mode)
    }
    console.log(`🔄 User mode changed to: ${mode}`)
  }

  // Función para alternar entre modos
  const toggleUserMode = () => {
    const newMode = userMode === 'student' ? 'admin' : 'student'
    setUserMode(newMode)
  }

  return (
    <UserModeContext.Provider value={{ userMode, setUserMode, toggleUserMode }}>
      {children}
    </UserModeContext.Provider>
  )
}

export function useUserMode() {
  const context = useContext(UserModeContext)
  if (context === undefined) {
    throw new Error('useUserMode must be used within a UserModeProvider')
  }
  return context
} 