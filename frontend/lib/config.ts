// AWS Configuration for CognIA IntelliLearn
// ⚠️ SECURITY: Todas las credenciales deben venir de variables de entorno
// NO incluir credenciales hardcodeadas en este archivo

// Función para obtener variables de entorno con fallbacks para producción
const getEnvVar = (key: string, fallback?: string): string => {
  const value = process.env[key];
  if (!value && !fallback) {
    console.warn(`⚠️ Variable de entorno no encontrada: ${key}`);
    return '';
  }
  return value || fallback || '';
};

export const AWS_CONFIG = {
  region: process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1',
  cognito: {
    userPoolId: getEnvVar('NEXT_PUBLIC_COGNITO_USER_POOL_ID', 'us-east-1_wCVGHj3uH'),
    clientId: getEnvVar('NEXT_PUBLIC_COGNITO_CLIENT_ID', '3je10g7unn142aimabthsps5q'),
    identityPoolId: getEnvVar('NEXT_PUBLIC_COGNITO_IDENTITY_POOL_ID', 'us-east-1:2e649222-65f2-4757-850a-c8a8b8c98ff3')
  },
  bedrock: {
    region: process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1',
    modelId: 'anthropic.claude-3-haiku-20240307-v1:0'
  },
  // Las credenciales NO deben ser usadas en el frontend
  // Se obtendrán dinámicamente desde Cognito Identity Pool
  // Configuración adicional para S3 Vectors
  s3: {
    vectorBucket: process.env.S3_VECTOR_BUCKET || 'integration-aws-vectors-076276934311',
    region: process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1'
  },
  dynamodb: {
    table: process.env.DYNAMODB_TABLE || 'integration-aws-data-prod'
  },
  lambda: {
    bedrockEndpoint: process.env.NEXT_PUBLIC_LAMBDA_BEDROCK_ENDPOINT || 'https://4epqqr8bqg.execute-api.us-east-1.amazonaws.com/prod/bedrock-stream'
  },
  // All credentials are handled securely via Cognito Identity Pool
  // No hardcoded credentials allowed
};

// Validación de configuración al cargar el módulo (solo en desarrollo)
export const validateAWSConfig = (): boolean => {
  if (process.env.NODE_ENV === 'development') {
    try {
      // Validar que todas las variables críticas estén presentes en desarrollo
      const requiredVars = [
        'NEXT_PUBLIC_COGNITO_USER_POOL_ID',
        'NEXT_PUBLIC_COGNITO_CLIENT_ID',
        'NEXT_PUBLIC_COGNITO_IDENTITY_POOL_ID'
      ];
      
      const missingVars = requiredVars.filter(varName => !process.env[varName]);
      
      if (missingVars.length > 0) {
        console.warn('⚠️ Variables de entorno faltantes en desarrollo:', missingVars);
        console.warn('💡 Usando valores por defecto para producción');
      } else {
        console.log('✅ Configuración AWS validada correctamente');
      }
      
      return true;
    } catch (error) {
      console.error('❌ Error en configuración AWS:', error);
      return false;
    }
  }
  
  // En producción, siempre retorna true
  return true;
}; 