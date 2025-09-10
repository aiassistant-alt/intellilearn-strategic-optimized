'use client'
import ProtectedRoute from '@/components/common/ProtectedRoute'
import Profile from '@/components/modules/dashboard/Profile'

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <Profile />
    </ProtectedRoute>
  )
} 