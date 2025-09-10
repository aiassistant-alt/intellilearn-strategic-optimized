'use client'
import ProtectedRoute from '@/components/common/ProtectedRoute'
import Content from '@/components/modules/dashboard/Content'

export default function ContentPage() {
  return (
    <ProtectedRoute>
      <Content />
    </ProtectedRoute>
  )
} 