'use client'
/**
 * @fileoverview Main Dashboard Component with Neumorphism
 * @author Luis Arturo Parra Rosas
 * @created 2023-12-14
 * @updated 2025-01-27
 * @version 2.0.0
 * 
 * @description
 * Main dashboard overview component with neumorphic design showing user's
 * recent courses, progress, and upcoming events.
 * 
 * @context
 * Central dashboard component displayed when users first access the platform.
 * Shows personalized information and quick access to key features.
 * 
 * @changelog
 * v1.0.0 - Initial dashboard implementation
 * v1.0.1 - Added progress tracking
 * v1.0.2 - Added events section
 * v2.0.0 - Added neumorphic design system
 */

import { FaPlus, FaCalendar, FaClock, FaChartLine, FaPlay } from 'react-icons/fa'
import { useAuth } from '@/lib/AuthContext'

/**
 * Main dashboard content component with neumorphic styling
 * Displays user's personalized learning overview
 */
export default function DashboardContent() {
  const { user } = useAuth()
  
  return (
    <div className="p-8" style={{ background: 'var(--neuro-bg-light)' }}>
      {/* Welcome Header with neumorphism */}
      <div className="neuro-container rounded-2xl p-6 mb-8">
        <h1 className="text-3xl font-bold mb-2 text-gray-800">
          ¡Bienvenido, {user?.displayName?.split(' ')[0] || 'Usuario'}!
        </h1>
        <p className="text-gray-600">
          Continúa tu aprendizaje donde lo dejaste y descubre nuevo contenido.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* Recent Courses Card with neumorphism */}
        <div className="neuro-container rounded-2xl p-6 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center mb-6">
            <div className="neuro-icon mr-3">
              <FaPlay className="text-purple-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800">Cursos Recientes</h2>
          </div>
          
          <div className="space-y-4">
            {/* Course Item 1 */}
            <div className="neuro-nav-item p-4 rounded-xl hover:bg-purple-50 transition-all duration-300 cursor-pointer group">
              <div className="flex items-center gap-4">
                <div className="neuro-badge w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                  <span className="text-purple-600 font-bold">JS</span>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-800 group-hover:text-purple-600 transition-colors">
                    JavaScript Avanzado
                  </p>
                  <p className="text-sm text-gray-500 flex items-center">
                    <FaClock className="mr-1" />
                    Último acceso: hace 2 días
                  </p>
                </div>
              </div>
            </div>
            
            {/* Course Item 2 */}
            <div className="neuro-nav-item p-4 rounded-xl hover:bg-blue-50 transition-all duration-300 cursor-pointer group">
              <div className="flex items-center gap-4">
                <div className="neuro-badge w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <span className="text-blue-600 font-bold">PY</span>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">
                    Python para Data Science
                  </p>
                  <p className="text-sm text-gray-500 flex items-center">
                    <FaClock className="mr-1" />
                    Último acceso: hace 5 días
                  </p>
                </div>
              </div>
            </div>
            
            {/* Explore More Button */}
            <button className="neuro-button w-full flex items-center justify-center gap-3 mt-6 text-purple-600 font-semibold py-3 rounded-xl transition-all duration-300 hover:text-purple-700">
              <FaPlus size={14} />
              <span>Explorar más cursos</span>
            </button>
          </div>
        </div>
        
        {/* Progress Card with neumorphism */}
        <div className="neuro-container rounded-2xl p-6 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center mb-6">
            <div className="neuro-icon mr-3">
              <FaChartLine className="text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800">Tu Progreso</h2>
          </div>
          
          <div className="space-y-6">
            {/* Progress Item 1 */}
            <div className="neuro-inset p-4 rounded-xl">
              <div className="flex justify-between text-sm mb-3">
                <span className="font-semibold text-gray-700">JavaScript Avanzado</span>
                <span className="neuro-badge text-purple-600 font-bold">65%</span>
              </div>
              <div className="neuro-progress">
                <div className="neuro-progress-fill bg-purple-600" style={{ width: '65%' }}></div>
              </div>
            </div>
            
            {/* Progress Item 2 */}
            <div className="neuro-inset p-4 rounded-xl">
              <div className="flex justify-between text-sm mb-3">
                <span className="font-semibold text-gray-700">Python para Data Science</span>
                <span className="neuro-badge text-blue-600 font-bold">32%</span>
              </div>
              <div className="neuro-progress">
                <div className="neuro-progress-fill bg-blue-600" style={{ width: '32%' }}></div>
              </div>
            </div>
            
            {/* Progress Item 3 */}
            <div className="neuro-inset p-4 rounded-xl">
              <div className="flex justify-between text-sm mb-3">
                <span className="font-semibold text-gray-700">React Fundamentals</span>
                <span className="neuro-badge text-green-600 font-bold">78%</span>
              </div>
              <div className="neuro-progress">
                <div className="neuro-progress-fill bg-green-600" style={{ width: '78%' }}></div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Upcoming Events Card with neumorphism */}
        <div className="neuro-container rounded-2xl p-6 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center mb-6">
            <div className="neuro-icon mr-3">
              <FaCalendar className="text-orange-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800">Próximos Eventos</h2>
          </div>
          
          <div className="space-y-4">
            {/* Event Item 1 */}
            <div className="neuro-nav-item border border-gray-100 p-4 rounded-xl hover:border-purple-200 transition-all duration-300">
              <div className="neuro-badge inline-block text-xs text-purple-600 font-bold mb-2 px-3 py-1 rounded-full bg-purple-50">
                HOY - 16:00
              </div>
              <p className="font-semibold text-gray-800 mb-1">Masterclass: Inteligencia Artificial</p>
              <p className="text-sm text-gray-500 flex items-center">
                <FaClock className="mr-1" />
                Duración: 1 hora
              </p>
            </div>
            
            {/* Event Item 2 */}
            <div className="neuro-nav-item border border-gray-100 p-4 rounded-xl hover:border-orange-200 transition-all duration-300">
              <div className="neuro-badge inline-block text-xs text-orange-600 font-bold mb-2 px-3 py-1 rounded-full bg-orange-50">
                MAÑANA - 10:00
              </div>
              <p className="font-semibold text-gray-800 mb-1">Workshop: Desarrollo Web Moderno</p>
              <p className="text-sm text-gray-500 flex items-center">
                <FaClock className="mr-1" />
                Duración: 2 horas
              </p>
            </div>
            
            {/* View Calendar Button */}
            <button className="neuro-button w-full flex items-center justify-center gap-3 mt-6 text-orange-600 font-semibold py-3 rounded-xl transition-all duration-300 hover:text-orange-700">
              <FaCalendar size={14} />
              <span>Ver calendario completo</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Additional Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
        <div className="neuro-container rounded-2xl p-6 text-center">
          <div className="neuro-icon mx-auto mb-3">
            <FaPlay className="text-2xl text-purple-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-800">12</h3>
          <p className="text-sm text-gray-600">Cursos Completados</p>
        </div>
        
        <div className="neuro-container rounded-2xl p-6 text-center">
          <div className="neuro-icon mx-auto mb-3">
            <FaClock className="text-2xl text-blue-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-800">48h</h3>
          <p className="text-sm text-gray-600">Tiempo de Estudio</p>
        </div>
        
        <div className="neuro-container rounded-2xl p-6 text-center">
          <div className="neuro-icon mx-auto mb-3">
            <FaChartLine className="text-2xl text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-800">85%</h3>
          <p className="text-sm text-gray-600">Promedio General</p>
        </div>
        
        <div className="neuro-container rounded-2xl p-6 text-center">
          <div className="neuro-icon mx-auto mb-3">
            <FaCalendar className="text-2xl text-orange-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-800">5</h3>
          <p className="text-sm text-gray-600">Eventos Próximos</p>
        </div>
      </div>
    </div>
  )
} 