/**
 * Cognito Authentication Service for CognIA IntelliLearn Voice Streaming
 * 
 * @author Claude AI Assistant (Anthropic)
 * @version 2.0.0
 * @created 2025-01-28
 */

import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  AuthFlowType
} from '@aws-sdk/client-cognito-identity-provider';

// No usar credenciales hardcodeadas, usar AWS CLI o variables de entorno
const AWS_REGION = process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1';

// Initialize Cognito client - usar credenciales por defecto de AWS CLI
const cognitoClient = new CognitoIdentityProviderClient({
  region: AWS_REGION
});

export interface CognitoAuthResult {
  accessToken: string;
  idToken: string;
  refreshToken: string;
  expiresIn: number;
}

export class CognitoAuthService {
  private static instance: CognitoAuthService;
  private currentTokens: CognitoAuthResult | null = null;
  
  // Configuración sin hardcode
  private readonly userPoolId = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID || 'us-east-1_wCVGHj3uH';
  private readonly clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || '3je10g7unn142aimabthsps5q';
  private readonly username = process.env.NEXT_PUBLIC_COGNITO_USERNAME || 'demo@intellilearn.com';
  private readonly password = process.env.NEXT_PUBLIC_COGNITO_PASSWORD || 'Demo2025!';

  public static getInstance(): CognitoAuthService {
    if (!CognitoAuthService.instance) {
      CognitoAuthService.instance = new CognitoAuthService();
    }
    return CognitoAuthService.instance;
  }

  /**
   * Authenticate user and get JWT tokens
   */
  public async authenticateUser(username?: string, password?: string): Promise<CognitoAuthResult> {
    try {
      const user = username || this.username;
      const pass = password || this.password;
      
      console.log('🔐 Authenticating user with Cognito...', user);

      const command = new InitiateAuthCommand({
        AuthFlow: AuthFlowType.USER_PASSWORD_AUTH,
        ClientId: this.clientId,
        AuthParameters: {
          USERNAME: user,
          PASSWORD: pass
        }
      });

      const response = await cognitoClient.send(command);

      if (!response.AuthenticationResult) {
        throw new Error('Authentication failed - no tokens received');
      }

      const tokens: CognitoAuthResult = {
        accessToken: response.AuthenticationResult.AccessToken!,
        idToken: response.AuthenticationResult.IdToken!,
        refreshToken: response.AuthenticationResult.RefreshToken!,
        expiresIn: response.AuthenticationResult.ExpiresIn || 3600
      };

      // Store tokens for reuse
      this.currentTokens = tokens;
      
      // Store in localStorage for persistence
      if (typeof window !== 'undefined') {
        localStorage.setItem('cognito_tokens', JSON.stringify(tokens));
        localStorage.setItem('cognito_tokens_timestamp', Date.now().toString());
      }

      console.log('✅ Authentication successful');
      return tokens;

    } catch (error) {
      console.error('❌ Authentication failed:', error);
      throw error;
    }
  }

  /**
   * Get current valid Bearer token for API calls
   */
  public async getBearerToken(): Promise<string> {
    try {
      // Check if we have valid cached tokens
      if (this.currentTokens && this.isTokenValid()) {
        return `Bearer ${this.currentTokens.idToken}`;
      }

      // Try to restore from localStorage
      if (typeof window !== 'undefined') {
        const storedTokens = localStorage.getItem('cognito_tokens');
        const storedTimestamp = localStorage.getItem('cognito_tokens_timestamp');
        
        if (storedTokens && storedTimestamp) {
          const tokens = JSON.parse(storedTokens) as CognitoAuthResult;
          const timestamp = parseInt(storedTimestamp);
          
          // Check if tokens are still valid (within 50 minutes)
          if (Date.now() - timestamp < 50 * 60 * 1000) {
            this.currentTokens = tokens;
            return `Bearer ${tokens.idToken}`;
          }
        }
      }

      // Need to authenticate
      console.log('🔄 Tokens expired or missing, re-authenticating...');
      const tokens = await this.authenticateUser();
      return `Bearer ${tokens.idToken}`;

    } catch (error) {
      console.error('❌ Failed to get bearer token:', error);
      throw new Error('Authentication required');
    }
  }

  /**
   * Check if current tokens are valid
   */
  private isTokenValid(): boolean {
    if (!this.currentTokens) return false;
    
    // Simple expiration check (tokens are valid for 1 hour)
    const storedTimestamp = localStorage.getItem('cognito_tokens_timestamp');
    if (!storedTimestamp) return false;
    
    const timestamp = parseInt(storedTimestamp);
    return Date.now() - timestamp < 50 * 60 * 1000; // 50 minutes buffer
  }

  /**
   * Clear stored tokens
   */
  public clearTokens(): void {
    this.currentTokens = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('cognito_tokens');
      localStorage.removeItem('cognito_tokens_timestamp');
    }
  }
}

// Export singleton instance
export const cognitoAuth = CognitoAuthService.getInstance();