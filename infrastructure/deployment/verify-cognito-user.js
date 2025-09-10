const { CognitoIdentityProviderClient, ListUsersCommand, AdminGetUserCommand } = require('@aws-sdk/client-cognito-identity-provider');
require('dotenv').config({ path: '.env.aws' });
require('dotenv').config({ path: '.env.local' });

const client = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

async function verifyUser() {
  try {
    console.log('🔍 Verificando usuario en Cognito...\n');
    
    const userPoolId = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID;
    console.log(`User Pool ID: ${userPoolId}`);
    
    // Listar todos los usuarios
    const listCommand = new ListUsersCommand({
      UserPoolId: userPoolId,
      Limit: 10
    });
    
    const users = await client.send(listCommand);
    console.log(`\nTotal de usuarios: ${users.Users.length}`);
    
    if (users.Users.length === 0) {
      console.log('❌ No hay usuarios en el User Pool');
      return;
    }
    
    console.log('\nUsuarios encontrados:');
    for (const user of users.Users) {
      console.log(`- Username: ${user.Username}`);
      console.log(`  Status: ${user.UserStatus}`);
      console.log(`  Enabled: ${user.Enabled}`);
      
      const email = user.Attributes?.find(attr => attr.Name === 'email')?.Value;
      if (email) {
        console.log(`  Email: ${email}`);
      }
      console.log('');
    }
    
    // Buscar específicamente el usuario demo
    const demoUser = users.Users.find(user => {
      const email = user.Attributes?.find(attr => attr.Name === 'email')?.Value;
      return email === 'demo@intellilearn.com';
    });
    
    if (demoUser) {
      console.log('✅ Usuario demo@intellilearn.com encontrado');
      console.log(`   Status: ${demoUser.UserStatus}`);
      
      if (demoUser.UserStatus === 'FORCE_CHANGE_PASSWORD') {
        console.log('\n⚠️  El usuario necesita cambiar la contraseña en el primer login');
      }
    } else {
      console.log('❌ Usuario demo@intellilearn.com NO encontrado');
      console.log('\n📝 Creando usuario de prueba...');
      
      // Crear el usuario si no existe
      const { AdminCreateUserCommand, AdminSetUserPasswordCommand } = require('@aws-sdk/client-cognito-identity-provider');
      
      const createCommand = new AdminCreateUserCommand({
        UserPoolId: userPoolId,
        Username: 'demo@intellilearn.com',
        UserAttributes: [
          { Name: 'email', Value: 'demo@intellilearn.com' },
          { Name: 'email_verified', Value: 'true' }
        ],
        TemporaryPassword: 'TempPass123!',
        MessageAction: 'SUPPRESS'
      });
      
      await client.send(createCommand);
      console.log('✅ Usuario creado con contraseña temporal');
      
      // Establecer contraseña permanente
      const setPasswordCommand = new AdminSetUserPasswordCommand({
        UserPoolId: userPoolId,
        Username: 'demo@intellilearn.com',
        Password: 'Demo2025!',
        Permanent: true
      });
      
      await client.send(setPasswordCommand);
      console.log('✅ Contraseña permanente establecida');
      console.log('\n🎉 Usuario listo para usar:');
      console.log('   Email: demo@intellilearn.com');
      console.log('   Password: Demo2025!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.name === 'ResourceNotFoundException') {
      console.error('\n⚠️  El User Pool no existe o el ID es incorrecto');
      console.error('   Verifica el valor de NEXT_PUBLIC_COGNITO_USER_POOL_ID en .env.local');
    }
  }
}

verifyUser();