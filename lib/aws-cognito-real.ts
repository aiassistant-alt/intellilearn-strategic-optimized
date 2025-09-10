/**
 * AWS Cognito Real Authentication Service
 * Production-ready implementation with centralized configuration
 */

import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  SignUpCommand,
  ConfirmSignUpCommand,
  ResendConfirmationCodeCommand,
  ForgotPasswordCommand,
  ConfirmForgotPasswordCommand,
  GlobalSignOutCommand,
  GetUserCommand,
  AuthFlowType
} from '@aws-sdk/client-cognito-identity-provider';

import { CognitoIdentityClient } from '@aws-sdk/client-cognito-identity';
import { AWS_CONFIG } from './config';

// Initialize Cognito clients - las credenciales se obtendrán dinámicamente
const cognitoClient = new CognitoIdentityProviderClient({
  region: AWS_CONFIG.region
});

const identityClient = new CognitoIdentityClient({
  region: AWS_CONFIG.region
});

export interface CognitoUser {
  username: string;
  email: string;
  displayName?: string;
  accessToken?: string;
  idToken?: string;
  refreshToken?: string;
}

export async function signIn(email: string, password: string): Promise<CognitoUser> {
  console.log('🔐 Attempting sign in for:', email);
  console.log('🔧 Using client ID:', AWS_CONFIG.cognito.clientId);
  console.log('🔧 Using user pool:', AWS_CONFIG.cognito.userPoolId);
  
  try {
    const command = new InitiateAuthCommand({
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: AWS_CONFIG.cognito.clientId,
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password,
      },
    });

    console.log('📤 Sending auth command:', {
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: AWS_CONFIG.cognito.clientId,
      AuthParameters: {
        USERNAME: email,
        PASSWORD: '[HIDDEN]'
      }
    });

    const response = await cognitoClient.send(command);
    console.log('📥 Auth response received:', response);

    if (response.AuthenticationResult) {
      const user: CognitoUser = {
        username: email,
        email: email,
        displayName: email.split('@')[0],
        accessToken: response.AuthenticationResult.AccessToken,
        idToken: response.AuthenticationResult.IdToken,
        refreshToken: response.AuthenticationResult.RefreshToken,
      };
      
      // Guardar usuario en localStorage para persistencia
      if (typeof window !== 'undefined') {
        localStorage.setItem('cognia_user_data', JSON.stringify(user));
        console.log('💾 User saved to localStorage');
      }
      
      console.log('✅ Sign in successful for:', email);
      return user;
    } else {
      console.error('❌ No authentication result received');
      throw new Error('No se pudo completar la autenticación');
    }
  } catch (error) {
    console.error('❌ Sign in error:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    throw error;
  }
}

// Listeners para cambios de autenticación
let authListeners: Array<(user: CognitoUser | null) => void> = [];

export const subscribeToAuthChanges = (callback: (user: CognitoUser | null) => void) => {
  authListeners.push(callback);
  return () => {
    authListeners = authListeners.filter(listener => listener !== callback);
  };
};

const notifyAuthListeners = (user: CognitoUser | null) => {
  authListeners.forEach(callback => callback(user));
};

export async function signUp(email: string, password: string, displayName?: string): Promise<void> {
  console.log('📝 Attempting sign up for:', email);
  
  try {
    const command = new SignUpCommand({
      ClientId: AWS_CONFIG.cognito.clientId,
      Username: email,
      Password: password,
      UserAttributes: [
        {
          Name: 'email',
          Value: email,
        },
        ...(displayName ? [{
          Name: 'name',
          Value: displayName,
        }] : [])
      ],
    });

    const response = await cognitoClient.send(command);
    console.log('✅ Sign up successful:', response);
  } catch (error) {
    console.error('❌ Sign up error:', error);
    throw error;
  }
}

export async function confirmSignUp(email: string, confirmationCode: string): Promise<void> {
  console.log('✅ Confirming sign up for:', email);
  
  try {
    const command = new ConfirmSignUpCommand({
      ClientId: AWS_CONFIG.cognito.clientId,
      Username: email,
      ConfirmationCode: confirmationCode,
    });

    await cognitoClient.send(command);
    console.log('✅ Sign up confirmed successfully');
  } catch (error) {
    console.error('❌ Confirm sign up error:', error);
    throw error;
  }
}

export async function signOut(): Promise<void> {
  console.log('🚪 Signing out...');
  // Clear local storage or session storage if needed
  if (typeof window !== 'undefined') {
    localStorage.removeItem('cognia_user_data');
    localStorage.removeItem('cognia_auth_token');
    sessionStorage.clear();
  }
  console.log('✅ Sign out completed');
}

export async function getCurrentUser(): Promise<CognitoUser | null> {
  console.log('👤 Getting current user...');
  
  try {
    // Try to get user from local storage first
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('cognia_user_data');
      const storedTokens = localStorage.getItem('cognito_tokens');
      
      if (storedUser) {
        const user = JSON.parse(storedUser);
        
        // Check if tokens are already included in user object (current format)
        const hasTokensInUser = !!(user.idToken && user.accessToken);
        
        // Check if tokens exist separately (alternative format)
        const hasTokensSeparate = !!(storedTokens);
        
        if (hasTokensInUser) {
          // Format 1: Tokens are inside the user object
          console.log('📦 Tokens found within user object');
          
          // Validate token expiration
          try {
            const payload = JSON.parse(atob(user.idToken.split('.')[1]));
            const currentTime = Math.floor(Date.now() / 1000);
            
            if (payload.exp && currentTime >= payload.exp) {
              console.warn('⚠️ Stored token is expired, clearing storage');
              localStorage.removeItem('cognia_user_data');
              localStorage.removeItem('cognito_tokens');
              return null;
            }
          } catch (tokenError) {
            console.warn('⚠️ Error validating stored token:', tokenError);
            localStorage.removeItem('cognia_user_data');
            localStorage.removeItem('cognito_tokens');
            return null;
          }
          
          console.log('✅ User found in storage with valid tokens (embedded):', user.email);
          return user;
          
        } else if (hasTokensSeparate) {
          // Format 2: Tokens are stored separately
          console.log('📦 Tokens found in separate storage');
          const tokens = JSON.parse(storedTokens);
          
          // Validate token expiration
          if (tokens.idToken) {
            try {
              const payload = JSON.parse(atob(tokens.idToken.split('.')[1]));
              const currentTime = Math.floor(Date.now() / 1000);
              
              if (payload.exp && currentTime >= payload.exp) {
                console.warn('⚠️ Stored token is expired, clearing storage');
                localStorage.removeItem('cognia_user_data');
                localStorage.removeItem('cognito_tokens');
                return null;
              }
            } catch (tokenError) {
              console.warn('⚠️ Error validating stored token:', tokenError);
              localStorage.removeItem('cognia_user_data');
              localStorage.removeItem('cognito_tokens');
              return null;
            }
          }
          
          console.log('✅ User found in storage with valid tokens (separate):', user.email);
          
          // Return user with tokens included
          return {
            ...user,
            ...tokens // Include idToken, accessToken, refreshToken
          };
          
        } else {
          // User exists but no valid tokens found
          console.warn('⚠️ User data found but no valid tokens, clearing storage');
          localStorage.removeItem('cognia_user_data');
          localStorage.removeItem('cognito_tokens');
          return null;
        }
      }
    }
    
    console.log('ℹ️ No current user found');
    return null;
  } catch (error) {
    console.error('❌ Get current user error:', error);
    return null;
  }
}

export async function forgotPassword(email: string): Promise<void> {
  console.log('🔄 Initiating forgot password for:', email);
  
  try {
    const command = new ForgotPasswordCommand({
      ClientId: AWS_CONFIG.cognito.clientId,
      Username: email,
    });

    await cognitoClient.send(command);
    console.log('✅ Forgot password initiated successfully');
  } catch (error) {
    console.error('❌ Forgot password error:', error);
    throw error;
  }
}

export async function confirmForgotPassword(
  email: string,
  confirmationCode: string,
  newPassword: string
): Promise<void> {
  console.log('🔄 Confirming forgot password for:', email);
  
  try {
    const command = new ConfirmForgotPasswordCommand({
      ClientId: AWS_CONFIG.cognito.clientId,
      Username: email,
      ConfirmationCode: confirmationCode,
      Password: newPassword,
    });

    await cognitoClient.send(command);
    console.log('✅ Password reset completed successfully');
  } catch (error) {
    console.error('❌ Confirm forgot password error:', error);
    throw error;
  }
}

export async function initializeAuth(): Promise<CognitoUser | null> {
  console.log('🔧 Initializing auth...');
  return await getCurrentUser();
}

export default AWS_CONFIG; 