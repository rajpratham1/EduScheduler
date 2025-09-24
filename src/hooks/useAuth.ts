import { useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../config/firebase';

export interface AuthState {
  user: User | null;
  profile: any | null;
  loading: boolean;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    profile: null,
    loading: true
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const profile = await authService.getCurrentUserProfile();
        setAuthState({
          user,
          profile,
          loading: false
        });
      } else {
        setAuthState({
          user: null,
          profile: null,
          loading: false
        });
      }
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string, role: 'admin' | 'faculty', secretCode?: string) => {
    try {
      const result = role === 'admin' 
        ? await authService.loginAdmin(email, password)
        : await authService.loginFaculty(email, password, secretCode!);

      if (result.success && result.user && result.profile) {
        setAuthState({
          user: result.user,
          profile: result.profile,
          loading: false
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      setAuthState({
        user: null,
        profile: null,
        loading: false
      });
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  return {
    ...authState,
    login,
    logout
  };
};