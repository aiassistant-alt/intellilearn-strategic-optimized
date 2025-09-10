const fs = require('fs');
const path = require('path');
const https = require('https');

// Crear directorios si no existen
const createDirectories = () => {
  const dirs = [
    'public/assets',
    'public/assets/videos'
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`✅ Created directory: ${dir}`);
    }
  });
};

// Descargar video si no existe localmente
const downloadVideo = async () => {
  const videoUrl = 'https://integration-aws-app-076276934311.s3.us-east-1.amazonaws.com/assets/videos/Video_Listo_CognIA_IntelliLearn+(2).mp4';
  const localPath = 'public/assets/videos/Video_Listo_CognIA_IntelliLearn+(2).mp4';
  
  // Si el archivo ya existe, no lo descargamos
  if (fs.existsSync(localPath)) {
    console.log('✅ Video already exists locally');
    return;
  }
  
  console.log('📥 Downloading video from S3...');
  
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(localPath);
    
    https.get(videoUrl, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download video: ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        console.log('✅ Video downloaded successfully');
        resolve();
      });
      
      file.on('error', (err) => {
        fs.unlink(localPath, () => {}); // Delete the file on error
        reject(err);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
};

// Función principal
const main = async () => {
  try {
    console.log('🚀 Starting asset preparation...');
    
    createDirectories();
    await downloadVideo();
    
    console.log('✅ Asset preparation completed successfully!');
  } catch (error) {
    console.error('❌ Error preparing assets:', error.message);
    process.exit(1);
  }
};

// Ejecutar si es llamado directamente
if (require.main === module) {
  main();
}

module.exports = { main }; 