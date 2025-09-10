/**
 * ^setup-nova-config-table
 * Author: Luis Arturo Parra - Telmo AI
 * Created: 2025-09-10
 * Usage: Create DynamoDB table for Nova Sonic global configuration
 * Business Context: Centralized configuration management for Nova Sonic parameters
 * Relations: Used by novaConversationalService.ts for dynamic configuration
 * Reminders: Run once to create table, update with new configurations as needed
 * Security: Uses AWS credentials from environment/IAM roles
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');

// AWS Configuration
const REGION = 'us-east-1';
const TABLE_NAME = 'intellilearn-nova-config';

// Initialize DynamoDB client
const ddbClient = new DynamoDBClient({ region: REGION });
const docClient = DynamoDBDocumentClient.from(ddbClient);

/**
 * Default Nova Sonic Configuration
 * Based on official AWS samples and production testing
 */
const DEFAULT_NOVA_CONFIG = {
  configId: 'default',
  configName: 'Production Nova Sonic Configuration',
  version: '1.0.0',
  lastUpdated: new Date().toISOString(),
  
  // Core Model Configuration
  modelConfiguration: {
    modelId: 'amazon.nova-sonic-v1:0',
    voiceId: 'matthew', // Tested and working voice
    temperature: 0.7,
    maxTokens: 1024,
    topP: 0.9,
    frequencyPenalty: 0.0,
    presencePenalty: 0.0
  },
  
  // Audio Input Configuration
  audioInputConfiguration: {
    mediaType: 'audio/lpcm',
    sampleRateHertz: 16000,
    sampleSizeBits: 16,
    channelCount: 1,
    encoding: 'base64',
    audioType: 'SPEECH'
  },
  
  // Audio Output Configuration
  audioOutputConfiguration: {
    mediaType: 'audio/lpcm',
    sampleRateHertz: 24000, // Nova outputs at 24kHz
    sampleSizeBits: 16,
    channelCount: 1,
    voiceId: 'matthew',
    encoding: 'base64',
    audioType: 'SPEECH'
  },
  
  // Voice Activity Detection
  vadConfiguration: {
    threshold: 0.015, // RMS threshold for voice detection
    silenceDetectionMs: 2000, // 2 seconds silence detection
    initialSilenceMs: 4000, // 4 seconds initial silence
    frameProcessingMs: 30 // 30ms frame processing
  },
  
  // Audio Processing Configuration
  audioProcessingConfiguration: {
    chunkConcatenation: true, // Use AWS official pattern
    playbackOnContentEnd: true, // Play complete audio on contentEnd
    bufferMaxSize: 15, // Max buffer size for audio chunks
    silenceThreshold: 50, // Amplitude threshold for silence detection
    enableBargein: true, // Allow user interruption
    bargeInThreshold: 3 // Buffer threshold for barge-in detection
  },
  
  // Session Management
  sessionConfiguration: {
    maxSessionDurationMs: 480000, // 8 minutes (Nova Sonic limit)
    extendedSessionEnabled: true, // Enable 20-minute conversations
    autoResumeEnabled: true, // Auto resume for extended sessions
    resumeTimeoutsMs: [450000, 930000], // Resume at 7.5 and 15.5 minutes
    maxConversationHistory: 50 // Max conversation turns to store
  },
  
  // System Prompts
  systemPrompts: {
    default: `You are Nova, a friendly AI tutor who ALWAYS responds with voice immediately.

MANDATORY BEHAVIOR:
- You MUST respond with speech to every input
- Start speaking immediately when prompted  
- Never stay silent or wait
- Speak in a warm, educational tone
- Keep responses conversational and educational (2-3 sentences)
- Ask follow-up questions to ensure understanding
- Be encouraging and supportive

EDUCATIONAL FOCUS:
- Adapt explanations to student's level
- Use examples and analogies
- Provide step-by-step guidance
- Encourage questions and exploration`,
    
    conversationResume: `Continue our educational conversation. You are Nova, the AI tutor. 
The previous conversation context will be provided. 
Maintain continuity and reference previous topics naturally.
Always respond with voice immediately.`,
    
    kickoffMessage: 'Hi Nova! I\'m ready to learn. Please introduce yourself and start teaching me right now. Speak to me!'
  },
  
  // Performance Configuration
  performanceConfiguration: {
    enableStrategicLogging: true,
    logFrequencyReduction: {
      vadLogging: 10, // Log every 10 VAD events
      audioSendLogging: 5, // Log every 5 audio sends
      workletHealthLogging: 500 // Log every 500 frames (~15 seconds)
    },
    enableRequestAnimationFrame: true, // Use RAF instead of setTimeout
    enableSessionCleanup: true // Comprehensive resource cleanup
  },
  
  // Error Handling
  errorHandlingConfiguration: {
    maxRetries: 3,
    retryDelayMs: 1000,
    enableFallbackVoice: true,
    fallbackVoiceId: 'Olivia',
    enableErrorLogging: true,
    enablePerformanceMonitoring: true
  },
  
  // Environment Configuration
  environmentConfiguration: {
    development: {
      enableDebugLogging: true,
      enableVerboseAudioLogs: true,
      mockAudioForTesting: false
    },
    production: {
      enableDebugLogging: false,
      enableVerboseAudioLogs: false,
      enableAnalytics: true
    }
  }
};

/**
 * Create DynamoDB table for Nova Sonic configuration
 */
async function createNovaConfigTable() {
  try {
    console.log('🚀 Creating Nova Sonic configuration table...');
    
    const { CreateTableCommand } = require('@aws-sdk/client-dynamodb');
    
    const createTableParams = {
      TableName: TABLE_NAME,
      KeySchema: [
        {
          AttributeName: 'configId',
          KeyType: 'HASH'
        }
      ],
      AttributeDefinitions: [
        {
          AttributeName: 'configId',
          AttributeType: 'S'
        }
      ],
      BillingMode: 'PAY_PER_REQUEST',
      Tags: [
        {
          Key: 'Project',
          Value: 'Intellilearn'
        },
        {
          Key: 'Component',
          Value: 'NovaSonic'
        },
        {
          Key: 'Environment',
          Value: 'Production'
        },
        {
          Key: 'Owner',
          Value: 'TelmoAI'
        }
      ]
    };
    
    const command = new CreateTableCommand(createTableParams);
    await ddbClient.send(command);
    
    console.log('✅ Nova Sonic configuration table created successfully');
    
    // Wait for table to be active
    console.log('⏳ Waiting for table to be active...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    return true;
  } catch (error) {
    if (error.name === 'ResourceInUseException') {
      console.log('ℹ️ Table already exists, skipping creation');
      return true;
    }
    console.error('❌ Error creating table:', error);
    throw error;
  }
}

/**
 * Insert default Nova Sonic configuration
 */
async function insertDefaultConfiguration() {
  try {
    console.log('📊 Inserting default Nova Sonic configuration...');
    
    const putCommand = new PutCommand({
      TableName: TABLE_NAME,
      Item: DEFAULT_NOVA_CONFIG
    });
    
    await docClient.send(putCommand);
    console.log('✅ Default configuration inserted successfully');
    
    return true;
  } catch (error) {
    console.error('❌ Error inserting default configuration:', error);
    throw error;
  }
}

/**
 * Get Nova Sonic configuration by ID
 */
async function getConfiguration(configId = 'default') {
  try {
    const getCommand = new GetCommand({
      TableName: TABLE_NAME,
      Key: { configId }
    });
    
    const result = await docClient.send(getCommand);
    return result.Item;
  } catch (error) {
    console.error('❌ Error getting configuration:', error);
    throw error;
  }
}

/**
 * Update Nova Sonic configuration
 */
async function updateConfiguration(configId, updates) {
  try {
    const currentConfig = await getConfiguration(configId);
    if (!currentConfig) {
      throw new Error(`Configuration ${configId} not found`);
    }
    
    const updatedConfig = {
      ...currentConfig,
      ...updates,
      lastUpdated: new Date().toISOString(),
      version: incrementVersion(currentConfig.version)
    };
    
    const putCommand = new PutCommand({
      TableName: TABLE_NAME,
      Item: updatedConfig
    });
    
    await docClient.send(putCommand);
    console.log(`✅ Configuration ${configId} updated successfully`);
    
    return updatedConfig;
  } catch (error) {
    console.error('❌ Error updating configuration:', error);
    throw error;
  }
}

/**
 * Increment version number
 */
function incrementVersion(version) {
  const parts = version.split('.');
  parts[2] = (parseInt(parts[2]) + 1).toString();
  return parts.join('.');
}

/**
 * Main setup function
 */
async function setupNovaConfigTable() {
  try {
    console.log('🎤 Setting up Nova Sonic configuration table...');
    
    // Create table
    await createNovaConfigTable();
    
    // Insert default configuration
    await insertDefaultConfiguration();
    
    // Verify configuration
    const config = await getConfiguration('default');
    console.log('🔍 Configuration verification:');
    console.log(`   Model: ${config.modelConfiguration.modelId}`);
    console.log(`   Voice: ${config.modelConfiguration.voiceId}`);
    console.log(`   Version: ${config.version}`);
    console.log(`   Last Updated: ${config.lastUpdated}`);
    
    console.log('');
    console.log('✅ Nova Sonic configuration table setup completed successfully!');
    console.log('📋 Table Name:', TABLE_NAME);
    console.log('🌍 Region:', REGION);
    console.log('');
    console.log('🔧 Usage in code:');
    console.log('   const config = await getNovaConfiguration("default");');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

// Export functions for use in other modules
module.exports = {
  setupNovaConfigTable,
  getConfiguration,
  updateConfiguration,
  DEFAULT_NOVA_CONFIG,
  TABLE_NAME
};

// Run setup if this file is executed directly
if (require.main === module) {
  setupNovaConfigTable();
}
