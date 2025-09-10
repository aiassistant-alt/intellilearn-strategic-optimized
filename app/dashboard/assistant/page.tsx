'use client'
import ProtectedRoute from '@/components/common/ProtectedRoute'
import Assistant from '@/components/modules/dashboard/Assistant'

export default function AssistantPage() {
  return (
    <ProtectedRoute>
      <Assistant />
    </ProtectedRoute>
  )
} 