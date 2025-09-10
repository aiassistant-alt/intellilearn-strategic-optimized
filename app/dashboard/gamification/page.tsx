'use client'
import ProtectedRoute from '@/components/common/ProtectedRoute'
import Gamification from '@/components/modules/dashboard/Gamification'

export default function GamificationPage() {
  return (
    <ProtectedRoute>
      <Gamification />
    </ProtectedRoute>
  )
} 