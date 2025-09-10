import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand, QueryCommand, ScanCommand } from '@aws-sdk/lib-dynamodb'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime'
import { AWS_CONFIG } from '../config'
import { awsCredentialsService } from './awsCredentialsService'

// Variables para los clientes AWS
let dynamoClient: DynamoDBClient
let docClient: DynamoDBDocumentClient
let s3Client: S3Client
let bedrockClient: BedrockRuntimeClient
let clientsInitialized = false

// Función para inicializar los clientes AWS con credenciales temporales
async function initializeAWSClients() {
  if (clientsInitialized) return
  
  try {
    console.log('🔧 Inicializando clientes AWS con credenciales temporales...')
    const credentials = await awsCredentialsService.getCredentials()
    
    const awsConfig = {
      region: AWS_CONFIG.region,
      credentials: credentials
    }
    
    dynamoClient = new DynamoDBClient(awsConfig)
    docClient = DynamoDBDocumentClient.from(dynamoClient)
    s3Client = new S3Client(awsConfig)
    bedrockClient = new BedrockRuntimeClient(awsConfig)
    
    clientsInitialized = true
    console.log('✅ Clientes AWS inicializados correctamente')
  } catch (error) {
    console.error('❌ Error inicializando clientes AWS:', error)
    throw error
  }
}

// Constantes para el bucket vectorial existente
const VECTOR_BUCKET_NAME = 'cogniaintellilearncontent'
const CONTENT_BUCKET_NAME = 'cogniaintellilearncontent'
const COURSES_TABLE = 'intellilearn-courses'
const MODULES_TABLE = 'intellilearn-modules'
const LESSONS_TABLE = 'intellilearn-lessons'
const USER_PROGRESS_TABLE = 'intellilearn-user-progress'

// Tipos de datos
export interface Course {
  id: string
  title: string
  description: string
  instructor: string
  thumbnail: string
  imageUrl?: string // Nueva propiedad para la imagen personalizada del curso
  category: string
  level: 'beginner' | 'intermediate' | 'advanced'
  duration: string
  rating: number
  totalStudents: number
  price: number
  tags: string[]
  modules: Module[]
  createdAt: string
  updatedAt: string
  isPublished: boolean
}

export interface Module {
  id: string
  courseId: string
  title: string
  description: string
  order: number
  lessons: Lesson[]
  createdAt: string
  updatedAt: string
}

export interface Lesson {
  id: string
  moduleId: string
  courseId: string
  title: string
  description: string
  type: 'video' | 'reading' | 'quiz' | 'assignment' | 'podcast' | 'image' | 'voice_session'
  content: string
  videoUrl?: string
  duration: string
  order: number
  resources: LessonResource[]
  createdAt: string
  updatedAt: string
}

export interface LessonResource {
  id: string
  name: string
  type: 'pdf' | 'link' | 'file'
  url: string
}

export interface UserProgress {
  userId: string
  courseId: string
  moduleId: string
  lessonId: string
  completed: boolean
  completedAt?: string
  timeSpent: number
  lastAccessed: string
}

export interface VectorContent {
  id: string
  courseId: string
  lessonId: string
  content: string
  embedding: number[]
  metadata: {
    title: string
    type: string
    duration: string
    instructor: string
    category: string
    level: string
    tags: string[]
  }
}

// Clave para localStorage
const COURSES_STORAGE_KEY = 'intellilearn_courses'

// Datos iniciales del curso de Project Management
const INITIAL_PROJECT_MANAGEMENT_COURSE: Course = {
  id: '000000000',
  title: 'Fundamentos de Project Management',
  description: 'Aprende los conceptos básicos de gestión de proyectos con metodologías ágiles y tradicionales.',
  instructor: 'Dr. Carlos Mendoza',
  thumbnail: '/assets/images/Image.svg',
  imageUrl: '/assets/images/course-pm.jpg', // Imagen por defecto del curso
  category: 'Management',
  level: 'beginner',
  duration: '6 horas',
  rating: 4.8,
  totalStudents: 1247,
  price: 99,
  tags: ['Project Management', 'Agile', 'Scrum', 'Leadership'],
  modules: [
    {
      id: 'module_1',
      courseId: '1',
      title: 'Introducción al Project Management',
      description: 'Conceptos fundamentales y metodologías básicas',
      order: 1,
      lessons: [
        {
          id: 'lesson_1_1',
          moduleId: 'module_1',
          courseId: '1',
          title: '¿Qué es Project Management?',
          description: 'Introducción a los conceptos básicos de gestión de proyectos',
          type: 'video',
          content: 'En esta lección aprenderás los fundamentos del Project Management, incluyendo las fases del proyecto, los stakeholders clave y las metodologías más utilizadas en la industria.',
          videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
          duration: '15 min',
          order: 1,
          resources: [
            {
              id: 'res_1',
              name: 'Guía de Project Management',
              type: 'pdf',
              url: '/resources/pm-guide.pdf'
            }
          ],
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-15T10:00:00Z'
        },
        {
          id: 'lesson_1_2',
          moduleId: 'module_1',
          courseId: '1',
          title: 'Metodologías Ágiles vs Tradicionales',
          description: 'Comparación entre enfoques ágiles y cascada',
          type: 'reading',
          content: `
            <h2>Metodologías de Gestión de Proyectos</h2>
            <p>Existen dos enfoques principales en la gestión de proyectos:</p>
            
            <h3>1. Metodología Tradicional (Cascada)</h3>
            <ul>
              <li><strong>Planificación secuencial:</strong> Cada fase debe completarse antes de pasar a la siguiente</li>
              <li><strong>Documentación extensa:</strong> Requiere documentación detallada en cada etapa</li>
              <li><strong>Control estricto:</strong> Cambios son difíciles de implementar una vez iniciado</li>
              <li><strong>Ideal para:</strong> Proyectos con requisitos claros y estables</li>
            </ul>
            
            <h3>2. Metodologías Ágiles</h3>
            <ul>
              <li><strong>Iterativo e incremental:</strong> Desarrollo en sprints cortos</li>
              <li><strong>Flexibilidad:</strong> Adaptación rápida a cambios</li>
              <li><strong>Colaboración:</strong> Comunicación constante con stakeholders</li>
              <li><strong>Ideal para:</strong> Proyectos con requisitos cambiantes</li>
            </ul>
            
            <h3>Scrum Framework</h3>
            <p>Scrum es el framework ágil más popular, que incluye:</p>
            <ul>
              <li><strong>Roles:</strong> Product Owner, Scrum Master, Development Team</li>
              <li><strong>Eventos:</strong> Sprint Planning, Daily Standup, Sprint Review, Retrospective</li>
              <li><strong>Artefactos:</strong> Product Backlog, Sprint Backlog, Increment</li>
            </ul>
          `,
          duration: '20 min',
          order: 2,
          resources: [
            {
              id: 'res_2',
              name: 'Scrum Guide',
              type: 'link',
              url: 'https://scrumguides.org/'
            }
          ],
          createdAt: '2024-01-15T11:00:00Z',
          updatedAt: '2024-01-15T11:00:00Z'
        },
        {
          id: 'lesson_1_3',
          moduleId: 'module_1',
          courseId: '1',
          title: 'Quiz: Conceptos Básicos',
          description: 'Evaluación de conocimientos fundamentales',
          type: 'quiz',
          content: 'Pon a prueba tus conocimientos sobre los conceptos básicos de Project Management.',
          duration: '10 min',
          order: 3,
          resources: [],
          createdAt: '2024-01-15T12:00:00Z',
          updatedAt: '2024-01-15T12:00:00Z'
        }
      ],
      createdAt: '2024-01-15T09:00:00Z',
      updatedAt: '2024-01-15T09:00:00Z'
    },
    {
      id: 'module_2',
      courseId: '1',
      title: 'Planificación y Ejecución',
      description: 'Técnicas de planificación y gestión de la ejecución',
      order: 2,
      lessons: [
        {
          id: 'lesson_2_1',
          moduleId: 'module_2',
          courseId: '1',
          title: 'Work Breakdown Structure (WBS)',
          description: 'Cómo descomponer un proyecto en tareas manejables',
          type: 'video',
          content: 'Aprende a crear una estructura de desglose del trabajo efectiva para organizar y planificar tu proyecto.',
          videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
          duration: '25 min',
          order: 1,
          resources: [
            {
              id: 'res_3',
              name: 'Plantilla WBS',
              type: 'file',
              url: '/resources/wbs-template.xlsx'
            }
          ],
          createdAt: '2024-01-15T13:00:00Z',
          updatedAt: '2024-01-15T13:00:00Z'
        },
        {
          id: 'lesson_2_2',
          moduleId: 'module_2',
          courseId: '1',
          title: 'Gestión de Riesgos',
          description: 'Identificación y mitigación de riesgos del proyecto',
          type: 'reading',
          content: `
            <h2>Gestión de Riesgos en Proyectos</h2>
            <p>La gestión de riesgos es un proceso continuo que incluye:</p>
            
            <h3>1. Identificación de Riesgos</h3>
            <ul>
              <li>Brainstorming con el equipo</li>
              <li>Análisis de proyectos similares</li>
              <li>Consulta con expertos</li>
              <li>Revisión de documentación</li>
            </ul>
            
            <h3>2. Análisis de Riesgos</h3>
            <ul>
              <li><strong>Probabilidad:</strong> ¿Qué tan probable es que ocurra?</li>
              <li><strong>Impacto:</strong> ¿Qué tan grave sería si ocurre?</li>
              <li><strong>Matriz de Riesgos:</strong> Clasificación por probabilidad x impacto</li>
            </ul>
            
            <h3>3. Estrategias de Respuesta</h3>
            <ul>
              <li><strong>Evitar:</strong> Eliminar la causa del riesgo</li>
              <li><strong>Mitigar:</strong> Reducir probabilidad o impacto</li>
              <li><strong>Transferir:</strong> Pasar el riesgo a terceros</li>
              <li><strong>Aceptar:</strong> Reconocer y monitorear</li>
            </ul>
          `,
          duration: '30 min',
          order: 2,
          resources: [
            {
              id: 'res_4',
              name: 'Matriz de Riesgos',
              type: 'file',
              url: '/resources/risk-matrix.xlsx'
            }
          ],
          createdAt: '2024-01-15T14:00:00Z',
          updatedAt: '2024-01-15T14:00:00Z'
        }
      ],
      createdAt: '2024-01-15T13:00:00Z',
      updatedAt: '2024-01-15T13:00:00Z'
    }
  ],
  createdAt: '2024-01-15T08:00:00Z',
  updatedAt: '2024-01-15T08:00:00Z',
  isPublished: true
}

/**
 * Servicio principal para gestión de cursos con persistencia real
 * Utiliza localStorage como persistencia temporal y se prepara para AWS
 */
export class CourseService {
  
  /**
   * Obtiene las credenciales de AWS desde la sesión de Cognito
   */
  private async getAWSCredentials(): Promise<any | null> {
    try {
      // Intentar obtener credenciales de la sesión de Cognito
      // Por ahora, trabajamos con localStorage hasta configurar correctamente el backend
      return null
    } catch (error) {
      console.log('No AWS credentials available, using localStorage')
      return null
    }
  }

  /**
   * Carga cursos desde localStorage o inicializa con datos por defecto
   */
  private loadCoursesFromStorage(): Record<string, Course> {
    if (typeof window === 'undefined') {
      // Si estamos en el servidor, devolver datos por defecto
      return { '000000000': INITIAL_PROJECT_MANAGEMENT_COURSE }
    }

    try {
      const stored = localStorage.getItem(COURSES_STORAGE_KEY)
      if (stored) {
        const courses = JSON.parse(stored)
        console.log('📦 Courses loaded from localStorage')
        
        // Migrar curso '1' a '000000000' si existe
        if (courses['1'] && !courses['000000000']) {
          courses['000000000'] = { ...courses['1'], id: '000000000' }
          delete courses['1']
          this.saveCoursesToStorage(courses)
          console.log('🔄 Migrated course from ID 1 to 000000000')
        }
        
        return courses
      }
    } catch (error) {
      console.error('Error loading courses from localStorage:', error)
    }

    // Si no hay datos almacenados, inicializar con el curso por defecto
    const initialCourses = { '000000000': { ...INITIAL_PROJECT_MANAGEMENT_COURSE, id: '000000000' } }
    this.saveCoursesToStorage(initialCourses)
    console.log('🆕 Initialized courses with default data')
    return initialCourses
  }

  /**
   * Guarda cursos en localStorage
   */
  private saveCoursesToStorage(courses: Record<string, Course>): void {
    if (typeof window === 'undefined') return

    try {
      localStorage.setItem(COURSES_STORAGE_KEY, JSON.stringify(courses))
      console.log('💾 Courses saved to localStorage')
    } catch (error) {
      console.error('Error saving courses to localStorage:', error)
    }
  }

  /**
   * Sube un archivo a S3 y devuelve la URL
   */
  async uploadFile(file: File, folder: string = 'uploads'): Promise<string> {
    try {
      console.log(`📤 Uploading file: ${file.name}`)
      
      // Por ahora, simular la subida y devolver una URL mock
      // TODO: Implementar subida real a S3
      const mockUrl = `https://intellilearn-content.s3.amazonaws.com/${folder}/${Date.now()}_${file.name}`
      
      // Simular delay de subida
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      console.log(`✅ File uploaded: ${mockUrl}`)
      return mockUrl
    } catch (error) {
      console.error('Error uploading file:', error)
      throw new Error('Failed to upload file')
    }
  }

  /**
   * Genera embeddings usando Amazon Bedrock Titan
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    try {
      // Por ahora devolvemos un embedding mock
      console.log('🔮 Generating embedding for text...')
      return new Array(1536).fill(0).map(() => Math.random())
    } catch (error) {
      console.error('Error generating embedding:', error)
      return new Array(1536).fill(0).map(() => Math.random())
    }
  }

  /**
   * Almacena contenido vectorial (preparado para S3 Vectors)
   */
  private async storeVectorContent(vectorContent: VectorContent): Promise<void> {
    try {
      console.log(`🔮 Storing vector content for lesson ${vectorContent.lessonId}`)
      // TODO: Implementar almacenamiento real en S3 Vectors
      
      // Por ahora solo logueamos
      console.log('📊 Vector content prepared for S3 Vectors')
    } catch (error) {
      console.error('Error storing vector content:', error)
    }
  }

  /**
   * Obtiene un curso por ID desde DynamoDB o localStorage
   */
  async getCourse(courseId: string): Promise<Course | null> {
    try {
      console.log(`🔍 Getting course: ${courseId}`)
      
      // First try to get from localStorage (immediate availability)
      const courses = this.loadCoursesFromStorage()
      const localCourse = courses[courseId]
      
      if (localCourse) {
        console.log(`✅ Course ${courseId} found in localStorage: ${localCourse.title}`)
        return localCourse
      }
      
      // If not in localStorage and it's the PMP course, try DynamoDB
      if (courseId === '000000000') {
        try {
          // Solo intentar inicializar AWS si tenemos un usuario autenticado
          const user = typeof window !== 'undefined' ? localStorage.getItem('user') : null
          if (user) {
            await initializeAWSClients()
            const course = await this.getCourseFromDynamoDB(courseId)
            if (course) {
              console.log(`✅ Course ${courseId} loaded from DynamoDB: ${course.title}`)
              // Guardar en localStorage para acceso offline
              courses[courseId] = course
              this.saveCoursesToStorage(courses)
              return course
            }
          }
        } catch (error) {
          console.log('⚠️ Failed to load from DynamoDB:', error)
          // Continue to fallback logic
        }
      }
      
      console.log(`❌ Course ${courseId} not found`)
      return null
    } catch (error) {
      console.error('Error getting course:', error)
      // En caso de error, intentar cargar desde localStorage como último recurso
      const courses = this.loadCoursesFromStorage()
      return courses[courseId] || null
    }
  }

  /**
   * Load course from DynamoDB with all modules and lessons
   */
  private async getCourseFromDynamoDB(courseId: string): Promise<Course | null> {
    try {
      console.log(`📊 Loading course ${courseId} from DynamoDB...`)
      
      // Asegurar que los clientes están inicializados
      await initializeAWSClients()
      
      // Get course metadata
      const courseResponse = await docClient.send(new GetCommand({
        TableName: 'Intellilearn_Data',
        Key: {
          id: `COURSE#${courseId}`,
          client_id: 'METADATA'
        }
      }))

      if (!courseResponse.Item) {
        console.log(`❌ Course ${courseId} not found in DynamoDB`)
        return null
      }

      const courseData = courseResponse.Item

      // Get all modules for this course
      const modulesResponse = await docClient.send(new QueryCommand({
        TableName: 'Intellilearn_Data',
        IndexName: 'client-document-index',
        KeyConditionExpression: 'client_id = :clientId AND document_type = :docType',
        FilterExpression: 'courseId = :courseId',
        ExpressionAttributeValues: {
          ':clientId': 'METADATA',
          ':docType': 'MODULE',
          ':courseId': courseId
        }
      }))

      const modules: Module[] = []
      
      if (modulesResponse.Items) {
        // Sort modules by order
        const sortedModules = modulesResponse.Items.sort((a, b) => (a.order || 0) - (b.order || 0))
        
        for (const moduleItem of sortedModules) {
          // Get lessons for each module
          const lessonsResponse = await docClient.send(new QueryCommand({
            TableName: 'Intellilearn_Data',
            IndexName: 'client-document-index',
            KeyConditionExpression: 'client_id = :clientId AND document_type = :docType',
            FilterExpression: 'moduleId = :moduleId',
            ExpressionAttributeValues: {
              ':clientId': 'METADATA',
              ':docType': 'LESSON',
              ':moduleId': moduleItem.moduleId
            }
          }))

          const lessons: Lesson[] = []
          if (lessonsResponse.Items) {
            const sortedLessons = lessonsResponse.Items.sort((a, b) => (a.order || 0) - (b.order || 0))
            
            for (const lessonItem of sortedLessons) {
              lessons.push({
                id: lessonItem.lessonId,
                moduleId: moduleItem.moduleId,
                courseId: courseId,
                title: lessonItem.title,
                description: lessonItem.description,
                type: lessonItem.type || 'video',
                content: lessonItem.content || '',
                videoUrl: lessonItem.videoUrl || '',
                duration: lessonItem.duration || '30 min',
                order: lessonItem.order || 0,
                resources: [],
                createdAt: lessonItem.created_date || new Date().toISOString(),
                updatedAt: lessonItem.updated_date || new Date().toISOString()
              })
            }
          }

          modules.push({
            id: moduleItem.moduleId,
            courseId: courseId,
            title: moduleItem.title,
            description: moduleItem.description,
            order: moduleItem.order || 0,
            lessons: lessons,
            createdAt: moduleItem.created_date || new Date().toISOString(),
            updatedAt: moduleItem.updated_date || new Date().toISOString()
          })
        }
      }

      // Build the complete course object
      const course: Course = {
        id: courseId,
        title: courseData.title || 'PMP Certification Masterclass',
        description: courseData.description || 'Complete PMP preparation course',
        instructor: courseData.instructor || 'CognIA Project Management Institute',
        thumbnail: courseData.thumbnail || '/assets/images/course-pm.jpg',
        imageUrl: courseData.imageUrl || '/assets/images/course-pm.jpg',
        category: courseData.category || 'Project Management',
        level: courseData.level || 'intermediate',
        duration: courseData.duration || '120 hours',
        rating: courseData.rating || 4.8,
        totalStudents: courseData.totalStudents || 1250,
        price: courseData.price || 299,
        tags: courseData.tags || ['PMP', 'Project Management', 'Certification', 'PMBOK'],
        modules: modules,
        createdAt: courseData.created_date || new Date().toISOString(),
        updatedAt: courseData.updated_date || new Date().toISOString(),
        isPublished: courseData.status === 'active'
      }

      console.log(`✅ Successfully loaded course from DynamoDB: ${course.title} with ${modules.length} modules`)
      return course

    } catch (error) {
      console.error('❌ Error loading course from DynamoDB:', error)
      throw error
    }
  }

  /**
   * Obtiene todos los cursos disponibles
   */
  async getAllCourses(): Promise<Course[]> {
    try {
      console.log('🔍 Getting all courses')
      
      const courses = this.loadCoursesFromStorage()
      const courseList = Object.values(courses)
      
      console.log(`✅ Found ${courseList.length} courses`)
      return courseList
    } catch (error) {
      console.error('Error getting all courses:', error)
      throw new Error('Failed to get courses')
    }
  }

  /**
   * Actualiza un curso completo
   */
  async updateCourse(courseId: string, updates: Partial<Course>): Promise<Course> {
    try {
      console.log(`🔄 Updating course: ${courseId}`)
      
      const courses = this.loadCoursesFromStorage()
      const course = courses[courseId]
      
      if (!course) {
        throw new Error('Course not found')
      }

      const now = new Date().toISOString()
      const updatedCourse: Course = {
        ...course,
        ...updates,
        updatedAt: now
      }

      courses[courseId] = updatedCourse
      this.saveCoursesToStorage(courses)

      // Generar y almacenar contenido vectorial si cambió información relevante
      if (updates.title || updates.description || updates.category) {
        const courseText = `${updatedCourse.title} ${updatedCourse.description} ${updatedCourse.category} ${updatedCourse.tags.join(' ')}`
        const embedding = await this.generateEmbedding(courseText)
        
        const vectorContent: VectorContent = {
          id: `course_${courseId}`,
          courseId: courseId,
          lessonId: 'course_overview',
          content: courseText,
          embedding: embedding,
          metadata: {
            title: updatedCourse.title,
            type: 'course',
            duration: updatedCourse.duration,
            instructor: updatedCourse.instructor,
            category: updatedCourse.category,
            level: updatedCourse.level,
            tags: updatedCourse.tags
          }
        }

        await this.storeVectorContent(vectorContent)
      }

      console.log(`✅ Course ${courseId} updated successfully`)
      return updatedCourse
    } catch (error) {
      console.error('Error updating course:', error)
      throw new Error('Failed to update course')
    }
  }

  /**
   * Obtiene todos los módulos de un curso
   */
  async getCourseModules(courseId: string): Promise<Module[]> {
    try {
      const course = await this.getCourse(courseId)
      return course ? course.modules : []
    } catch (error) {
      console.error('Error getting course modules:', error)
      throw new Error('Failed to get course modules')
    }
  }

  /**
   * Obtiene todas las lecciones de un módulo
   */
  async getModuleLessons(moduleId: string): Promise<Lesson[]> {
    try {
      const courses = this.loadCoursesFromStorage()
      for (const course of Object.values(courses)) {
        const moduleItem = course.modules.find(m => m.id === moduleId)
        if (moduleItem) {
          return moduleItem.lessons
        }
      }
      return []
    } catch (error) {
      console.error('Error getting module lessons:', error)
      throw new Error('Failed to get module lessons')
    }
  }

  /**
   * Crea un nuevo módulo
   */
  async createModule(moduleData: Omit<Module, 'id' | 'createdAt' | 'updatedAt' | 'lessons'>): Promise<Module> {
    try {
      console.log(`➕ Creating new module for course: ${moduleData.courseId}`)
      
      const courses = this.loadCoursesFromStorage()
      const course = courses[moduleData.courseId]
      
      if (!course) {
        throw new Error('Course not found')
      }

      const moduleId = `module_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const now = new Date().toISOString()
      
      const newModule: Module = {
        ...moduleData,
        id: moduleId,
        createdAt: now,
        updatedAt: now,
        lessons: []
      }

      course.modules.push(newModule)
      course.modules.sort((a, b) => a.order - b.order)
      course.updatedAt = now

      this.saveCoursesToStorage(courses)

      console.log(`✅ Module ${moduleId} created successfully`)
      return newModule
    } catch (error) {
      console.error('Error creating module:', error)
      throw new Error('Failed to create module')
    }
  }

  /**
   * Actualiza un módulo existente
   */
  async updateModule(moduleId: string, updates: Partial<Module>): Promise<void> {
    try {
      console.log(`🔄 Updating module: ${moduleId}`)
      
      const courses = this.loadCoursesFromStorage()
      const now = new Date().toISOString()
      
      for (const course of Object.values(courses)) {
        const moduleIndex = course.modules.findIndex(m => m.id === moduleId)
        if (moduleIndex !== -1) {
          course.modules[moduleIndex] = {
            ...course.modules[moduleIndex],
            ...updates,
            updatedAt: now
          }
          course.updatedAt = now
          
          this.saveCoursesToStorage(courses)
          console.log(`✅ Module ${moduleId} updated successfully`)
          return
        }
      }
      
      throw new Error('Module not found')
    } catch (error) {
      console.error('Error updating module:', error)
      throw new Error('Failed to update module')
    }
  }

  /**
   * Elimina un módulo
   */
  async deleteModule(moduleId: string): Promise<void> {
    try {
      console.log(`🗑️ Deleting module: ${moduleId}`)
      
      const courses = this.loadCoursesFromStorage()
      const now = new Date().toISOString()
      
      for (const course of Object.values(courses)) {
        const moduleIndex = course.modules.findIndex(m => m.id === moduleId)
        if (moduleIndex !== -1) {
          course.modules.splice(moduleIndex, 1)
          course.updatedAt = now
          
          this.saveCoursesToStorage(courses)
          console.log(`✅ Module ${moduleId} deleted successfully`)
          return
        }
      }
      
      throw new Error('Module not found')
    } catch (error) {
      console.error('Error deleting module:', error)
      throw new Error('Failed to delete module')
    }
  }

  /**
   * Crea una nueva lección
   */
  async createLesson(lessonData: Omit<Lesson, 'id' | 'createdAt' | 'updatedAt'>): Promise<Lesson> {
    try {
      console.log(`➕ Creating new lesson for module: ${lessonData.moduleId}`)
      
      const courses = this.loadCoursesFromStorage()
      const course = courses[lessonData.courseId]
      
      if (!course) {
        throw new Error('Course not found')
      }

      const moduleItem = course.modules.find(m => m.id === lessonData.moduleId)
      if (!moduleItem) {
        throw new Error('Module not found')
      }

      const lessonId = `lesson_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const now = new Date().toISOString()
      
      const newLesson: Lesson = {
        ...lessonData,
        id: lessonId,
        createdAt: now,
        updatedAt: now
      }

      moduleItem.lessons.push(newLesson)
      moduleItem.lessons.sort((a, b) => a.order - b.order)
      moduleItem.updatedAt = now
      course.updatedAt = now

      this.saveCoursesToStorage(courses)

      // Generar y almacenar contenido vectorial
      const lessonText = `${newLesson.title} ${newLesson.description} ${newLesson.content}`
      const embedding = await this.generateEmbedding(lessonText)
      
      const vectorContent: VectorContent = {
        id: `lesson_${lessonId}`,
        courseId: newLesson.courseId,
        lessonId: lessonId,
        content: lessonText,
        embedding: embedding,
        metadata: {
          title: newLesson.title,
          type: newLesson.type,
          duration: newLesson.duration,
          instructor: course.instructor,
          category: course.category,
          level: course.level,
          tags: course.tags
        }
      }

      await this.storeVectorContent(vectorContent)

      console.log(`✅ Lesson ${lessonId} created successfully`)
      return newLesson
    } catch (error) {
      console.error('Error creating lesson:', error)
      throw new Error('Failed to create lesson')
    }
  }

  /**
   * Actualiza una lección existente
   */
  async updateLesson(lessonId: string, updates: Partial<Lesson>): Promise<Lesson> {
    try {
      console.log(`🔄 Updating lesson: ${lessonId}`)
      
      const courses = this.loadCoursesFromStorage()
      const now = new Date().toISOString()
      
      for (const course of Object.values(courses)) {
        for (const moduleItem of course.modules) {
          const lessonIndex = moduleItem.lessons.findIndex(l => l.id === lessonId)
          if (lessonIndex !== -1) {
            const updatedLesson = {
              ...moduleItem.lessons[lessonIndex],
              ...updates,
              updatedAt: now
            }
            
            moduleItem.lessons[lessonIndex] = updatedLesson
            moduleItem.updatedAt = now
            course.updatedAt = now

            this.saveCoursesToStorage(courses)

            // Actualizar contenido vectorial si el contenido cambió
            if (updates.content || updates.title || updates.description) {
              const lessonText = `${updatedLesson.title} ${updatedLesson.description} ${updatedLesson.content}`
              const embedding = await this.generateEmbedding(lessonText)
              
              const vectorContent: VectorContent = {
                id: `lesson_${lessonId}`,
                courseId: updatedLesson.courseId,
                lessonId: lessonId,
                content: lessonText,
                embedding: embedding,
                metadata: {
                  title: updatedLesson.title,
                  type: updatedLesson.type,
                  duration: updatedLesson.duration,
                  instructor: course.instructor,
                  category: course.category,
                  level: course.level,
                  tags: course.tags
                }
              }

              await this.storeVectorContent(vectorContent)
            }
            
            console.log(`✅ Lesson ${lessonId} updated successfully`)
            return updatedLesson
          }
        }
      }
      
      throw new Error('Lesson not found')
    } catch (error) {
      console.error('Error updating lesson:', error)
      throw new Error('Failed to update lesson')
    }
  }

  /**
   * Elimina una lección
   */
  async deleteLesson(lessonId: string): Promise<void> {
    try {
      console.log(`🗑️ Deleting lesson: ${lessonId}`)
      
      const courses = this.loadCoursesFromStorage()
      const now = new Date().toISOString()
      
      for (const course of Object.values(courses)) {
        for (const moduleItem of course.modules) {
          const lessonIndex = moduleItem.lessons.findIndex(l => l.id === lessonId)
          if (lessonIndex !== -1) {
            moduleItem.lessons.splice(lessonIndex, 1)
            moduleItem.updatedAt = now
            course.updatedAt = now
            
            this.saveCoursesToStorage(courses)
            console.log(`✅ Lesson ${lessonId} deleted successfully`)
            return
          }
        }
      }
      
      throw new Error('Lesson not found')
    } catch (error) {
      console.error('Error deleting lesson:', error)
      throw new Error('Failed to delete lesson')
    }
  }

  /**
   * Búsqueda semántica de contenido
   */
  async semanticSearch(query: string, courseId?: string, limit: number = 10): Promise<any[]> {
    try {
      console.log(`🔍 Searching for: "${query}"`)
      
      const courses = this.loadCoursesFromStorage()
      const results: any[] = []
      
      for (const course of Object.values(courses)) {
        if (courseId && course.id !== courseId) continue
        
        for (const moduleItem of course.modules) {
          for (const lesson of moduleItem.lessons) {
            const searchText = `${lesson.title} ${lesson.description} ${lesson.content}`.toLowerCase()
            if (searchText.includes(query.toLowerCase())) {
              results.push({
                title: lesson.title,
                excerpt: lesson.description,
                type: lesson.type,
                courseId: course.id,
                moduleId: moduleItem.id,
                lessonId: lesson.id,
                similarity: Math.random() * 0.3 + 0.7 // Mock similarity score
              })
            }
          }
        }
      }
      
      return results.slice(0, limit)
    } catch (error) {
      console.error('Error in semantic search:', error)
      return []
    }
  }

  /**
   * Obtiene recomendaciones de lecciones similares
   */
  async getRecommendations(lessonId: string, limit: number = 5): Promise<Lesson[]> {
    try {
      console.log(`💡 Getting recommendations for lesson: ${lessonId}`)
      
      const courses = this.loadCoursesFromStorage()
      const recommendations: Lesson[] = []
      
      for (const course of Object.values(courses)) {
        for (const moduleItem of course.modules) {
          for (const lesson of moduleItem.lessons) {
            if (lesson.id !== lessonId && recommendations.length < limit) {
              recommendations.push(lesson)
            }
          }
        }
      }
      
      return recommendations.slice(0, limit)
    } catch (error) {
      console.error('Error getting recommendations:', error)
      return []
    }
  }

  /**
   * Registra el progreso del usuario
   */
  async updateUserProgress(progress: UserProgress): Promise<void> {
    try {
      console.log(`📊 Updating progress for user ${progress.userId}`)
      // TODO: Implementar con DynamoDB
    } catch (error) {
      console.error('Error updating user progress:', error)
      throw new Error('Failed to update user progress')
    }
  }

  /**
   * Obtiene el progreso del usuario en un curso
   */
  async getUserProgress(userId: string, courseId: string): Promise<UserProgress[]> {
    try {
      console.log(`📊 Getting progress for user ${userId} in course ${courseId}`)
      // TODO: Implementar con DynamoDB
      return []
    } catch (error) {
      console.error('Error getting user progress:', error)
      throw new Error('Failed to get user progress')
    }
  }

  /**
   * Exporta todos los cursos (para migración a AWS)
   */
  async exportCourses(): Promise<Record<string, Course>> {
    try {
      console.log('📤 Exporting all courses')
      return this.loadCoursesFromStorage()
    } catch (error) {
      console.error('Error exporting courses:', error)
      throw new Error('Failed to export courses')
    }
  }

  /**
   * Importa cursos (desde AWS o backup)
   */
  async importCourses(courses: Record<string, Course>): Promise<void> {
    try {
      console.log('📥 Importing courses')
      this.saveCoursesToStorage(courses)
      console.log('✅ Courses imported successfully')
    } catch (error) {
      console.error('Error importing courses:', error)
      throw new Error('Failed to import courses')
    }
  }

  /**
   * Fuerza la limpieza del localStorage y reinicializa con datos correctos
   */
  async forceReset(): Promise<void> {
    if (typeof window !== 'undefined') {
      // Limpiar TODAS las claves relacionadas con intellilearn
      const keysToRemove = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && (key.includes('intellilearn') || key.includes('course') || key.includes('Course'))) {
          keysToRemove.push(key)
        }
      }
      
      keysToRemove.forEach(key => {
        localStorage.removeItem(key)
        console.log(`🗑️ Removed: ${key}`)
      })
      
      console.log('🧹 Cleared ALL course-related data from localStorage')
      
      // Reinicializar con el curso correcto
      const initialCourses = { '000000000': { ...INITIAL_PROJECT_MANAGEMENT_COURSE, id: '000000000' } }
      this.saveCoursesToStorage(initialCourses)
      console.log('🆕 Reinitialized with correct course ID: 000000000')
      
      // Forzar recarga para aplicar cambios
      setTimeout(() => {
        window.location.reload()
      }, 500)
    }
  }
}

// Instancia singleton del servicio
export const courseService = new CourseService() 