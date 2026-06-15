'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi, AuthResponse, UserProfile } from './api';

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, username: string) => Promise<void>;
  /** Establishes a session from a JWT (Google OAuth callback) and loads the full profile. */
  loginWithToken: (token: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for stored token on mount
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('user');

    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Failed to parse stored user:', error);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
      }
    }
    setIsLoading(false);
  }, []);

  const handleAuthResponse = (response: AuthResponse) => {
    localStorage.setItem('auth_token', response.token);
    localStorage.setItem('user', JSON.stringify(response.user));
    setUser(response.user);
  };

  const login = async (email: string, password: string) => {
    const response = await authApi.login(email, password);
    handleAuthResponse(response);
  };

  const signup = async (email: string, password: string, username: string) => {
    const response = await authApi.signup(email, password, username);
    handleAuthResponse(response);
  };

  /**
   * Establishes a session from a JWT (e.g. the Google OAuth callback). Stores
   * the token, then fetches the full profile (which includes displayName and
   * profilePicture) so the UI can greet the user and show their avatar.
   */
  const loginWithToken = async (token: string) => {
    localStorage.setItem('auth_token', token);
    const profile = await authApi.getProfile();
    localStorage.setItem('user', JSON.stringify(profile));
    setUser(profile);
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        signup,
        loginWithToken,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
