/**
 * ^novaConfigService
 * Author: Luis Arturo Parra - Telmo AI
 * Created: 2025-09-10
 * Usage: Service for managing Nova Sonic configuration from DynamoDB
 * Business Context: Centralized configuration management for dynamic Nova Sonic parameters
 * Relations: Used by novaConversationalService.ts, connects to DynamoDB table
 * Reminders: Cache configuration for performance, refresh on updates
 * Security: Uses AWS SDK with proper IAM permissions
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';

// Configuration constants
const REGION = 'us-east-1';
const TABLE_NAME = 'intellilearn-nova-config';
const DEFAULT_CONFIG_ID = 'default';

// Cache for configuration to avoid repeated DynamoDB calls
let configCache: NovaConfiguration | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache

// Initialize DynamoDB client
const ddbClient = new DynamoDBClient({ region: REGION });
const docClient = DynamoDBDocumentClient.from(ddbClient);

/**
 * Nova Sonic Configuration Interface
 */
export interface NovaConfiguration {
  configId: string;
  configName: string;
  version: string;
  lastUpdated: string;
  
  modelConfiguration: {
    modelId: string;
    voiceId: string;
    temperature: number;
    maxTokens: number;
    topP: number;
    frequencyPenalty: number;
    presencePenalty: number;
  };
  
  audioInputConfiguration: {
    mediaType: string;
    sampleRateHertz: number;
    sampleSizeBits: number;
    channelCount: number;
    encoding: string;
    audioType: string;
  };
  
  audioOutputConfiguration: {
    mediaType: string;
    sampleRateHertz: number;
    sampleSizeBits: number;
    channelCount: number;
    voiceId: string;
    encoding: string;
    audioType: string;
  };
  
  vadConfiguration: {
    threshold: number;
    silenceDetectionMs: number;
    initialSilenceMs: number;
    frameProcessingMs: number;
  };
  
  audioProcessingConfiguration: {
    chunkConcatenation: boolean;
    playbackOnContentEnd: boolean;
    bufferMaxSize: number;
    silenceThreshold: number;
    enableBargein: boolean;
    bargeInThreshold: number;
  };
  
  sessionConfiguration: {
    maxSessionDurationMs: number;
    extendedSessionEnabled: boolean;
    autoResumeEnabled: boolean;
    resumeTimeoutsMs: number[];
    maxConversationHistory: number;
  };
  
  systemPrompts: {
    default: string;
    conversationResume: string;
    kickoffMessage: string;
  };
  
  performanceConfiguration: {
    enableStrategicLogging: boolean;
    logFrequencyReduction: {
      vadLogging: number;
      audioSendLogging: number;
      workletHealthLogging: number;
    };
    enableRequestAnimationFrame: boolean;
    enableSessionCleanup: boolean;
  };
  
  errorHandlingConfiguration: {
    maxRetries: number;
    retryDelayMs: number;
    enableFallbackVoice: boolean;
    fallbackVoiceId: string;
    enableErrorLogging: boolean;
    enablePerformanceMonitoring: boolean;
  };
  
  environmentConfiguration: {
    development: {
      enableDebugLogging: boolean;
      enableVerboseAudioLogs: boolean;
      mockAudioForTesting: boolean;
    };
    production: {
      enableDebugLogging: boolean;
      enableVerboseAudioLogs: boolean;
      enableAnalytics: boolean;
    };
  };
}

/**
 * Get Nova Sonic configuration from DynamoDB with caching
 */
export async function getNovaConfiguration(configId: string = DEFAULT_CONFIG_ID): Promise<NovaConfiguration> {
  try {
    // Check cache first
    const now = Date.now();
    if (configCache && (now - cacheTimestamp) < CACHE_TTL_MS && configCache.configId === configId) {
      console.log(`🎤 [NovaConfig] Using cached configuration: ${configId}`);
      return configCache;
    }
    
    console.log(`🎤 [NovaConfig] Fetching configuration from DynamoDB: ${configId}`);
    
    const getCommand = new GetCommand({
      TableName: TABLE_NAME,
      Key: { configId }
    });
    
    const result = await docClient.send(getCommand);
    
    if (!result.Item) {
      console.warn(`⚠️ [NovaConfig] Configuration ${configId} not found, using fallback`);
      return getFallbackConfiguration();
    }
    
    const configuration = result.Item as NovaConfiguration;
    
    // Update cache
    configCache = configuration;
    cacheTimestamp = now;
    
    console.log(`✅ [NovaConfig] Configuration loaded: ${configuration.configName} v${configuration.version}`);
    return configuration;
    
  } catch (error) {
    console.error('❌ [NovaConfig] Error fetching configuration:', error);
    console.log('🔄 [NovaConfig] Using fallback configuration');
    return getFallbackConfiguration();
  }
}

/**
 * Update Nova Sonic configuration in DynamoDB
 */
export async function updateNovaConfiguration(configId: string, updates: Partial<NovaConfiguration>): Promise<NovaConfiguration> {
  try {
    console.log(`🎤 [NovaConfig] Updating configuration: ${configId}`);
    
    // Get current configuration
    const currentConfig = await getNovaConfiguration(configId);
    
    // Merge updates
    const updatedConfig: NovaConfiguration = {
      ...currentConfig,
      ...updates,
      lastUpdated: new Date().toISOString(),
      version: incrementVersion(currentConfig.version)
    };
    
    // Save to DynamoDB
    const putCommand = new PutCommand({
      TableName: TABLE_NAME,
      Item: updatedConfig
    });
    
    await docClient.send(putCommand);
    
    // Clear cache to force refresh
    configCache = null;
    
    console.log(`✅ [NovaConfig] Configuration updated successfully: v${updatedConfig.version}`);
    return updatedConfig;
    
  } catch (error) {
    console.error('❌ [NovaConfig] Error updating configuration:', error);
    throw error;
  }
}

/**
 * Get environment-specific configuration
 */
export function getEnvironmentConfig(configuration: NovaConfiguration): any {
  const isProduction = process.env.NODE_ENV === 'production';
  return isProduction 
    ? configuration.environmentConfiguration.production
    : configuration.environmentConfiguration.development;
}

/**
 * Invalidate configuration cache
 */
export function invalidateConfigCache(): void {
  configCache = null;
  cacheTimestamp = 0;
  console.log('🔄 [NovaConfig] Configuration cache invalidated');
}

/**
 * Get fallback configuration for error scenarios
 */
function getFallbackConfiguration(): NovaConfiguration {
  return {
    configId: 'fallback',
    configName: 'Fallback Nova Sonic Configuration',
    version: '1.0.0-fallback',
    lastUpdated: new Date().toISOString(),
    
    modelConfiguration: {
      modelId: 'amazon.nova-sonic-v1:0',
      voiceId: 'matthew',
      temperature: 0.7,
      maxTokens: 1024,
      topP: 0.9,
      frequencyPenalty: 0.0,
      presencePenalty: 0.0
    },
    
    audioInputConfiguration: {
      mediaType: 'audio/lpcm',
      sampleRateHertz: 16000,
      sampleSizeBits: 16,
      channelCount: 1,
      encoding: 'base64',
      audioType: 'SPEECH'
    },
    
    audioOutputConfiguration: {
      mediaType: 'audio/lpcm',
      sampleRateHertz: 24000,
      sampleSizeBits: 16,
      channelCount: 1,
      voiceId: 'matthew',
      encoding: 'base64',
      audioType: 'SPEECH'
    },
    
    vadConfiguration: {
      threshold: 0.015,
      silenceDetectionMs: 2000,
      initialSilenceMs: 4000,
      frameProcessingMs: 30
    },
    
    audioProcessingConfiguration: {
      chunkConcatenation: true,
      playbackOnContentEnd: true,
      bufferMaxSize: 15,
      silenceThreshold: 50,
      enableBargein: true,
      bargeInThreshold: 3
    },
    
    sessionConfiguration: {
      maxSessionDurationMs: 480000,
      extendedSessionEnabled: true,
      autoResumeEnabled: true,
      resumeTimeoutsMs: [450000, 930000],
      maxConversationHistory: 50
    },
    
    systemPrompts: {
      default: 'You are Nova, a friendly AI tutor who ALWAYS responds with voice immediately.',
      conversationResume: 'Continue our educational conversation as Nova, the AI tutor.',
      kickoffMessage: 'Hi Nova! I\'m ready to learn. Please introduce yourself and start teaching me right now. Speak to me!'
    },
    
    performanceConfiguration: {
      enableStrategicLogging: true,
      logFrequencyReduction: {
        vadLogging: 10,
        audioSendLogging: 5,
        workletHealthLogging: 500
      },
      enableRequestAnimationFrame: true,
      enableSessionCleanup: true
    },
    
    errorHandlingConfiguration: {
      maxRetries: 3,
      retryDelayMs: 1000,
      enableFallbackVoice: true,
      fallbackVoiceId: 'Olivia',
      enableErrorLogging: true,
      enablePerformanceMonitoring: true
    },
    
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
}

/**
 * Increment version number
 */
function incrementVersion(version: string): string {
  const parts = version.split('.');
  if (parts.length >= 3) {
    parts[2] = (parseInt(parts[2]) + 1).toString();
    return parts.join('.');
  }
  return version + '.1';
}

/**
 * Export service instance
 */
export const novaConfigService = {
  getConfiguration: getNovaConfiguration,
  updateConfiguration: updateNovaConfiguration,
  getEnvironmentConfig,
  invalidateCache: invalidateConfigCache
};

export default novaConfigService;
