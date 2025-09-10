/**
 * ^AwsBedrockService
 * Author: Luis Arturo Parra - Telmo AI
 * Created: 2025-09-10
 * Usage: AWS Bedrock AI service with Secrets Manager integration
 * Business Context: Secure AI chat functionality using AWS native services
 * Relations: Used by AssistantAI component for chat functionality
 * Reminders: All credentials managed via AWS Secrets Manager - no hardcoded values
 */

'use client';

import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { fromCognitoIdentityPool } from '@aws-sdk/credential-providers';

// AWS Configuration from environment
const AWS_REGION = process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1';
const IDENTITY_POOL_ID = process.env.NEXT_PUBLIC_AWS_IDENTITY_POOL_ID || 'us-east-1:2e649222-65f2-4757-850a-c8a8b8c98ff3';
const SECRETS_NAME = process.env.NEXT_PUBLIC_AWS_SECRETS_NAME || 'intellilearn/api-keys';

// Claude 3 Haiku model ID (most cost-effective for chat)
const MODEL_ID = 'anthropic.claude-3-haiku-20240307-v1:0';

// Cached clients for performance
let bedrockClient: BedrockRuntimeClient | null = null;
let secretsClient: SecretsManagerClient | null = null;
let cachedSecrets: any = null;

/**
 * Get AWS credentials using Cognito Identity Pool
 */
const getCredentials = () => {
  return fromCognitoIdentityPool({
    identityPoolId: IDENTITY_POOL_ID,
    clientConfig: {
      region: AWS_REGION,
    },
  });
};

/**
 * Initialize AWS Bedrock client with Cognito credentials
 */
const getBedrockClient = (): BedrockRuntimeClient => {
  if (!bedrockClient) {
    bedrockClient = new BedrockRuntimeClient({
      region: AWS_REGION,
      credentials: getCredentials(),
    });
  }
  return bedrockClient;
};

/**
 * Initialize AWS Secrets Manager client
 */
const getSecretsClient = (): SecretsManagerClient => {
  if (!secretsClient) {
    secretsClient = new SecretsManagerClient({
      region: AWS_REGION,
      credentials: getCredentials(),
    });
  }
  return secretsClient;
};

/**
 * Retrieve secrets from AWS Secrets Manager (with caching)
 */
const getSecrets = async (): Promise<any> => {
  if (cachedSecrets) {
    return cachedSecrets;
  }

  try {
    const client = getSecretsClient();
    const command = new GetSecretValueCommand({
      SecretId: SECRETS_NAME,
    });

    const response = await client.send(command);
    cachedSecrets = JSON.parse(response.SecretString || '{}');
    
    console.log('✅ [AwsBedrockService] Secrets retrieved from AWS Secrets Manager');
    return cachedSecrets;
  } catch (error) {
    console.error('❌ [AwsBedrockService] Error retrieving secrets:', error);
    // Return empty object to prevent crashes
    cachedSecrets = {};
    return cachedSecrets;
  }
};

/**
 * Interface for chat messages
 */
interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Interface for Bedrock response
 */
interface BedrockResponse {
  content: Array<{
    text: string;
  }>;
}

/**
 * Send message to Claude via AWS Bedrock
 * Main chat functionality for AI assistant
 */
export const chatWithAI = async (
  message: string,
  systemPrompt: string = "You are an expert educational assistant. Provide helpful, accurate, and motivating responses about academic topics. Respond in Spanish."
): Promise<string> => {
  try {
    console.log('[AwsBedrockService] Sending message to Claude...');
    
    const client = getBedrockClient();
    
    // Prepare messages with system prompt
    const messages: ChatMessage[] = [
      { role: 'user', content: `${systemPrompt}\n\nUser: ${message}` }
    ];

    const command = new InvokeModelCommand({
      modelId: MODEL_ID,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: 1000,
        messages: messages,
        temperature: 0.7,
        top_p: 0.9
      })
    });

    const response = await client.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body)) as BedrockResponse;
    
    const aiResponse = responseBody.content[0]?.text || 'Lo siento, no pude procesar tu mensaje.';
    console.log('✅ [AwsBedrockService] Response received from Claude');
    
    return aiResponse;
  } catch (error) {
    console.error('❌ [AwsBedrockService] Error calling Bedrock:', error);
    return 'Lo siento, hay un problema temporal con el asistente. Por favor intenta de nuevo.';
  }
};

/**
 * Generate course content using AWS Bedrock
 */
export const generateCourseContent = async (
  topic: string,
  level: 'beginner' | 'intermediate' | 'advanced' = 'intermediate'
): Promise<any> => {
  try {
    console.log(`[AwsBedrockService] Generating course content for: ${topic}`);
    
    const client = getBedrockClient();
    
    const prompt = `Genera contenido educativo para un curso sobre "${topic}" de nivel ${level}. 
    Incluye: título, descripción, objetivos de aprendizaje, y estructura de módulos.
    Responde en formato JSON en español.`;

    const command = new InvokeModelCommand({
      modelId: MODEL_ID,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7
      })
    });

    const response = await client.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body)) as BedrockResponse;
    
    const content = JSON.parse(responseBody.content[0]?.text || '{}');
    console.log('✅ [AwsBedrockService] Course content generated');
    
    return content;
  } catch (error) {
    console.error('❌ [AwsBedrockService] Error generating course content:', error);
    throw new Error('Error generando contenido del curso');
  }
};

/**
 * Send conversational message with history
 */
export const sendConversationalMessage = async (
  message: string,
  conversationHistory: ChatMessage[] = []
): Promise<string> => {
  try {
    const client = getBedrockClient();
    
    const messages = [
      ...conversationHistory,
      { role: 'user' as const, content: message }
    ];

    const command = new InvokeModelCommand({
      modelId: MODEL_ID,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: 1000,
        messages: messages,
        temperature: 0.7,
        top_p: 0.9
      })
    });

    const response = await client.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body)) as BedrockResponse;
    
    return responseBody.content[0]?.text || 'Lo siento, no pude procesar tu mensaje.';
  } catch (error) {
    console.error('❌ [AwsBedrockService] Error in conversational message:', error);
    throw new Error('Error de comunicación con el asistente de IA');
  }
};

/**
 * Export bedrock client getter for advanced use cases
 */
export const getBedrockClientInstance = getBedrockClient;

/**
 * Export secrets getter for other services
 */
export const getAwsSecrets = getSecrets;
