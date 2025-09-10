/**
 * @fileoverview AWS Cognito Authentication Service
 * @description
 * Provides comprehensive authentication functionality using AWS Cognito.
 * This module replaces Firebase Authentication with AWS Cognito Identity Provider.
 * 
 * @context 
 * This service integrates Intellilearn with AWS ecosystem including:
 * - AWS Cognito for user authentication
 * - AWS Bedrock for AI capabilities
 * - S3 Vectors for document storage
 * 
 * @version v2.0.0 - AWS Migration from Firebase
 * @author Sherlock AI Team
 * @lastModified 2025-01-27
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
  AuthFlowType,
  ChallengeNameType
} from '@aws-sdk/client-cognito-identity-provider';

import { CognitoIdentityClient, GetIdCommand, GetCredentialsForIdentityCommand } from '@aws-sdk/client-cognito-identity';
import { AWS_CONFIG } from './config';

// AWS Configuration from environment variables
const AWS_REGION = AWS_CONFIG.region;
const USER_POOL_ID = AWS_CONFIG.cognito.userPoolId;
const CLIENT_ID = AWS_CONFIG.cognito.clientId;
const IDENTITY_POOL_ID = AWS_CONFIG.cognito.identityPoolId;

// Initialize Cognito clients
const cognitoClient = new CognitoIdentityProviderClient({
  region: AWS_REGION
});

const identityClient = new CognitoIdentityClient({
  region: AWS_REGION
});

// User interface
export interface CognitoUser {
  id: string;
  email: string;
  name?: string;
  accessToken: string;
  refreshToken: string;
  idToken: string;
}

// Auth state management
let currentUser: CognitoUser | null = null;
let authListeners: ((user: CognitoUser | null) => void)[] = [];

/**
 * Subscribe to authentication state changes
 */
export const subscribeToAuthChanges = (callback: (user: CognitoUser | null) => void) => {
  authListeners.push(callback);
  // Immediately call with current state
  callback(currentUser);
  
  // Return unsubscribe function
  return () => {
    authListeners = authListeners.filter(listener => listener !== callback);
  };
};

/**
 * Notify all listeners of auth state change
 */
const notifyAuthListeners = (user: CognitoUser | null) => {
  currentUser = user;
  authListeners.forEach(listener => listener(user));
};

/**
 * Sign up a new user
 */
export const signUp = async (email: string, password: string, name?: string) => {
  try {
    const command = new SignUpCommand({
      ClientId: CLIENT_ID,
      Username: email,
      Password: password,
      UserAttributes: [
        {
          Name: 'email',
          Value: email
        },
        ...(name ? [{
          Name: 'name',
          Value: name
        }] : [])
      ]
    });

    const response = await cognitoClient.send(command);
    
    return {
      success: true,
      userSub: response.UserSub,
      message: 'User registered successfully. Please check your email for verification code.'
    };
  } catch (error: any) {
    console.error('Sign up error:', error);
    return {
      success: false,
      error: error.message || 'Failed to sign up'
    };
  }
};

/**
 * Confirm user registration with verification code
 */
export const confirmSignUp = async (email: string, code: string) => {
  try {
    const command = new ConfirmSignUpCommand({
      ClientId: CLIENT_ID,
      Username: email,
      ConfirmationCode: code
    });

    await cognitoClient.send(command);
    
    return {
      success: true,
      message: 'Email verified successfully. You can now sign in.'
    };
  } catch (error: any) {
    console.error('Confirm sign up error:', error);
    return {
      success: false,
      error: error.message || 'Failed to verify email'
    };
  }
};

/**
 * Sign in user with email and password
 */
export const signInWithEmailAndPassword = async (email: string, password: string) => {
  try {
    console.log("Initiating Cognito authentication");
    
    const command = new InitiateAuthCommand({
      ClientId: CLIENT_ID,
      AuthFlow: AuthFlowType.USER_PASSWORD_AUTH,
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password
      }
    });

    const response = await cognitoClient.send(command);
    
    if (response.AuthenticationResult) {
      const user: CognitoUser = {
        id: response.AuthenticationResult.AccessToken ? 
          JSON.parse(atob(response.AuthenticationResult.AccessToken.split('.')[1])).sub : '',
        email,
        accessToken: response.AuthenticationResult.AccessToken || '',
        refreshToken: response.AuthenticationResult.RefreshToken || '',
        idToken: response.AuthenticationResult.IdToken || ''
      };
      
      notifyAuthListeners(user);
      
      return {
        success: true,
        user,
        message: 'Signed in successfully'
      };
    } else {
      return {
        success: false,
        error: 'Authentication failed - no result'
      };
    }
  } catch (error: any) {
    console.error('Sign in error:', error);
    
    let errorMessage = 'Authentication failed';
    if (error.name === 'NotAuthorizedException') {
      errorMessage = 'Incorrect email or password';
    } else if (error.name === 'UserNotConfirmedException') {
      errorMessage = 'Please verify your email before signing in';
    }
    
    return {
      success: false,
      error: errorMessage
    };
  }
};

/**
 * Sign out current user
 */
export const signOut = async () => {
  try {
    if (currentUser?.accessToken) {
      const command = new GlobalSignOutCommand({
        AccessToken: currentUser.accessToken
      });
      
      await cognitoClient.send(command);
    }
    
    notifyAuthListeners(null);
    
    return {
      success: true,
      message: 'Signed out successfully'
    };
  } catch (error: any) {
    console.error('Sign out error:', error);
    // Still clear local state even if server signout fails
    notifyAuthListeners(null);
    
    return {
      success: false,
      error: error.message || 'Failed to sign out'
    };
  }
};

/**
 * Get current authenticated user
 */
export const getCurrentUser = () => {
  return currentUser;
};

/**
 * Forgot password - send reset code
 */
export const forgotPassword = async (email: string) => {
  try {
    const command = new ForgotPasswordCommand({
      ClientId: CLIENT_ID,
      Username: email
    });

    await cognitoClient.send(command);
    
    return {
      success: true,
      message: 'Password reset code sent to your email'
    };
  } catch (error: any) {
    console.error('Forgot password error:', error);
    return {
      success: false,
      error: error.message || 'Failed to send reset code'
    };
  }
};

/**
 * Confirm forgot password with new password
 */
export const confirmForgotPassword = async (email: string, code: string, newPassword: string) => {
  try {
    const command = new ConfirmForgotPasswordCommand({
      ClientId: CLIENT_ID,
      Username: email,
      ConfirmationCode: code,
      Password: newPassword
    });

    await cognitoClient.send(command);
    
    return {
      success: true,
      message: 'Password reset successfully'
    };
  } catch (error: any) {
    console.error('Confirm forgot password error:', error);
    return {
      success: false,
      error: error.message || 'Failed to reset password'
    };
  }
};

/**
 * Initialize auth state from stored tokens (for SSR/persistence)
 */
export const initializeAuth = () => {
  // Check for stored tokens in localStorage
  if (typeof window !== 'undefined') {
    const storedTokens = localStorage.getItem('cognito_tokens');
    if (storedTokens) {
      try {
        const tokens = JSON.parse(storedTokens);
        const user: CognitoUser = {
          id: tokens.id,
          email: tokens.email,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          idToken: tokens.idToken
        };
        notifyAuthListeners(user);
      } catch (error) {
        console.error('Failed to restore auth state:', error);
        localStorage.removeItem('cognito_tokens');
      }
    }
  }
};

// Auto-initialize on module load
if (typeof window !== 'undefined') {
  initializeAuth();
}

/**
 * Export auth configuration for compatibility
 */
export const auth = {
  currentUser: () => currentUser,
  onAuthStateChanged: subscribeToAuthChanges
};

/**
 * Aliases for backwards compatibility with Firebase
 */
export const onAuthStateChanged = subscribeToAuthChanges;
export type User = CognitoUser; 