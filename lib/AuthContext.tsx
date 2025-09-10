/**
 * COGNIA INTELLILEARN - AUTHENTICATION CONTEXT
 * 
 * CONTEXTO DE NEGOCIO:
 * - Sistema de autenticación centralizado para la plataforma educativa CognIA
 * - Gestiona el estado de autenticación de estudiantes, profesores y administradores
 * - Integrado con AWS Cognito para seguridad empresarial y escalabilidad
 * - Permite acceso seguro a recursos educativos personalizados
 * 
 * PROPÓSITO:
 * - Proveer contexto de autenticación global para toda la aplicación
 * - Manejar persistencia de sesión entre recargas de página
 * - Controlar acceso a funcionalidades según el estado de autenticación
 * - Facilitar operaciones de login, logout y registro de usuarios
 * 
 * CASOS DE USO:
 * - Estudiante inicia sesión para acceder a sus cursos personalizados
 * - Profesor accede al dashboard para gestionar contenido educativo
 * - Sistema verifica permisos antes de mostrar chat AI o recursos premium
 */

'use client'

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  signIn as cognitoSignIn,
  signUp as cognitoSignUp,
  signOut as cognitoSignOut,
  getCurrentUser,
  initializeAuth,
  type CognitoUser
} from './aws-cognito-real';

interface AuthContextType {
  user: CognitoUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  handleTokenExpiration: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CognitoUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Authentication context initialization with comprehensive logging
  useEffect(() => {
    console.log('🔧 [AuthProvider] Initializing authentication context...');
    console.log('🔧 [AuthProvider] Current state:', { 
      hasUser: !!user, 
      userEmail: user?.email, 
      loading,
      timestamp: new Date().toISOString()
    });
    
    const initialize = async () => {
      try {
        console.log('🔧 [AuthProvider] Starting authentication initialization...');
        const currentUser = await initializeAuth();
        if (currentUser) {
          // Check if the restored user has valid tokens
          if (currentUser.idToken && isTokenExpired(currentUser.idToken)) {
            console.warn('⚠️ [AuthProvider] Restored user has expired token, clearing session');
            handleTokenExpiration();
            return;
          }
          
          console.log('✅ [AuthProvider] User successfully restored from storage:', currentUser.email);
          setUser(currentUser);
        } else {
          console.log('ℹ️ [AuthProvider] No existing user session found in storage');
        }
      } catch (error) {
        console.error('❌ [AuthProvider] Authentication initialization failed:', error);
        // Clean up any corrupted state
        localStorage.removeItem('cognia_auth_token');
        localStorage.removeItem('cognia_user_data');
        localStorage.removeItem('cognito_tokens');
        console.log('🧹 [AuthProvider] Corrupted authentication state cleaned up');
      } finally {
        setLoading(false);
        console.log('✅ [AuthProvider] Authentication initialization completed');
      }
    };

    initialize();
  }, []);

  // Check if current token is expired
  const isTokenExpired = (token: string): boolean => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      // Check actual expiration without buffer - let AWS decide
      return payload.exp && currentTime >= payload.exp;
    } catch {
      return true; // If we can't decode, consider it expired
    }
  };

  // Handle token expiration
  const handleTokenExpiration = () => {
    console.warn('🔄 [AuthProvider] Token expired, forcing logout');
    setUser(null);
    localStorage.removeItem('cognia_auth_token');
    localStorage.removeItem('cognia_user_data');
    localStorage.removeItem('cognito_tokens');
    
    // Redirect to login
    if (typeof window !== 'undefined') {
      window.location.href = '/auth/login';
    }
  };

  // Enhanced sign-in function with comprehensive error handling and logging
  const signIn = async (email: string, password: string) => {
    console.log('🔐 [AuthProvider] Sign-in initiated for user:', email);
    console.log('🔐 [AuthProvider] Authentication attempt timestamp:', new Date().toISOString());
    
    try {
      const result = await cognitoSignIn(email, password);
      console.log('✅ [AuthProvider] Sign-in successful for user:', email);
      console.log('✅ [AuthProvider] User session established:', {
        username: result.username,
        email: result.email,
        displayName: result.displayName,
        hasTokens: !!(result.accessToken && result.idToken)
      });
      
      // Check if token is valid before setting user
      if (result.idToken && isTokenExpired(result.idToken)) {
        console.error('❌ [AuthProvider] Received expired token, forcing re-authentication');
        throw new Error('Token expired immediately after sign-in');
      }
      
      setUser(result);
      
      // Persist user data in localStorage for session recovery
      localStorage.setItem('cognia_user_data', JSON.stringify(result));
      console.log('💾 [AuthProvider] User session persisted to localStorage');
      
    } catch (error) {
      console.error('❌ [AuthProvider] Sign-in failed for user:', email, error);
      // Clean up any corrupted state on error
      setUser(null);
      localStorage.removeItem('cognia_auth_token');
      localStorage.removeItem('cognia_user_data');
      localStorage.removeItem('cognito_tokens');
      console.log('🧹 [AuthProvider] Authentication state cleaned after sign-in failure');
      throw error;
    }
  };

  // Función de registro de nuevos usuarios
  const signUp = async (email: string, password: string, displayName?: string) => {
    console.log('📝 AuthProvider.signUp called for:', email);
    try {
      await cognitoSignUp(email, password, displayName);
      console.log('✅ AuthProvider.signUp successful');
    } catch (error) {
      console.error('❌ AuthProvider.signUp failed:', error);
      throw error;
    }
  };

  // Función de cierre de sesión con limpieza completa
  const signOut = async () => {
    console.log('🔐 AuthProvider.signOut called');
    try {
      await cognitoSignOut();
      setUser(null);
      
      // Limpieza completa del estado local
      localStorage.removeItem('cognia_auth_token');
      localStorage.removeItem('cognia_user_data');
      sessionStorage.clear();
      
      console.log('✅ AuthProvider.signOut successful');
      
      // Redirigir al login después de logout exitoso
      window.location.href = '/auth/login';
      
    } catch (error) {
      console.error('❌ AuthProvider.signOut failed:', error);
      // Aún así limpiar el estado local en caso de error
      setUser(null);
      localStorage.removeItem('cognia_auth_token');
      localStorage.removeItem('cognia_user_data');
      sessionStorage.clear();
      window.location.href = '/auth/login';
    }
  };

  // Log de cambios de estado para debugging
  useEffect(() => {
    console.log('🔧 AuthProvider state:', { hasUser: !!user, userEmail: user?.email, loading });
  }, [user, loading]);

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    handleTokenExpiration,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook personalizado para usar el contexto de autenticación
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 