'use client'
import ProtectedRoute from '@/components/common/ProtectedRoute'
import Certificates from '@/components/modules/dashboard/Certificates'

export default function CertificatesPage() {
  return (
    <ProtectedRoute>
      <Certificates />
    </ProtectedRoute>
  )
} 