'use client'
import ProtectedRoute from '@/components/common/ProtectedRoute'
import Courses from '@/components/modules/dashboard/Courses'

export default function CoursesPage() {
  return (
    <ProtectedRoute>
      <Courses />
    </ProtectedRoute>
  )
} 