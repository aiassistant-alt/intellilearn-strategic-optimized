/**
 * AWS Bedrock Integration for CognIA Intellilearn
 * Enhanced integration based on SherlockBedrockAssistant patterns
 * Replaces Firebase/Gemini with AWS Bedrock Claude 3.5 Sonnet
 */

import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from '@aws-sdk/client-bedrock-runtime';

import { AWS_CONFIG } from './config';

// AWS Bedrock Configuration
const BEDROCK_CONFIG = {
  region: AWS_CONFIG.region,
  modelId: 'anthropic.claude-3-haiku-20240307-v1:0'
};

// Cliente de Bedrock - las credenciales se obtendrán dinámicamente
let bedrockClient: BedrockRuntimeClient | null = null;

// Función para obtener o crear el cliente de Bedrock
function getBedrockClient(): BedrockRuntimeClient {
  if (!bedrockClient) {
    // En producción, las credenciales vendrán de Cognito Identity Pool
    // Por ahora, crear el cliente sin credenciales explícitas
    bedrockClient = new BedrockRuntimeClient({
      region: BEDROCK_CONFIG.region
    });
  }
  return bedrockClient;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface BedrockResponse {
  content: Array<{
    text: string;
    type: string;
  }>;
  id: string;
  model: string;
  role: string;
  stop_reason: string;
  stop_sequence: null | string;
  type: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

/**
 * Chat with AWS Bedrock (Claude 3 Haiku)
 * @param userMessage - The user's message
 * @param systemPrompt - System prompt for the AI
 * @param chatHistory - Previous conversation history
 * @returns AI response text
 */
export async function chatWithAI(
  userMessage: string,
  systemPrompt: string,
  chatHistory: ChatMessage[] = []
): Promise<string> {
  try {
    // Prepare conversation history for Claude, ensuring alternating roles
    let messages = [...chatHistory.slice(-10)]; // Keep last 10 messages for context
    
    // Ensure the conversation starts with a user message
    // If history is empty or doesn't start with user, add the current user message
    if (messages.length === 0) {
      messages.push({ role: 'user' as const, content: userMessage });
    } else {
      // Ensure first message is from user
      if (messages[0].role !== 'user') {
        // Remove any initial assistant messages
        while (messages.length > 0 && messages[0].role === 'assistant') {
          messages.shift();
        }
      }
      
      // Add current user message if the last message isn't already from the user
      if (messages.length === 0 || messages[messages.length - 1].role !== 'user') {
        messages.push({ role: 'user' as const, content: userMessage });
      } else {
        // If the last message is already from user, replace it with the new message
        messages[messages.length - 1] = { role: 'user' as const, content: userMessage };
      }
    }

    // Final validation: ensure conversation starts with user and has valid alternating pattern
    const validMessages: ChatMessage[] = [];
    let expectedRole: 'user' | 'assistant' = 'user';
    
    for (const message of messages) {
      if (message.role === expectedRole) {
        validMessages.push(message);
        expectedRole = expectedRole === 'user' ? 'assistant' : 'user';
      }
      // Skip messages that break the alternating pattern
    }
    
    // Ensure we end with a user message
    if (validMessages.length === 0 || validMessages[validMessages.length - 1].role !== 'user') {
      validMessages.push({ role: 'user' as const, content: userMessage });
    }

    console.log('Messages being sent to Bedrock:', validMessages);

    const response = await invokeBedrock(
      userMessage,
      systemPrompt,
      validMessages,
      BEDROCK_CONFIG.modelId
    );

    return response;
  } catch (error) {
    console.error('Error calling AWS Bedrock:', error);
    return 'Lo siento, no puedo procesar tu solicitud en este momento. Por favor, intenta de nuevo más tarde.';
  }
}

/**
 * Invoke AWS Bedrock model
 */
async function invokeBedrock(
  userMessage: string,
  systemPrompt: string,
  messages: ChatMessage[],
  modelId: string
): Promise<string> {
  try {
    const payload = {
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: 1000,
      messages: messages,
      system: systemPrompt,
      temperature: 0.7,
      top_p: 0.9
    };

    const command = new InvokeModelCommand({
      modelId: modelId,
      contentType: 'application/json',
      body: JSON.stringify(payload)
    });

    const response = await getBedrockClient().send(command);
    
    if (!response.body) {
      throw new Error('No response body received from Bedrock');
    }

    const responseBody: BedrockResponse = JSON.parse(
      new TextDecoder().decode(response.body)
    );
    
    if (responseBody.content && responseBody.content[0] && responseBody.content[0].text) {
      return responseBody.content[0].text;
    } else {
      throw new Error('Invalid response format from Bedrock');
    }

  } catch (error) {
    console.error('Error invoking Bedrock:', error);
    throw error;
  }
}

/**
 * Generate educational content using AWS Bedrock
 */
export async function generateEducationalContent(
  topic: string,
  level: 'beginner' | 'intermediate' | 'advanced' = 'intermediate'
): Promise<string> {
  const systemPrompt = `Eres un experto educador que crea contenido didáctico de alta calidad. 
  Genera contenido educativo sobre el tema solicitado, adaptado al nivel ${level}.
  El contenido debe ser claro, estructurado y fácil de entender.`;
  
  const userMessage = `Genera contenido educativo sobre: ${topic}`;
  
  return await chatWithAI(userMessage, systemPrompt);
}

/**
 * Check if AWS Bedrock is available
 */
export async function checkBedrockAvailability(): Promise<boolean> {
  try {
    await chatWithAI('test', 'Responde solo "ok"');
    return true;
  } catch (error) {
    console.error('Bedrock not available:', error);
    return false;
  }
} 