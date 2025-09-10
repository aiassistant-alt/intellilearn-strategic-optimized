const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3')
const https = require('https')
const fs = require('fs')
const path = require('path')

const s3Client = new S3Client({
  region: 'us-east-1'
})

async function downloadVideo(url, filename) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filename)
    https.get(url, (response) => {
      response.pipe(file)
      file.on('finish', () => {
        file.close()
        resolve()
      })
    }).on('error', (err) => {
      fs.unlink(filename, () => {}) // Delete the file async
      reject(err)
    })
  })
}

async function uploadToS3(filename, key) {
  const fileContent = fs.readFileSync(filename)
  
  const command = new PutObjectCommand({
    Bucket: 'integration-aws-app-076276934311',
    Key: key,
    Body: fileContent,
    ContentType: 'video/mp4',
    CacheControl: 'max-age=31536000'
  })

  try {
    const response = await s3Client.send(command)
    console.log(`✅ Video uploaded successfully: ${key}`)
    return response
  } catch (error) {
    console.error('❌ Error uploading video:', error)
    throw error
  }
}

async function main() {
  const videoUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4'
  const tempFile = 'temp-video.mp4'
  const s3Key = 'assets/videos/cognia-demo.mp4'

  try {
    console.log('📥 Downloading video...')
    await downloadVideo(videoUrl, tempFile)
    
    console.log('📤 Uploading to S3...')
    await uploadToS3(tempFile, s3Key)
    
    console.log(`🌐 Video available at: https://integration-aws-app-076276934311.s3.amazonaws.com/${s3Key}`)
    
    // Clean up temp file
    fs.unlinkSync(tempFile)
    console.log('🧹 Temporary file cleaned up')
    
  } catch (error) {
    console.error('❌ Process failed:', error)
    // Clean up temp file if it exists
    if (fs.existsSync(tempFile)) {
      fs.unlinkSync(tempFile)
    }
  }
}

main() 