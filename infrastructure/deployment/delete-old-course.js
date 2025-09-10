const { DynamoDBClient } = require('@aws-sdk/client-dynamodb')
const { DynamoDBDocumentClient, DeleteCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb')

// Configuración AWS
const client = new DynamoDBClient({
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
})

const docClient = DynamoDBDocumentClient.from(client)

async function deleteOldCourse() {
  try {
    console.log('🗑️ Eliminando curso con ID "1" de DynamoDB...')
    
    // 1. Eliminar lecciones del curso
    console.log('📝 Eliminando lecciones...')
    const modulesResult = await docClient.send(new QueryCommand({
      TableName: 'intellilearn-modules',
      KeyConditionExpression: 'courseId = :courseId',
      ExpressionAttributeValues: {
        ':courseId': '1'
      }
    }))
    
    for (const module of modulesResult.Items || []) {
      const lessonsResult = await docClient.send(new QueryCommand({
        TableName: 'intellilearn-lessons',
        KeyConditionExpression: 'moduleId = :moduleId',
        ExpressionAttributeValues: {
          ':moduleId': module.id
        }
      }))
      
      for (const lesson of lessonsResult.Items || []) {
        await docClient.send(new DeleteCommand({
          TableName: 'intellilearn-lessons',
          Key: {
            moduleId: lesson.moduleId,
            id: lesson.id
          }
        }))
        console.log(`   ✅ Lesson deleted: ${lesson.title}`)
      }
    }
    
    // 2. Eliminar módulos del curso
    console.log('📚 Eliminando módulos...')
    for (const module of modulesResult.Items || []) {
      await docClient.send(new DeleteCommand({
        TableName: 'intellilearn-modules',
        Key: {
          courseId: module.courseId,
          id: module.id
        }
      }))
      console.log(`   ✅ Module deleted: ${module.title}`)
    }
    
    // 3. Eliminar el curso
    console.log('🎓 Eliminando curso...')
    await docClient.send(new DeleteCommand({
      TableName: 'intellilearn-courses',
      Key: {
        id: '1'
      }
    }))
    
    console.log('✅ Curso con ID "1" eliminado completamente de DynamoDB')
    
  } catch (error) {
    console.error('❌ Error eliminando curso:', error.message)
  }
}

deleteOldCourse() 