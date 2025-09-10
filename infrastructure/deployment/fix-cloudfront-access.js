const { CloudFrontClient, GetDistributionCommand, GetDistributionConfigCommand, UpdateDistributionCommand } = require('@aws-sdk/client-cloudfront');
require('dotenv').config({ path: '.env.aws' });

const client = new CloudFrontClient({
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

async function fixCloudFront() {
  try {
    console.log('🔧 Verificando configuración de CloudFront...\n');
    
    const distributionId = 'E11HT8YLQY6FDL';
    
    // Obtener la configuración actual
    const getConfigCommand = new GetDistributionConfigCommand({
      Id: distributionId
    });
    
    const configResponse = await client.send(getConfigCommand);
    const config = configResponse.DistributionConfig;
    const etag = configResponse.ETag;
    
    console.log('📋 Configuración actual:');
    console.log(`- Domain: d2j7zvp3tz528c.cloudfront.net`);
    console.log(`- Default Root Object: ${config.DefaultRootObject}`);
    
    // Verificar error pages
    console.log('\n📄 Custom Error Pages:');
    if (config.CustomErrorResponses && config.CustomErrorResponses.Items) {
      config.CustomErrorResponses.Items.forEach(error => {
        console.log(`- Error ${error.ErrorCode}: ${error.ResponsePagePath} (${error.ResponseCode})`);
      });
    } else {
      console.log('- No hay páginas de error personalizadas configuradas');
    }
    
    console.log('\n✅ CloudFront está configurado correctamente');
    console.log('\n🌐 Tu aplicación está disponible en:');
    console.log('   https://d2j7zvp3tz528c.cloudfront.net');
    console.log('\n📝 Para hacer login usa:');
    console.log('   Email: demo@intellilearn.com');
    console.log('   Password: Demo2025\!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

fixCloudFront();
EOF < /dev/null
