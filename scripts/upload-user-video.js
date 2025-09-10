const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3')
const fs = require('fs')
const path = require('path')

const s3Client = new S3Client({
  region: 'us-east-1'
})

async function uploadVideoToS3(localPath, s3Key) {
  try {
    // Check if file exists
    if (!fs.existsSync(localPath)) {
      throw new Error(`File not found: ${localPath}`)
    }

    console.log(`📁 Reading file: ${localPath}`)
    const fileContent = fs.readFileSync(localPath)
    const fileSize = (fileContent.length / (1024 * 1024)).toFixed(2)
    console.log(`📏 File size: ${fileSize} MB`)
    
    const command = new PutObjectCommand({
      Bucket: 'integration-aws-app-076276934311',
      Key: s3Key,
      Body: fileContent,
      ContentType: 'video/mp4',
      CacheControl: 'max-age=31536000',
      Metadata: {
        'original-name': path.basename(localPath),
        'upload-date': new Date().toISOString()
      }
    })

    console.log('📤 Uploading to S3...')
    const response = await s3Client.send(command)
    console.log(`✅ Video uploaded successfully!`)
    console.log(`🌐 S3 URL: https://integration-aws-app-076276934311.s3.amazonaws.com/${s3Key}`)
    console.log(`🔗 CloudFront URL: https://CLOUDFRONT_URL_PLACEHOLDER/${s3Key}`)
    
    return response
  } catch (error) {
    console.error('❌ Error uploading video:', error.message)
    throw error
  }
}

async function main() {
  const localVideoPath = 'C:\\Users\\cogni\\Downloads\\cognia-demo.mp4'
  const s3Key = 'assets/videos/cognia-demo.mp4'

  try {
    await uploadVideoToS3(localVideoPath, s3Key)
    console.log('🎉 Upload completed successfully!')
  } catch (error) {
    console.error('💥 Upload failed:', error.message)
    process.exit(1)
  }
}

main() 