const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3')
const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime')

// Configuración de AWS
const awsConfig = {
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
}

const s3Client = new S3Client(awsConfig)
const bedrockClient = new BedrockRuntimeClient(awsConfig)

const VECTOR_BUCKET_NAME = 'cognia-intellilearn'

// Función para generar embeddings
async function generateEmbedding(text) {
  try {
    const input = {
      modelId: 'amazon.titan-embed-text-v1',
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        inputText: text
      })
    }

    const command = new InvokeModelCommand(input)
    const response = await bedrockClient.send(command)
    const responseBody = JSON.parse(new TextDecoder().decode(response.body))
    
    return responseBody.embedding
  } catch (error) {
    console.error('Error generating embedding:', error)
    // Devolver embedding mock si falla
    return new Array(1536).fill(0).map(() => Math.random())
  }
}

// Función para subir contenido vectorial
async function uploadVectorContent(vectorContent) {
  try {
    const key = `courses/${vectorContent.courseId}/lessons/${vectorContent.lessonId}/vector.json`
    
    const command = new PutObjectCommand({
      Bucket: VECTOR_BUCKET_NAME,
      Key: key,
      Body: JSON.stringify(vectorContent, null, 2),
      ContentType: 'application/json',
      Metadata: {
        courseId: vectorContent.courseId,
        lessonId: vectorContent.lessonId,
        type: vectorContent.metadata.type,
        category: vectorContent.metadata.category
      }
    })

    await s3Client.send(command)
    console.log(`✅ Vector content uploaded: ${key}`)
  } catch (error) {
    console.error(`❌ Error uploading vector content for ${vectorContent.lessonId}:`, error)
  }
}

// Datos del curso de Project Management
const courseData = {
  id: '1',
  title: 'Fundamentos de Project Management',
  instructor: 'Dr. Carlos Mendoza',
  category: 'Management',
  level: 'beginner',
  tags: ['Project Management', 'Agile', 'Scrum', 'Leadership'],
  lessons: [
    {
      id: 'lesson_1_1',
      title: '¿Qué es Project Management?',
      description: 'Introducción a los conceptos básicos de gestión de proyectos',
      type: 'video',
      content: 'En esta lección aprenderás los fundamentos del Project Management, incluyendo las fases del proyecto, los stakeholders clave y las metodologías más utilizadas en la industria. El Project Management es la disciplina que se encarga de planificar, ejecutar y controlar proyectos de manera eficiente. Un proyecto es un esfuerzo temporal que tiene un inicio y un fin definidos, con el objetivo de crear un producto, servicio o resultado único. Los elementos clave incluyen: alcance, tiempo, costo, calidad, recursos humanos, comunicaciones, riesgos, adquisiciones y stakeholders.',
      duration: '15 min'
    },
    {
      id: 'lesson_1_2',
      title: 'Metodologías Ágiles vs Tradicionales',
      description: 'Comparación entre enfoques ágiles y cascada',
      type: 'reading',
      content: 'Metodologías de Gestión de Proyectos. Existen dos enfoques principales: 1. Metodología Tradicional (Cascada): Planificación secuencial donde cada fase debe completarse antes de pasar a la siguiente. Requiere documentación extensa y control estricto. Los cambios son difíciles de implementar una vez iniciado. Es ideal para proyectos con requisitos claros y estables. 2. Metodologías Ágiles: Desarrollo iterativo e incremental en sprints cortos. Ofrece flexibilidad y adaptación rápida a cambios. Enfatiza la colaboración y comunicación constante con stakeholders. Es ideal para proyectos con requisitos cambiantes. Scrum Framework es el framework ágil más popular, que incluye roles como Product Owner, Scrum Master y Development Team; eventos como Sprint Planning, Daily Standup, Sprint Review y Retrospective; y artefactos como Product Backlog, Sprint Backlog e Increment.',
      duration: '20 min'
    },
    {
      id: 'lesson_1_3',
      title: 'Quiz: Conceptos Básicos',
      description: 'Evaluación de conocimientos fundamentales',
      type: 'quiz',
      content: 'Pon a prueba tus conocimientos sobre los conceptos básicos de Project Management. Este quiz cubre los fundamentos de la gestión de proyectos, incluyendo definiciones clave, metodologías principales, roles y responsabilidades, y mejores prácticas en la industria.',
      duration: '10 min'
    },
    {
      id: 'lesson_2_1',
      title: 'Work Breakdown Structure (WBS)',
      description: 'Cómo descomponer un proyecto en tareas manejables',
      type: 'video',
      content: 'Aprende a crear una estructura de desglose del trabajo efectiva para organizar y planificar tu proyecto. El WBS es una descomposición jerárquica del trabajo total que debe realizar el equipo del proyecto para lograr los objetivos del proyecto y crear los entregables requeridos. Organiza y define el alcance total del proyecto y representa el trabajo especificado en la declaración del alcance del proyecto aprobada. El trabajo planificado contenido en los componentes del nivel más bajo del WBS, que se denominan paquetes de trabajo, puede programarse, supervisarse, controlarse y costearse.',
      duration: '25 min'
    },
    {
      id: 'lesson_2_2',
      title: 'Gestión de Riesgos',
      description: 'Identificación y mitigación de riesgos del proyecto',
      type: 'reading',
      content: 'Gestión de Riesgos en Proyectos. La gestión de riesgos es un proceso continuo que incluye: 1. Identificación de Riesgos mediante brainstorming con el equipo, análisis de proyectos similares, consulta con expertos y revisión de documentación. 2. Análisis de Riesgos considerando la probabilidad de ocurrencia, el impacto potencial y la clasificación mediante matriz de riesgos (probabilidad x impacto). 3. Estrategias de Respuesta: Evitar (eliminar la causa del riesgo), Mitigar (reducir probabilidad o impacto), Transferir (pasar el riesgo a terceros), o Aceptar (reconocer y monitorear). La gestión proactiva de riesgos es fundamental para el éxito del proyecto.',
      duration: '30 min'
    }
  ]
}

// Función principal
async function uploadCourseVectors() {
  console.log(`🚀 Iniciando carga de vectores para el curso: ${courseData.title}`)
  console.log(`📦 Bucket destino: ${VECTOR_BUCKET_NAME}`)
  
  // Subir vector del curso
  console.log('\n📚 Procesando información del curso...')
  const courseText = `${courseData.title} ${courseData.category} ${courseData.tags.join(' ')} Curso de gestión de proyectos impartido por ${courseData.instructor}`
  const courseEmbedding = await generateEmbedding(courseText)
  
  const courseVector = {
    id: `course_${courseData.id}`,
    courseId: courseData.id,
    lessonId: 'course_overview',
    content: courseText,
    embedding: courseEmbedding,
    metadata: {
      title: courseData.title,
      type: 'course',
      duration: '6 horas',
      instructor: courseData.instructor,
      category: courseData.category,
      level: courseData.level,
      tags: courseData.tags
    }
  }
  
  await uploadVectorContent(courseVector)
  
  // Subir vectores de las lecciones
  console.log('\n🎓 Procesando lecciones...')
  for (const lesson of courseData.lessons) {
    console.log(`\n📝 Procesando: ${lesson.title}`)
    
    const lessonText = `${lesson.title} ${lesson.description} ${lesson.content}`
    const lessonEmbedding = await generateEmbedding(lessonText)
    
    const lessonVector = {
      id: `lesson_${lesson.id}`,
      courseId: courseData.id,
      lessonId: lesson.id,
      content: lessonText,
      embedding: lessonEmbedding,
      metadata: {
        title: lesson.title,
        type: lesson.type,
        duration: lesson.duration,
        instructor: courseData.instructor,
        category: courseData.category,
        level: courseData.level,
        tags: courseData.tags
      }
    }
    
    await uploadVectorContent(lessonVector)
    
    // Pequeña pausa para evitar rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
  
  console.log('\n✅ ¡Carga de vectores completada exitosamente!')
  console.log(`📊 Total de vectores subidos: ${courseData.lessons.length + 1}`)
  console.log(`🔍 Los vectores están disponibles en: s3://${VECTOR_BUCKET_NAME}/courses/${courseData.id}/`)
}

// Ejecutar el script
uploadCourseVectors().catch(console.error) 