'use client'
import { useState } from 'react'
import Image from 'next/image'
import { FaTrophy, FaMedal, FaAward, FaFire, FaRegLightbulb, FaStar } from 'react-icons/fa'
import { BiDiamond } from 'react-icons/bi'

// Tipos para los datos
type Achievement = {
  id: number
  name: string
  description: string
  icon: React.ReactNode
  completed: boolean
  progress?: number
  totalRequired?: number
  image?: string
}

type Badge = {
  id: number
  name: string
  description: string
  image: string
  earned: boolean
  level?: 'bronze' | 'silver' | 'gold' | 'platinum'
}

type Ranking = {
  position: number
  user: {
    name: string
    avatar: string
    points: number
  }
  isCurrentUser: boolean
}

const Gamification = () => {
  const [activeTab, setActiveTab] = useState<'achievements' | 'badges' | 'leaderboard'>('achievements')
  const [streak, setStreak] = useState(12) // Días consecutivos de estudio
  const [level, setLevel] = useState(8)
  const [xp, setXp] = useState(2450)
  const [nextLevelXp, setNextLevelXp] = useState(3000)
  
  // Logros del usuario
  const achievements: Achievement[] = [
    {
      id: 1,
      name: 'Primeros pasos',
      description: 'Completa tu primera lección',
      icon: <FaRegLightbulb className="text-yellow-500" />,
      completed: true
    },
    {
      id: 2,
      name: 'Estudiante dedicado',
      description: 'Completa 10 lecciones',
      icon: <FaAward className="text-purple-500" />,
      completed: true
    },
    {
      id: 3,
      name: 'Explorador de conocimiento',
      description: 'Inscríbete en 5 cursos diferentes',
      icon: <FaTrophy className="text-blue-500" />,
      completed: false,
      progress: 3,
      totalRequired: 5
    },
    {
      id: 4,
      name: 'Maestro del aprendizaje',
      description: 'Obtén una calificación perfecta en un examen',
      icon: <FaMedal className="text-yellow-500" />,
      completed: false
    },
    {
      id: 5,
      name: 'Súper constante',
      description: 'Mantén una racha de estudio de 30 días',
      icon: <FaFire className="text-red-500" />,
      completed: false,
      progress: 12,
      totalRequired: 30
    }
  ]
  
  // Insignias del usuario
  const badges: Badge[] = [
    {
      id: 1,
      name: 'Experto en Machine Learning',
      description: 'Dominio avanzado de conceptos de Machine Learning',
      image: '/assets/images/Image.svg',
      earned: true,
      level: 'gold'
    },
    {
      id: 2,
      name: 'Desarrollador Web',
      description: 'Habilidades en desarrollo frontend y backend',
      image: '/assets/images/Image.svg',
      earned: true,
      level: 'silver'
    },
    {
      id: 3,
      name: 'Científico de Datos',
      description: 'Capacidad para analizar y visualizar datos',
      image: '/assets/images/Image.svg',
      earned: true,
      level: 'bronze'
    },
    {
      id: 4,
      name: 'Diseñador UX/UI',
      description: 'Conocimientos en diseño de interfaces de usuario',
      image: '/assets/images/Image.svg',
      earned: false
    },
    {
      id: 5,
      name: 'Especialista en IA',
      description: 'Dominio de técnicas avanzadas de inteligencia artificial',
      image: '/assets/images/Image.svg',
      earned: false
    }
  ]
  
  // Tabla de clasificación
  const leaderboard: Ranking[] = [
    {
      position: 1,
      user: {
        name: 'Carlos Méndez',
        avatar: '/assets/images/Image.svg',
        points: 4850
      },
      isCurrentUser: false
    },
    {
      position: 2,
      user: {
        name: 'María López',
        avatar: '/assets/images/Image.svg',
        points: 4320
      },
      isCurrentUser: false
    },
    {
      position: 3,
      user: {
        name: 'Juan Pérez',
        avatar: '/assets/images/Image.svg',
        points: 3980
      },
      isCurrentUser: false
    },
    {
      position: 4,
      user: {
        name: 'Luis Arturo',
        avatar: '/assets/images/Image.svg',
        points: 2450
      },
      isCurrentUser: true
    },
    {
      position: 5,
      user: {
        name: 'Ana Martínez',
        avatar: '/assets/images/Image.svg',
        points: 2320
      },
      isCurrentUser: false
    }
  ]
  
  // Calcular el porcentaje de progreso al siguiente nivel
  const levelProgress = (xp / nextLevelXp) * 100
  
  // Renderizar estrellas según el nivel de la insignia
  const renderBadgeLevel = (level?: 'bronze' | 'silver' | 'gold' | 'platinum') => {
    if (!level) return null
    
    const stars = {
      bronze: 1,
      silver: 2,
      gold: 3,
      platinum: 4
    }
    
    const totalStars = stars[level]
    return (
      <div className="flex mt-1">
        {[...Array(totalStars)].map((_, i) => (
          <FaStar key={i} className="text-yellow-500 text-xs" />
        ))}
      </div>
    )
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Gamificación</h1>
        <p className="text-gray-600">Tus logros, insignias y posición en la tabla de clasificación</p>
      </div>
      
      {/* Resumen del progreso */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Nivel */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-800 rounded-lg shadow-md p-6 text-white">
          <div className="flex items-center">
            <div className="p-3 bg-white/20 rounded-full mr-4">
              <BiDiamond className="text-2xl" />
            </div>
            <div>
              <p className="text-white/80 text-sm">Nivel actual</p>
              <h2 className="text-3xl font-bold">{level}</h2>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex justify-between mb-1 text-sm">
              <span>{xp} XP</span>
              <span>{nextLevelXp} XP</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2.5">
              <div 
                className="bg-white rounded-full h-2.5" 
                style={{ width: `${levelProgress}%` }}
              ></div>
            </div>
            <p className="text-xs mt-2 text-white/80">{nextLevelXp - xp} XP para el siguiente nivel</p>
          </div>
        </div>
        
        {/* Racha diaria */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-4">
            <div className="p-3 bg-orange-100 rounded-full mr-4">
              <FaFire className="text-2xl text-orange-500" />
            </div>
            <div>
              <p className="text-gray-600 text-sm">Racha diaria</p>
              <h2 className="text-3xl font-bold text-gray-800">{streak} días</h2>
            </div>
          </div>
          <div className="flex justify-between">
            {[1, 2, 3, 4, 5, 6, 7].map(day => (
              <div 
                key={day} 
                className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-medium ${
                  day <= 5 ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-400'
                }`}
              >
                {day}
              </div>
            ))}
          </div>
          <p className="text-xs mt-3 text-gray-500">¡Mantén tu racha diaria para ganar bonificaciones de XP!</p>
        </div>
        
        {/* Próximos desafíos */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="font-semibold text-gray-800 mb-3">Próximos desafíos</h3>
          <div className="space-y-3">
            <div className="flex items-center p-2 bg-purple-50 rounded-lg">
              <div className="p-2 bg-purple-100 rounded-full mr-3">
                <FaTrophy className="text-sm text-purple-600" />
              </div>
              <div className="text-sm">
                <p className="text-gray-800 font-medium">Completar 3 lecciones</p>
                <p className="text-gray-500 text-xs">+100 XP</p>
              </div>
            </div>
            <div className="flex items-center p-2 bg-blue-50 rounded-lg">
              <div className="p-2 bg-blue-100 rounded-full mr-3">
                <FaMedal className="text-sm text-blue-600" />
              </div>
              <div className="text-sm">
                <p className="text-gray-800 font-medium">Obtener {'>'} 80% en un examen</p>
                <p className="text-gray-500 text-xs">+250 XP</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
        <div className="flex border-b">
          <button
            className={`py-3 px-6 text-sm font-medium ${
              activeTab === 'achievements' 
                ? 'text-purple-600 border-b-2 border-purple-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('achievements')}
          >
            Logros
          </button>
          <button
            className={`py-3 px-6 text-sm font-medium ${
              activeTab === 'badges' 
                ? 'text-purple-600 border-b-2 border-purple-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('badges')}
          >
            Insignias
          </button>
          <button
            className={`py-3 px-6 text-sm font-medium ${
              activeTab === 'leaderboard' 
                ? 'text-purple-600 border-b-2 border-purple-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('leaderboard')}
          >
            Clasificación
          </button>
        </div>
        
        <div className="p-6">
          {/* Contenido de logros */}
          {activeTab === 'achievements' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {achievements.map(achievement => (
                <div 
                  key={achievement.id} 
                  className={`border rounded-lg p-4 flex ${
                    achievement.completed ? 'border-green-200 bg-green-50' : 'border-gray-200'
                  }`}
                >
                  <div className={`p-3 rounded-full mr-4 ${
                    achievement.completed ? 'bg-green-100' : 'bg-gray-100'
                  }`}>
                    {achievement.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">{achievement.name}</h3>
                    <p className="text-sm text-gray-600 mb-2">{achievement.description}</p>
                    
                    {achievement.progress !== undefined && achievement.totalRequired !== undefined && (
                      <div>
                        <div className="flex justify-between mb-1 text-xs text-gray-500">
                          <span>{achievement.progress} / {achievement.totalRequired}</span>
                          <span>{Math.round((achievement.progress / achievement.totalRequired) * 100)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div 
                            className="bg-purple-600 rounded-full h-1.5" 
                            style={{ width: `${(achievement.progress / achievement.totalRequired) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                    
                    {achievement.completed && (
                      <span className="inline-block mt-2 text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
                        Completado
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Contenido de insignias */}
          {activeTab === 'badges' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {badges.map(badge => (
                <div 
                  key={badge.id} 
                  className={`rounded-lg overflow-hidden border ${
                    badge.earned ? 'border-yellow-200' : 'border-gray-200 opacity-60'
                  }`}
                >
                  <div className="relative h-36">
                    <Image 
                      src={badge.image} 
                      alt={badge.name} 
                      fill
                      style={{ objectFit: 'cover' }}
                    />
                    {!badge.earned && (
                      <div className="absolute inset-0 bg-gray-900/50 flex items-center justify-center">
                        <span className="bg-gray-900/70 text-white px-3 py-1 rounded-full text-xs">
                          Bloqueado
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex justify-between items-start">
                      <h3 className="font-semibold text-gray-800">{badge.name}</h3>
                      {badge.earned && badge.level && renderBadgeLevel(badge.level)}
                    </div>
                    <p className="text-xs text-gray-600 mt-1">{badge.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Contenido de tabla de clasificación */}
          {activeTab === 'leaderboard' && (
            <div>
              <div className="flex justify-between mb-4">
                <h3 className="font-semibold text-gray-800">Top estudiantes esta semana</h3>
                <select className="border border-gray-300 rounded text-sm px-2 py-1">
                  <option>Esta semana</option>
                  <option>Este mes</option>
                  <option>Todo el tiempo</option>
                </select>
              </div>
              
              <div className="space-y-2">
                {leaderboard.map(item => (
                  <div 
                    key={item.position} 
                    className={`flex items-center p-3 rounded-lg ${
                      item.isCurrentUser ? 'bg-purple-50 border border-purple-200' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="w-8 h-8 flex items-center justify-center font-bold text-sm mr-3">
                      {item.position <= 3 ? (
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          item.position === 1 
                            ? 'bg-yellow-500 text-white' 
                            : item.position === 2 
                              ? 'bg-gray-300 text-gray-800' 
                              : 'bg-amber-700 text-white'
                        }`}>
                          {item.position}
                        </div>
                      ) : (
                        <span className="text-gray-500">{item.position}</span>
                      )}
                    </div>
                    
                    <div className="relative w-10 h-10 rounded-full overflow-hidden mr-3">
                      <Image 
                        src={item.user.avatar} 
                        alt={item.user.name} 
                        fill
                        style={{ objectFit: 'cover' }}
                      />
                    </div>
                    
                    <div className="flex-grow">
                      <h4 className={`font-medium ${item.isCurrentUser ? 'text-purple-700' : 'text-gray-800'}`}>
                        {item.user.name} {item.isCurrentUser && <span className="text-xs">(Tú)</span>}
                      </h4>
                    </div>
                    
                    <div className="font-semibold text-gray-700">
                      {item.user.points} XP
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 text-center">
                <button className="text-purple-600 hover:text-purple-800 text-sm font-medium">
                  Ver clasificación completa
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Gamification