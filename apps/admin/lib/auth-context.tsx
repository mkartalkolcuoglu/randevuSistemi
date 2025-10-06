"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  tenantId: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  login: async () => false,
  logout: () => {},
  isAuthenticated: false,
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Public pages that don't require authentication
  const publicPages = ['/login', '/forgot-password'];
  const isPublicPage = publicPages.includes(pathname);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        const savedUser = localStorage.getItem('adminUser');

        if (token && savedUser) {
          // For demo purposes, just use the saved user without API verification
          // In production, you would verify the token with your API
          setUser(JSON.parse(savedUser));
        } else if (!isPublicPage) {
          router.push('/login');
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (!isPublicPage) {
          router.push('/login');
        }
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, [router, isPublicPage]);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // For demo purposes, we'll use mock authentication
      // In production, this would call your actual API
      if (email === 'admin@demo.com' && password === 'admin123') {
        const mockUser: User = {
          id: '1',
          email: 'admin@demo.com',
          firstName: 'Admin',
          lastName: 'User',
          role: 'ADMIN',
          tenantId: 'demo-tenant-1'
        };

        const mockToken = 'demo-jwt-token-' + Date.now();

        localStorage.setItem('adminToken', mockToken);
        localStorage.setItem('adminUser', JSON.stringify(mockUser));
        setUser(mockUser);

        return true;
      } else {
        throw new Error('Geçersiz giriş bilgileri');
      }
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    localStorage.removeItem('rememberAdmin');
    setUser(null);
    router.push('/login');
  };

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    logout,
    isAuthenticated: !!user,
  };

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated and trying to access protected page
  if (!user && !isPublicPage) {
    return null; // useEffect will handle the redirect
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
