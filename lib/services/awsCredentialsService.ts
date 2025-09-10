/**
 * AWS Temporary Credentials Service
 * Obtiene credenciales temporales de AWS usando Cognito Identity Pool
 */

import { CognitoIdentityClient } from "@aws-sdk/client-cognito-identity";
import { fromCognitoIdentityPool } from "@aws-sdk/credential-provider-cognito-identity";
import { AWS_CONFIG } from '../config';

export class AWSCredentialsService {
  private static instance: AWSCredentialsService;
  private credentials: any = null;

  public static getInstance(): AWSCredentialsService {
    if (!AWSCredentialsService.instance) {
      AWSCredentialsService.instance = new AWSCredentialsService();
    }
    return AWSCredentialsService.instance;
  }

  /**
   * Obtiene credenciales temporales de AWS usando el token de Cognito
   */
  public async getTemporaryCredentials(idToken?: string) {
    // Declare variables outside try block for error handler access
    let cognitoIdToken = idToken;
    let providerName = `cognito-idp.${AWS_CONFIG.region}.amazonaws.com/${AWS_CONFIG.cognito.userPoolId}`;
    
    try {
      console.log('🔑 Obteniendo credenciales temporales de AWS...');

      // Si no hay token, intentar obtenerlo del localStorage
      if (!cognitoIdToken && typeof window !== 'undefined') {
        // Try to get tokens from localStorage - support both formats
        const storedTokens = localStorage.getItem('cognito_tokens');
        const storedUser = localStorage.getItem('cognia_user_data');
        
        // Format 1: Tokens stored separately
        if (storedTokens) {
          console.log('🔍 Checking tokens from cognito_tokens storage');
          const tokens = JSON.parse(storedTokens);
          cognitoIdToken = tokens.idToken;
        }
        // Format 2: Tokens embedded in user object (current login format)
        else if (storedUser) {
          console.log('🔍 Checking tokens from cognia_user_data storage');
          const user = JSON.parse(storedUser);
          cognitoIdToken = user.idToken;
        }
        
        // Validate token expiration if we found one
        if (cognitoIdToken) {
          try {
            const payload = JSON.parse(atob(cognitoIdToken.split('.')[1]));
            const currentTime = Math.floor(Date.now() / 1000);
            
            // Check if token is actually expired (no buffer, let AWS decide)
            if (payload.exp && currentTime >= payload.exp) {
              console.warn('⚠️ Token de Cognito expirado, limpiando del storage');
              console.warn(`⚠️ Token exp: ${payload.exp}, Current: ${currentTime}, Diff: ${payload.exp - currentTime}s`);
              localStorage.removeItem('cognito_tokens');
              localStorage.removeItem('cognia_user_data');
              cognitoIdToken = undefined;
            } else {
              console.log('✅ Token de Cognito válido encontrado');
            }
          } catch (error) {
            console.warn('⚠️ Error decodificando token, limpiando storage:', error);
            localStorage.removeItem('cognito_tokens');
            localStorage.removeItem('cognia_user_data');
            cognitoIdToken = undefined;
          }
        }
      }

      if (!cognitoIdToken) {
        // Si no hay token válido, forzar re-login - NO usar credenciales no autenticadas
        console.error('❌ No hay token de Cognito válido, requiere re-login');
        throw new Error('COGNITO_TOKEN_REQUIRED: User needs to login to access AWS services');
      }
      
      // Usar credenciales autenticadas con el token de Cognito
      // providerName already defined above
      
      // Validate token format and decode payload for debugging
      try {
        const tokenParts = cognitoIdToken.split('.');
        if (tokenParts.length !== 3) {
          throw new Error('Invalid JWT token format');
        }
        
        // Decode and validate token payload
        const payload = JSON.parse(atob(tokenParts[1]));
        const expectedIssuer = `https://cognito-idp.${AWS_CONFIG.region}.amazonaws.com/${AWS_CONFIG.cognito.userPoolId}`;
        
        console.log('🔍 DETAILED TOKEN VALIDATION:');
        console.log('🔍 Token iss:', payload.iss);
        console.log('🔍 Expected iss:', expectedIssuer);
        console.log('🔍 Token aud:', payload.aud);
        console.log('🔍 Expected aud:', AWS_CONFIG.cognito.clientId);
        console.log('🔍 Token use:', payload.token_use);
        console.log('🔍 Token exp:', payload.exp, '(', new Date(payload.exp * 1000).toISOString(), ')');
        console.log('🔍 Current time:', Math.floor(Date.now() / 1000), '(', new Date().toISOString(), ')');
        
        // AWS Documentation validation checks
        if (payload.iss !== expectedIssuer) {
          console.error('🚨 AWS DOCS ERROR: Token issuer mismatch!');
          console.error('🚨 This is the most common cause of 400 errors');
          console.error('🚨 Token iss:', payload.iss);
          console.error('🚨 Expected iss:', expectedIssuer);
        }
        
        if (payload.aud !== AWS_CONFIG.cognito.clientId) {
          console.error('🚨 AWS DOCS ERROR: Token audience mismatch!');
          console.error('🚨 Token aud:', payload.aud);
          console.error('🚨 Expected aud:', AWS_CONFIG.cognito.clientId);
        }
        
        if (payload.token_use !== 'id') {
          console.error('🚨 AWS DOCS ERROR: Must use ID token, not access token!');
          console.error('🚨 Current token_use:', payload.token_use);
        }
        
        const currentTime = Math.floor(Date.now() / 1000);
        if (currentTime >= payload.exp) {
          console.error('🚨 AWS DOCS ERROR: Token is expired!');
          console.error('🚨 Token exp:', payload.exp);
          console.error('🚨 Current time:', currentTime);
        }
        
        console.log('✅ Token format válido para Identity Pool');
      } catch (e) {
        console.warn('⚠️ Token format validation failed:', e);
        throw new Error('Invalid Cognito token format');
      }
      
      this.credentials = fromCognitoIdentityPool({
        client: new CognitoIdentityClient({ region: AWS_CONFIG.region }),
        identityPoolId: AWS_CONFIG.cognito.identityPoolId,
        logins: {
          [providerName]: cognitoIdToken
        }
      });

      // Forzar la resolución de las credenciales
      const resolvedCreds = await this.credentials();
      console.log('✅ Credenciales temporales obtenidas exitosamente');
      
      return this.credentials;
    } catch (error: any) {
      console.error('❌ Error obteniendo credenciales temporales:', error);
      
      // DEBUGGING: Capture detailed error information
      console.error('🔍 ERROR DETAILS:');
      console.error('🔍 Error name:', error?.name);
      console.error('🔍 Error message:', error?.message);
      console.error('🔍 Error code:', error?.code || error?.$response?.error?.code);
      console.error('🔍 HTTP status:', error?.$response?.httpResponse?.statusCode);
      console.error('🔍 Error type:', error?.$fault);
      console.error('🔍 Request ID:', error?.$response?.requestId);
      
      if (error?.$response?.httpResponse?.body) {
        try {
          const bodyText = new TextDecoder().decode(error.$response.httpResponse.body);
          console.error('🔍 Response body:', bodyText);
        } catch (e) {
          console.error('🔍 Could not decode response body:', e);
        }
      }
      
      // Check specific error patterns from AWS documentation
      if (error?.message?.includes('Token is not from a supported provider')) {
        console.error('🚨 AWS DOCS: Token provider mismatch - verify ProviderName format');
        console.error('🚨 Expected format: cognito-idp.{region}.amazonaws.com/{user-pool-id}');
        console.error('🚨 Current format:', providerName);
      }
      
      if (error?.message?.includes('Invalid login token')) {
        console.error('🚨 AWS DOCS: Invalid token format - token may be malformed');
        if (cognitoIdToken) {
          console.error('🚨 Token length:', cognitoIdToken.length);
          console.error('🚨 Token starts with:', cognitoIdToken.substring(0, 20));
        }
      }
      
      if (error?.code === 'InvalidParameterException') {
        console.error('🚨 AWS DOCS: Invalid parameters - check IdentityPoolId and ProviderName');
      }
      
      if (error?.$response?.httpResponse?.statusCode === 400) {
        console.error('🚨 AWS DOCS: Bad Request - likely ServerSideTokenCheck validation failure');
        console.error('🚨 Suggestion: Token may be from before ServerSideTokenCheck was enabled');
      }
      
      throw error;
    }
  }

  /**
   * Obtiene las credenciales actuales o las genera si no existen
   */
  public async getCredentials() {
    try {
      if (!this.credentials) {
        await this.getTemporaryCredentials();
      }
      return this.credentials;
    } catch (error) {
      console.error('❌ Credenciales de Cognito fallaron, necesario re-login:', error);
      
      // Clear expired credentials from storage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('cognito_tokens');
        console.log('🔄 Tokens expirados eliminados del storage');
      }
      
      // Throw error to force re-authentication - NO FALLBACK TO HARDCODED CREDENTIALS
      throw new Error('COGNITO_TOKEN_EXPIRED: User needs to login again');
    }
  }

  /**
   * Limpia las credenciales almacenadas
   */
  public clearCredentials() {
    this.credentials = null;
  }
}

export const awsCredentialsService = AWSCredentialsService.getInstance();