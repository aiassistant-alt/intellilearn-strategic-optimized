'use client'
import ProtectedRoute from '@/components/common/ProtectedRoute'
import DashboardContent from '@/components/modules/dashboard/Dashboard'

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  )
} 