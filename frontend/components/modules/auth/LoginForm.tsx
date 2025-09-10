'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { FiMail, FiLock } from 'react-icons/fi'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'

// Particle component for background
const ParticleField = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Particles */}
      {[...Array(60)].map((_, i) => (
        <div
          key={`particle-${i}`}
          className="absolute w-1 h-1 bg-[#8b5cf6] rounded-full opacity-30 animate-pulse"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 3}s`,
            animationDuration: `${2 + Math.random() * 2}s`
          }}
        />
      ))}
      
      {/* Lines connecting particles */}
      {[...Array(25)].map((_, i) => {
        const startX = Math.random() * 100;
        const startY = Math.random() * 100;
        const endX = Math.random() * 100;
        const endY = Math.random() * 100;
        const length = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
        
        return (
          <svg
            key={`line-${i}`}
            className="absolute opacity-10"
            style={{
              left: `${startX}%`,
              top: `${startY}%`,
              width: `${length}px`,
              height: '2px',
              transform: `rotate(${Math.atan2(endY - startY, endX - startX) * 180 / Math.PI}deg)`,
              transformOrigin: '0 50%'
            }}
          >
            <line
              x1="0"
              y1="1"
              x2={length}
              y2="1"
              stroke="#8b5cf6"
              strokeWidth="1"
              opacity="0.15"
            />
          </svg>
        );
      })}
      
      {/* Floating geometric shapes */}
      {[...Array(8)].map((_, i) => (
        <div
          key={`shape-${i}`}
          className="absolute opacity-5 animate-pulse"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 4}s`,
            animationDuration: `${3 + Math.random() * 3}s`
          }}
        >
          <div
            className="w-8 h-8 border border-[#8b5cf6] rotate-45"
            style={{
              borderRadius: i % 2 === 0 ? '50%' : '0'
            }}
          />
        </div>
      ))}
    </div>
  )
}

const LoginForm = () => {
  const router = useRouter()
  const { signIn, user, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

  // Redirect if user is already authenticated
  useEffect(() => {
    if (!authLoading && user) {
      console.log('🔄 User already authenticated, redirecting to dashboard...')
      window.location.replace('/dashboard.html')
    }
  }, [user, authLoading])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    
    try {
      await signIn(formData.email, formData.password)
      // Para static export, forzar recarga completa de la página
      window.location.replace('/dashboard.html')
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative bg-white">
      <ParticleField />
      
      <div className="neuro-card max-w-md w-full mx-4 p-8 relative z-10">
        <div className="mb-8 text-center">
          <img
            src="/assets/images/Logo.svg"
            alt="CognIA Logo"
            width={287}
            height={77}
            className="mx-auto mb-4"
            style={{ maxWidth: '100%', height: 'auto' }}
          />
          <h2 className="text-2xl font-bold text-[#8b5cf6]">Sign in to your account</h2>
          <p className="text-gray-600 mt-2">
            Access your personalized virtual campus
          </p>
        </div>

      <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-[#8b5cf6] mb-1">Email</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiMail className="text-[#8b5cf6]" />
              </div>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="email@example.com"
                className="neuro-input pl-10 w-full px-4 py-3 border-none rounded-lg outline-none text-gray-700"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-[#8b5cf6]">Password</label>
              <a href="#" className="text-sm text-[#8b5cf6] hover:text-[#6366f1] transition-colors">
                Forgot your password?
              </a>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiLock className="text-[#8b5cf6]" />
              </div>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="••••••••"
                className="neuro-input pl-10 w-full px-4 py-3 border-none rounded-lg outline-none text-gray-700"
              />
            </div>
          </div>

          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              className="h-4 w-4 text-[#8b5cf6] focus:ring-[#8b5cf6] border-gray-300 rounded"
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
              Remember my data
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-signin"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Signing in...
              </div>
            ) : (
              'Sign In'
            )}
          </button>

          {error && (
            <div className="mt-4 p-3 neuro-card bg-red-50 text-red-700 rounded text-sm">
              {error}
            </div>
          )}
        </form>

                 <div className="text-center mt-6">
           <p className="text-gray-600">
             Don&apos;t have an account?{' '}
             <button className="text-[#8b5cf6] hover:text-[#6366f1] transition-colors font-medium">
               Sign up
             </button>
           </p>
         </div>
      </div>
    </div>
  );
};

export default LoginForm