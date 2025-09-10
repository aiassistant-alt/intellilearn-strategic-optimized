const { CognitoIdentityProviderClient, DescribeUserPoolClientCommand } = require('@aws-sdk/client-cognito-identity-provider');
require('dotenv').config({ path: '.env.aws' });
require('dotenv').config({ path: '.env.local' });

const client = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

async function checkAppClient() {
  try {
    console.log('🔍 Verificando configuración del App Client de Cognito...\n');
    
    const userPoolId = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID;
    const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;
    
    console.log(`User Pool ID: ${userPoolId}`);
    console.log(`Client ID: ${clientId}\n`);
    
    const command = new DescribeUserPoolClientCommand({
      UserPoolId: userPoolId,
      ClientId: clientId
    });
    
    const response = await client.send(command);
    const appClient = response.UserPoolClient;
    
    console.log('📋 Configuración del App Client:');
    console.log(`- Nombre: ${appClient.ClientName}`);
    console.log(`- Client Secret: ${appClient.ClientSecret ? 'Sí (⚠️ No compatible con auth directo)' : 'No (✅ OK)'}`);
    
    console.log('\n🔐 Flujos de autenticación habilitados:');
    const authFlows = appClient.ExplicitAuthFlows || [];
    console.log(`- ALLOW_USER_PASSWORD_AUTH: ${authFlows.includes('ALLOW_USER_PASSWORD_AUTH') ? '✅' : '❌'}`);
    console.log(`- ALLOW_USER_SRP_AUTH: ${authFlows.includes('ALLOW_USER_SRP_AUTH') ? '✅' : '❌'}`);
    console.log(`- ALLOW_REFRESH_TOKEN_AUTH: ${authFlows.includes('ALLOW_REFRESH_TOKEN_AUTH') ? '✅' : '❌'}`);
    
    if (!authFlows.includes('ALLOW_USER_PASSWORD_AUTH')) {
      console.log('\n❌ PROBLEMA DETECTADO: ALLOW_USER_PASSWORD_AUTH no está habilitado');
      console.log('\n📝 Para solucionarlo:');
      console.log('1. Ve a AWS Cognito Console');
      console.log('2. Selecciona tu User Pool');
      console.log('3. En "App integration" → "App client list"');
      console.log('4. Edita el app client');
      console.log('5. En "Authentication flows" marca:');
      console.log('   - ALLOW_USER_PASSWORD_AUTH');
      console.log('   - ALLOW_REFRESH_TOKEN_AUTH');
      console.log('6. Guarda los cambios');
    } else {
      console.log('\n✅ La configuración del App Client es correcta');
    }
    
    // Verificar si hay un client secret
    if (appClient.ClientSecret) {
      console.log('\n⚠️  ADVERTENCIA: El App Client tiene un Client Secret');
      console.log('   Esto puede causar problemas con la autenticación desde el navegador');
      console.log('   Considera crear un nuevo App Client sin secret para aplicaciones web');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkAppClient();