'use client'
import ProtectedRoute from '@/components/common/ProtectedRoute'
import Analytics from '@/components/modules/dashboard/Analytics'

export default function AnalyticsPage() {
  return (
    <ProtectedRoute>
      <Analytics />
    </ProtectedRoute>
  )
} 