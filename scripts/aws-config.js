/**
 * Centralized AWS Configuration for CognIA IntelliLearn Scripts
 * ⚠️ SECURITY: All credentials must come from environment variables
 * 
 * Usage:
 * const { getAWSConfig, validateConfig } = require('./aws-config');
 * const config = getAWSConfig();
 */

require('dotenv').config({ path: '../.env.local' });

/**
 * Get AWS configuration from environment variables
 * @returns {Object} AWS configuration object
 */
function getAWSConfig() {
  return {
    region: process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY
    },
    cognito: {
      userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID,
      clientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID,
      identityPoolId: process.env.NEXT_PUBLIC_COGNITO_IDENTITY_POOL_ID
    },
    s3: {
      vectorBucket: process.env.S3_VECTOR_BUCKET || 'cognia-intellilearn',
      region: process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1'
    },
    dynamodb: {
      table: process.env.DYNAMODB_TABLE || 'intellilearn_Data'
    }
  };
}

/**
 * Validate that all required environment variables are present
 * @returns {boolean} True if all required variables are present
 */
function validateConfig() {
  const requiredVars = [
    'NEXT_PUBLIC_AWS_ACCESS_KEY_ID',
    'NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY',
    'NEXT_PUBLIC_COGNITO_USER_POOL_ID',
    'NEXT_PUBLIC_COGNITO_CLIENT_ID',
    'NEXT_PUBLIC_COGNITO_IDENTITY_POOL_ID'
  ];

  const missingVars = requiredVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    console.error('❌ ERROR: Missing required environment variables:');
    missingVars.forEach(varName => {
      console.error(`   - ${varName}`);
    });
    console.error('\n📝 Please ensure your .env.local file contains all required variables.');
    console.error('💡 Check the .env.local file created in the project root.');
    return false;
  }

  console.log('✅ AWS configuration validated successfully');
  console.log(`📍 Region: ${process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1'}`);
  console.log('🔐 Using credentials from environment variables');
  
  return true;
}

/**
 * Initialize AWS configuration with validation
 * Exits process if validation fails
 * @returns {Object} Validated AWS configuration
 */
function initializeAWSConfig() {
  if (!validateConfig()) {
    console.error('\n🚨 Configuration validation failed. Exiting...');
    process.exit(1);
  }
  
  return getAWSConfig();
}

module.exports = {
  getAWSConfig,
  validateConfig,
  initializeAWSConfig
}; 