/**
 * Script to index course content for vectorization
 * This will create the educational-index/ structure for Documents/ and Quiz/ content
 */

require('dotenv').config({ path: '.env.local' })
const { vectorizationService } = require('../lib/services/vectorizationService')

async function indexCourseContent() {
  try {
    console.log('🚀 Starting course content indexing...')
    
    // Index the main course (000000000)
    const courseId = '000000000'
    
    console.log(`📚 Indexing course: ${courseId}`)
    await vectorizationService.indexCourseContent(courseId)
    
    console.log('✅ Course content indexing completed successfully!')
    console.log('')
    console.log('📊 Summary:')
    console.log('- Documents/ folder indexed with Titan embeddings')
    console.log('- Quiz/ folder indexed with Titan embeddings') 
    console.log('- Vectors stored in educational-index/ structure')
    console.log('- Metadata saved to DynamoDB for fast queries')
    console.log('')
    console.log('🔍 You can now use semantic search in voice sessions!')
    
  } catch (error) {
    console.error('❌ Error indexing course content:', error)
    process.exit(1)
  }
}

// Run the indexing
indexCourseContent() 