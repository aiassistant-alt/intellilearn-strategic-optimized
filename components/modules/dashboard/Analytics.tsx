'use client'
import { useState } from 'react'
import { 
  FaChartLine, 
  FaCalendarAlt, 
  FaClock, 
  FaCheckCircle, 
  FaGraduationCap, 
  FaTrophy,
  FaChartPie,
  FaChartBar,
  FaLightbulb
} from 'react-icons/fa'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'

// Datos de ejemplo de análisis
const progressData = [
  { date: '01/05', progress: 0 },
  { date: '08/05', progress: 5 },
  { date: '15/05', progress: 12 },
  { date: '22/05', progress: 25 },
  { date: '29/05', progress: 40 },
  { date: '05/06', progress: 52 },
  { date: '12/06', progress: 75 }
]

const timeSpentData = [
  { name: 'Machine Learning', value: 24 },
  { name: 'Desarrollo Web', value: 13 },
  { name: 'Diseño UX/UI', value: 8 },
  { name: 'Ciencia de Datos', value: 18 },
  { name: 'Otros', value: 7 }
]

const learningStyleData = [
  { name: 'Visual', score: 80 },
  { name: 'Auditivo', score: 55 },
  { name: 'Lectura/Escritura', score: 70 },
  { name: 'Kinestésico', score: 40 }
]

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE']

const Analytics = () => {
  const [timeRange, setTimeRange] = useState('monthly')
  
  // Estadísticas generales
  const stats = {
    totalCourses: 5,
    completedCourses: 1,
    totalHours: 28,
    completedLessons: 32,
    certificatesEarned: 1,
    averageScore: 85
  }
  
  // Recomendaciones personalizadas basadas en análisis predictivo
  const recommendations = [
    "Basado en tu ritmo actual, deberías completar el curso de Machine Learning en 3 semanas",
    "Tu curva de aprendizaje sugiere mayor efectividad en sesiones por la tarde",
    "Recomendamos revisar los temas de Regresión Lineal antes de continuar con el módulo actual",
    "Los estudiantes con un perfil similar al tuyo también tomaron el curso de Deep Learning"
  ]

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Analytics</h1>
        <p className="text-gray-600">Estadísticas detalladas de tu progreso y recomendaciones personalizadas</p>
      </div>

      {/* Panel de estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6 flex items-center">
          <div className="bg-purple-100 p-4 rounded-lg mr-4">
            <FaGraduationCap className="text-2xl text-purple-600" />
          </div>
          <div>
            <p className="text-gray-500 text-sm">Cursos</p>
            <div className="flex items-end">
              <h3 className="text-2xl font-bold text-gray-800">{stats.completedCourses}</h3>
              <p className="text-gray-500 ml-1">/ {stats.totalCourses}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 flex items-center">
          <div className="bg-green-100 p-4 rounded-lg mr-4">
            <FaCheckCircle className="text-2xl text-green-600" />
          </div>
          <div>
            <p className="text-gray-500 text-sm">Lecciones completadas</p>
            <h3 className="text-2xl font-bold text-gray-800">{stats.completedLessons}</h3>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 flex items-center">
          <div className="bg-blue-100 p-4 rounded-lg mr-4">
            <FaClock className="text-2xl text-blue-600" />
          </div>
          <div>
            <p className="text-gray-500 text-sm">Horas de estudio</p>
            <h3 className="text-2xl font-bold text-gray-800">{stats.totalHours} h</h3>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 flex items-center">
          <div className="bg-yellow-100 p-4 rounded-lg mr-4">
            <FaTrophy className="text-2xl text-yellow-600" />
          </div>
          <div>
            <p className="text-gray-500 text-sm">Certificados</p>
            <h3 className="text-2xl font-bold text-gray-800">{stats.certificatesEarned}</h3>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 flex items-center">
          <div className="bg-indigo-100 p-4 rounded-lg mr-4">
            <FaChartLine className="text-2xl text-indigo-600" />
          </div>
          <div>
            <p className="text-gray-500 text-sm">Calificación promedio</p>
            <h3 className="text-2xl font-bold text-gray-800">{stats.averageScore}/100</h3>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 flex items-center">
          <div className="bg-red-100 p-4 rounded-lg mr-4">
            <FaCalendarAlt className="text-2xl text-red-600" />
          </div>
          <div>
            <p className="text-gray-500 text-sm">Último acceso</p>
            <h3 className="text-sm font-bold text-gray-800">Hoy, 14:30</h3>
          </div>
        </div>
      </div>

      {/* Visualizaciones de datos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Progreso a lo largo del tiempo */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-800">
              <FaChartLine className="inline mr-2 text-purple-600" />
              Progreso a lo largo del tiempo
            </h3>
            <select 
              className="border border-gray-300 rounded px-2 py-1 text-sm"
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <option value="weekly">Semanal</option>
              <option value="monthly">Mensual</option>
              <option value="yearly">Anual</option>
            </select>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={progressData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="progress" 
                  name="% Completado" 
                  stroke="#8884d8" 
                  activeDot={{ r: 8 }} 
                  strokeWidth={2} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tiempo dedicado por tema */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-800">
              <FaChartPie className="inline mr-2 text-purple-600" />
              Tiempo dedicado por tema
            </h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={timeSpentData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }: { name: string; percent: number }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {timeSpentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Estilo de aprendizaje */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-800">
              <FaChartBar className="inline mr-2 text-purple-600" />
              Tu estilo de aprendizaje
            </h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={learningStyleData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="score" name="Puntuación" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-sm text-gray-600 mt-4">Tu estilo de aprendizaje predominante es Visual. Te recomendamos materiales con diagramas, videos e infografías.</p>
        </div>

        {/* Recomendaciones */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            <FaLightbulb className="inline mr-2 text-yellow-500" />
            Recomendaciones Personalizadas
          </h3>
          <div className="space-y-4">
            {recommendations.map((recommendation, index) => (
              <div key={index} className="flex items-start">
                <div className="bg-purple-100 rounded-full p-2 mr-3 mt-1">
                  <div className="bg-purple-600 rounded-full w-2 h-2"></div>
                </div>
                <p className="text-gray-700">{recommendation}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Próximas metas */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-800 rounded-lg shadow-md p-6 text-white">
        <h3 className="text-lg font-semibold mb-4">Próxima meta sugerida</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/80 mb-2">Completa el módulo &quot;Algoritmos de Machine Learning&quot;</p>
            <div className="flex items-center">
              <div className="w-full bg-white/20 rounded-full h-2.5 mr-2 max-w-xs">
                <div className="bg-white h-2.5 rounded-full" style={{ width: '45%' }}></div>
              </div>
              <span className="text-sm">45%</span>
            </div>
          </div>
          <button className="bg-white text-purple-700 px-4 py-2 rounded-lg font-medium hover:bg-purple-50 transition-colors">
            Continuar
          </button>
        </div>
      </div>
    </div>
  )
}

export default Analytics