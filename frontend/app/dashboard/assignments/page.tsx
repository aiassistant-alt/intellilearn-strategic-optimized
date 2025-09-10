'use client'
import ProtectedRoute from '@/components/common/ProtectedRoute'
import Assignments from '@/components/modules/dashboard/Assignments'

export default function AssignmentsPage() {
  return (
    <ProtectedRoute>
      <Assignments />
    </ProtectedRoute>
  )
} 