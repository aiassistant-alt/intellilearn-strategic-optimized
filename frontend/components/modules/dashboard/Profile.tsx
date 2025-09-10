'use client'
import { useState } from 'react'
import Image from 'next/image'
import { FaUser, FaCog, FaShieldAlt, FaBell, FaChartLine, FaLock, FaLanguage, FaPalette, FaSave, FaCheck } from 'react-icons/fa'

type TabType = 'personal' | 'preferences' | 'privacy' | 'notifications'

const Profile = () => {
  const [activeTab, setActiveTab] = useState<TabType>('personal')
  const [successMessage, setSuccessMessage] = useState('')
  
  // Datos de ejemplo del usuario
  const user = {
    name: 'Luis Arturo',
    email: 'luis.arturo@example.com',
    avatar: '/assets/images/Image.svg',
    country: 'México',
    profession: 'Estudiante',
    interests: ['Machine Learning', 'Desarrollo Web', 'Ciencia de Datos'],
    language: 'es',
    theme: 'light',
    emailNotifications: true,
    pushNotifications: false,
    progressUpdates: true,
    newsletterUpdates: false,
    dataSharing: 'minimal'
  }
  
  // Función simulada para guardar cambios
  const saveChanges = () => {
    setSuccessMessage('Cambios guardados correctamente')
    setTimeout(() => {
      setSuccessMessage('')
    }, 3000)
  }
  
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Perfil</h1>
        <p className="text-gray-600">Administra tu información personal y preferencias</p>
      </div>
      
      {/* Mensaje de éxito */}
      {successMessage && (
        <div className="mb-4 p-3 bg-green-100 text-green-800 rounded-lg flex items-center">
          <FaCheck className="mr-2" />
          {successMessage}
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Cabecera con información básica del usuario */}
        <div className="bg-gradient-to-r from-[#132944] to-[#3C31A3] p-6 text-white">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-white/30">
              <Image
                src={user.avatar}
                alt={user.name}
                fill
                style={{ objectFit: 'cover' }}
              />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{user.name}</h2>
              <p className="opacity-90">{user.email}</p>
              <div className="flex mt-2 gap-2">
                <span className="inline-block px-2 py-1 text-xs bg-white/20 rounded-full">
                  {user.country}
                </span>
                <span className="inline-block px-2 py-1 text-xs bg-white/20 rounded-full">
                  {user.profession}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Navegación por pestañas */}
        <div className="border-b border-gray-200">
          <div className="flex overflow-x-auto">
            <button
              className={`py-3 px-6 text-sm font-medium ${
                activeTab === 'personal' 
                  ? 'text-[#3C31A3] border-b-2 border-[#3C31A3]' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('personal')}
            >
              <FaUser className="inline mr-2" /> Información personal
            </button>
            <button
              className={`py-3 px-6 text-sm font-medium ${
                activeTab === 'preferences' 
                  ? 'text-[#3C31A3] border-b-2 border-[#3C31A3]' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('preferences')}
            >
              <FaCog className="inline mr-2" /> Preferencias
            </button>
            <button
              className={`py-3 px-6 text-sm font-medium ${
                activeTab === 'privacy' 
                  ? 'text-[#3C31A3] border-b-2 border-[#3C31A3]' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('privacy')}
            >
              <FaShieldAlt className="inline mr-2" /> Privacidad
            </button>
            <button
              className={`py-3 px-6 text-sm font-medium ${
                activeTab === 'notifications' 
                  ? 'text-[#3C31A3] border-b-2 border-[#3C31A3]' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('notifications')}
            >
              <FaBell className="inline mr-2" /> Notificaciones
            </button>
          </div>
        </div>
        
        {/* Contenido de la pestaña seleccionada */}
        <div className="p-6">
          {/* Información personal */}
          {activeTab === 'personal' && (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
                  <input 
                    type="text" 
                    defaultValue={user.name}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3C31A3] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico</label>
                  <input 
                    type="email" 
                    defaultValue={user.email}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3C31A3] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">País</label>
                  <select 
                    defaultValue={user.country}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3C31A3] focus:border-transparent"
                  >
                    <option value="México">México</option>
                    <option value="España">España</option>
                    <option value="Colombia">Colombia</option>
                    <option value="Argentina">Argentina</option>
                    <option value="Chile">Chile</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Profesión</label>
                  <input 
                    type="text" 
                    defaultValue={user.profession}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3C31A3] focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Intereses</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {['Machine Learning', 'Desarrollo Web', 'Ciencia de Datos', 'UX/UI', 'Cloud Computing', 'Ciberseguridad'].map((interest) => (
                    <div key={interest} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`interest-${interest}`}
                        defaultChecked={user.interests.includes(interest)}
                        className="h-4 w-4 text-[#3C31A3] focus:ring-[#3C31A3] border-gray-300 rounded"
                      />
                      <label htmlFor={`interest-${interest}`} className="ml-2 text-sm text-gray-700">
                        {interest}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Foto de perfil</label>
                <div className="flex items-center">
                  <div className="relative w-16 h-16 rounded-full overflow-hidden mr-4">
                    <Image
                      src={user.avatar}
                      alt={user.name}
                      fill
                      style={{ objectFit: 'cover' }}
                    />
                  </div>
                  <button className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors">
                    Cambiar imagen
                  </button>
                </div>
              </div>
              
              <div className="mt-8 flex justify-end">
                <button
                  onClick={saveChanges}
                  className="flex items-center px-4 py-2 bg-[#3C31A3] text-white rounded-lg hover:bg-[#2c2376] transition-colors"
                >
                  <FaSave className="mr-2" /> Guardar cambios
                </button>
              </div>
            </div>
          )}
          
          {/* Preferencias */}
          {activeTab === 'preferences' && (
            <div>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    <FaLanguage className="mr-2 text-[#3C31A3]" /> Idioma
                  </h3>
                  <p className="text-sm text-gray-500 mb-3">Selecciona el idioma de la plataforma</p>
                  <select 
                    defaultValue={user.language}
                    className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3C31A3] focus:border-transparent"
                  >
                    <option value="es">Español</option>
                    <option value="en">English</option>
                    <option value="pt">Português</option>
                    <option value="fr">Français</option>
                  </select>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    <FaPalette className="mr-2 text-[#3C31A3]" /> Tema
                  </h3>
                  <p className="text-sm text-gray-500 mb-3">Personaliza la apariencia de la plataforma</p>
                  <div className="grid grid-cols-3 gap-3 max-w-md">
                    <div className={`border p-3 rounded-lg cursor-pointer ${user.theme === 'light' ? 'border-[#3C31A3] bg-purple-50' : 'border-gray-200'}`}>
                      <div className="h-12 bg-white border border-gray-200 rounded-md mb-2"></div>
                      <p className="text-sm font-medium text-center">Claro</p>
                    </div>
                    <div className={`border p-3 rounded-lg cursor-pointer ${user.theme === 'dark' ? 'border-[#3C31A3] bg-purple-50' : 'border-gray-200'}`}>
                      <div className="h-12 bg-gray-800 rounded-md mb-2"></div>
                      <p className="text-sm font-medium text-center">Oscuro</p>
                    </div>
                    <div className={`border p-3 rounded-lg cursor-pointer ${user.theme === 'system' ? 'border-[#3C31A3] bg-purple-50' : 'border-gray-200'}`}>
                      <div className="h-12 bg-gradient-to-r from-white to-gray-800 rounded-md mb-2"></div>
                      <p className="text-sm font-medium text-center">Sistema</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    <FaChartLine className="mr-2 text-[#3C31A3]" /> Progreso de aprendizaje
                  </h3>
                  <p className="text-sm text-gray-500 mb-3">Configura la forma en que se mide tu progreso</p>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="progress-time"
                        name="progress-type"
                        defaultChecked
                        className="h-4 w-4 text-[#3C31A3] focus:ring-[#3C31A3] border-gray-300"
                      />
                      <label htmlFor="progress-time" className="ml-2 text-sm text-gray-700">
                        Basado en tiempo de estudio
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="progress-completion"
                        name="progress-type"
                        className="h-4 w-4 text-[#3C31A3] focus:ring-[#3C31A3] border-gray-300"
                      />
                      <label htmlFor="progress-completion" className="ml-2 text-sm text-gray-700">
                        Basado en lecciones completadas
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="progress-score"
                        name="progress-type"
                        className="h-4 w-4 text-[#3C31A3] focus:ring-[#3C31A3] border-gray-300"
                      />
                      <label htmlFor="progress-score" className="ml-2 text-sm text-gray-700">
                        Basado en calificaciones obtenidas
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-8 flex justify-end">
                <button
                  onClick={saveChanges}
                  className="flex items-center px-4 py-2 bg-[#3C31A3] text-white rounded-lg hover:bg-[#2c2376] transition-colors"
                >
                  <FaSave className="mr-2" /> Guardar cambios
                </button>
              </div>
            </div>
          )}
          
          {/* Privacidad */}
          {activeTab === 'privacy' && (
            <div>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    <FaLock className="mr-2 text-[#3C31A3]" /> Seguridad
                  </h3>
                  <p className="text-sm text-gray-500 mb-3">Administra tu contraseña y opciones de seguridad</p>
                  <button className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors text-sm">
                    Cambiar contraseña
                  </button>
                </div>
                
                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    <FaShieldAlt className="mr-2 text-[#3C31A3]" /> Privacidad de datos
                  </h3>
                  <p className="text-sm text-gray-500 mb-3">Configura cómo se comparten tus datos de aprendizaje</p>
                  
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          type="radio"
                          id="data-minimal"
                          name="data-sharing"
                          defaultChecked={user.dataSharing === 'minimal'}
                          className="focus:ring-[#3C31A3] h-4 w-4 text-[#3C31A3] border-gray-300"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor="data-minimal" className="font-medium text-gray-700">Mínimo</label>
                        <p className="text-gray-500">Solo se recopilan datos esenciales para el funcionamiento del servicio.</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          type="radio"
                          id="data-moderate"
                          name="data-sharing"
                          defaultChecked={user.dataSharing === 'moderate'}
                          className="focus:ring-[#3C31A3] h-4 w-4 text-[#3C31A3] border-gray-300"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor="data-moderate" className="font-medium text-gray-700">Moderado</label>
                        <p className="text-gray-500">Incluye datos para mejorar tu experiencia de aprendizaje personalizada.</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          type="radio"
                          id="data-full"
                          name="data-sharing"
                          defaultChecked={user.dataSharing === 'full'}
                          className="focus:ring-[#3C31A3] h-4 w-4 text-[#3C31A3] border-gray-300"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor="data-full" className="font-medium text-gray-700">Completo</label>
                        <p className="text-gray-500">Permite el uso de todos tus datos para mejorar la plataforma y la experiencia personalizada.</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium text-gray-900">Descarga tus datos</h3>
                  <p className="text-sm text-gray-500 mb-3">Obtén una copia de tus datos personales y de aprendizaje</p>
                  <button className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors text-sm">
                    Solicitar mis datos
                  </button>
                </div>
              </div>
              
              <div className="mt-8 flex justify-end">
                <button
                  onClick={saveChanges}
                  className="flex items-center px-4 py-2 bg-[#3C31A3] text-white rounded-lg hover:bg-[#2c2376] transition-colors"
                >
                  <FaSave className="mr-2" /> Guardar cambios
                </button>
              </div>
            </div>
          )}
          
          {/* Notificaciones */}
          {activeTab === 'notifications' && (
            <div>
              <p className="text-sm text-gray-500 mb-6">Configura qué notificaciones quieres recibir y cómo quieres recibirlas.</p>
              
              <div className="space-y-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-md font-medium text-gray-900 mb-4">Correo electrónico</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Actualizaciones de cursos</p>
                        <p className="text-xs text-gray-500">Notificaciones sobre nuevo contenido en tus cursos</p>
                      </div>
                      <div className="relative inline-block w-10 mr-2 align-middle">
                        <input
                          type="checkbox"
                          id="email-courses"
                          defaultChecked={user.emailNotifications}
                          className="opacity-0 w-0 h-0 absolute"
                        />
                        <label
                          htmlFor="email-courses"
                          className="block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"
                        >
                          <span className={`block h-6 w-6 rounded-full transform transition-transform duration-200 ease-in ${user.emailNotifications ? 'translate-x-4 bg-[#3C31A3]' : 'translate-x-0 bg-white'}`}></span>
                        </label>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Recordatorios de progreso</p>
                        <p className="text-xs text-gray-500">Recordatorios para continuar con tus estudios</p>
                      </div>
                      <div className="relative inline-block w-10 mr-2 align-middle">
                        <input
                          type="checkbox"
                          id="email-progress"
                          defaultChecked={user.progressUpdates}
                          className="opacity-0 w-0 h-0 absolute"
                        />
                        <label
                          htmlFor="email-progress"
                          className="block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"
                        >
                          <span className={`block h-6 w-6 rounded-full transform transition-transform duration-200 ease-in ${user.progressUpdates ? 'translate-x-4 bg-[#3C31A3]' : 'translate-x-0 bg-white'}`}></span>
                        </label>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Boletín informativo</p>
                        <p className="text-xs text-gray-500">Novedades, consejos y ofertas especiales</p>
                      </div>
                      <div className="relative inline-block w-10 mr-2 align-middle">
                        <input
                          type="checkbox"
                          id="email-newsletter"
                          defaultChecked={user.newsletterUpdates}
                          className="opacity-0 w-0 h-0 absolute"
                        />
                        <label
                          htmlFor="email-newsletter"
                          className="block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"
                        >
                          <span className={`block h-6 w-6 rounded-full transform transition-transform duration-200 ease-in ${user.newsletterUpdates ? 'translate-x-4 bg-[#3C31A3]' : 'translate-x-0 bg-white'}`}></span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-md font-medium text-gray-900 mb-4">Notificaciones push</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Activar notificaciones push</p>
                        <p className="text-xs text-gray-500">Recibir alertas en tu dispositivo</p>
                      </div>
                      <div className="relative inline-block w-10 mr-2 align-middle">
                        <input
                          type="checkbox"
                          id="push-active"
                          defaultChecked={user.pushNotifications}
                          className="opacity-0 w-0 h-0 absolute"
                        />
                        <label
                          htmlFor="push-active"
                          className="block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"
                        >
                          <span className={`block h-6 w-6 rounded-full transform transition-transform duration-200 ease-in ${user.pushNotifications ? 'translate-x-4 bg-[#3C31A3]' : 'translate-x-0 bg-white'}`}></span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-8 flex justify-end">
                <button
                  onClick={saveChanges}
                  className="flex items-center px-4 py-2 bg-[#3C31A3] text-white rounded-lg hover:bg-[#2c2376] transition-colors"
                >
                  <FaSave className="mr-2" /> Guardar cambios
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Profile