import React, { createContext, useContext, useState, useEffect } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { authService, AdminProfile, FacultyProfile } from '../services/authService';
import { auth } from '../config/firebase';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'faculty';
  profile: AdminProfile | FacultyProfile;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, type: 'admin' | 'faculty', secretCode?: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Subscribe to auth state changes
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        try {
          // Get the user's profile
          const userProfile = await authService.getCurrentUserProfile();
          if (userProfile) {
            setUser({
              id: firebaseUser.uid,
              email: firebaseUser.email!,
              name: userProfile.name,
              role: userProfile.role,
              profile: userProfile
            });
          }
        } catch (error) {
          console.error('Error loading user profile:', error);
          await authService.logout();
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string, type: 'admin' | 'faculty', secretCode?: string): Promise<boolean> => {
    setLoading(true);
    try {
      if (type === 'admin') {
        const result = await authService.loginAdmin(email, password);
        if (result.success && result.user && result.profile) {
          setUser({
            id: result.user.uid,
            email: result.user.email!,
            name: result.profile.name,
            role: 'admin',
            profile: result.profile
          });
          return true;
        }
          console.error('Admin login failed:', result.message);
      } else if (type === 'faculty' && secretCode) {
        const result = await authService.loginFaculty(email, password, secretCode);
        if (result.success && result.user && result.profile) {
          setUser({
            id: result.user.uid,
            email: result.user.email!,
            name: result.profile.name,
            role: 'faculty',
            profile: result.profile
          });
          return true;
        }
          console.error('Faculty login failed:', result.message);
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};