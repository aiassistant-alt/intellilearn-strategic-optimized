'use client'

import { useEffect } from 'react'

export default function ThemeInitializer() {
  useEffect(() => {
    // Initialize theme on mount
    const savedTheme = localStorage.getItem('theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      document.documentElement.setAttribute('data-theme', 'dark')
      document.body.setAttribute('data-theme', 'dark')
    } else {
      document.documentElement.setAttribute('data-theme', 'light')
      document.body.setAttribute('data-theme', 'light')
    }
  }, [])

  return null
}