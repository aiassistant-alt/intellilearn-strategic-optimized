/**
 * ^SetupSecretsManager
 * Author: Luis Arturo Parra - Telmo AI
 * Created: 2025-09-10
 * Usage: Setup AWS Secrets Manager for Intellilearn API keys
 * Business Context: Secure credential management for production deployment
 * Relations: Used by awsBedrockService.ts for retrieving credentials
 * Reminders: Run once during initial setup or when updating secrets
 */

const { SecretsManagerClient, CreateSecretCommand, UpdateSecretCommand, DescribeSecretCommand } = require('@aws-sdk/client-secrets-manager');

// AWS Configuration
const REGION = 'us-east-1';
const SECRET_NAME = 'intellilearn/api-keys';

// Secret values (these would typically come from environment variables in production)
const secretValue = {
  bedrock_api_key: process.env.AWS_BEDROCK_API_KEY || 'default-key-placeholder',
  openai_api_key: process.env.OPENAI_API_KEY || 'not-used',
  anthropic_api_key: process.env.ANTHROPIC_API_KEY || 'not-used',
  nova_sonic_region: 'us-east-1',
  nova_sonic_model: 'amazon.nova-sonic-v1:0',
  application_version: '1.0.0',
  last_updated: new Date().toISOString()
};

/**
 * Initialize Secrets Manager client
 */
const createSecretsClient = () => {
  return new SecretsManagerClient({
    region: REGION
  });
};

/**
 * Check if secret exists
 */
async function secretExists(client, secretName) {
  try {
    await client.send(new DescribeSecretCommand({ SecretId: secretName }));
    return true;
  } catch (error) {
    if (error.name === 'ResourceNotFoundException') {
      return false;
    }
    throw error;
  }
}

/**
 * Create or update secret in AWS Secrets Manager
 */
async function setupSecret() {
  console.log('🔐 Setting up AWS Secrets Manager for Intellilearn...');
  console.log('=========================================================');
  
  try {
    const client = createSecretsClient();
    const exists = await secretExists(client, SECRET_NAME);
    
    if (exists) {
      console.log('📝 Secret already exists, updating...');
      
      const updateCommand = new UpdateSecretCommand({
        SecretId: SECRET_NAME,
        SecretString: JSON.stringify(secretValue),
        Description: 'API keys and configuration for Intellilearn platform'
      });
      
      await client.send(updateCommand);
      console.log('✅ Secret updated successfully');
      
    } else {
      console.log('🆕 Creating new secret...');
      
      const createCommand = new CreateSecretCommand({
        Name: SECRET_NAME,
        SecretString: JSON.stringify(secretValue),
        Description: 'API keys and configuration for Intellilearn platform',
        Tags: [
          { Key: 'Project', Value: 'Intellilearn' },
          { Key: 'Environment', Value: 'Production' },
          { Key: 'CreatedBy', Value: 'TelmoAI' }
        ]
      });
      
      await client.send(createCommand);
      console.log('✅ Secret created successfully');
    }
    
    console.log('');
    console.log('📋 Secret Configuration:');
    console.log(`   Name: ${SECRET_NAME}`);
    console.log(`   Region: ${REGION}`);
    console.log('   Keys: bedrock_api_key, nova_sonic_region, nova_sonic_model');
    console.log('');
    console.log('🔒 Security Notes:');
    console.log('   - Secret is encrypted at rest using AWS KMS');
    console.log('   - Access controlled via IAM policies');
    console.log('   - Consider enabling automatic rotation for production');
    console.log('');
    console.log('✅ Secrets Manager setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Error setting up Secrets Manager:', error);
    process.exit(1);
  }
}

/**
 * Main execution
 */
if (require.main === module) {
  setupSecret();
}

module.exports = {
  setupSecret,
  SECRET_NAME,
  REGION
};
