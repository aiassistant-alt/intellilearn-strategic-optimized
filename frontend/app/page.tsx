'use client'
import React, { useEffect } from 'react'
import { HeaderComponent } from '@/components/common/header'
import { FooterComponet } from '@/components/common/footer'
import LandingPage from '@/components/landingPage/LandingPage'
import { FloatingAssistant } from '@/components/common/FloatingAssistant'
import { useAuth } from '@/lib/AuthContext'

export default function HomePage() {
  const { user, loading } = useAuth()

  useEffect(() => {
    // If user is authenticated, redirect to dashboard
    if (!loading && user) {
      console.log('🔄 User authenticated on landing page, redirecting to dashboard...')
      console.log('🔄 Current user:', { email: user.email, hasTokens: !!(user.accessToken && user.idToken) })
      
      // Use setTimeout to ensure DOM is ready and avoid hydration issues
      const timer = setTimeout(() => {
        console.log('🔄 Executing redirect to dashboard...')
        window.location.replace('/dashboard.html')
      }, 100)
      
      return () => clearTimeout(timer)
    }
  }, [user, loading])

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <>
      <HeaderComponent />
      <main>
        <LandingPage />
      </main>
      <FooterComponet />
      <FloatingAssistant />
    </>
  )
} 