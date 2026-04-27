'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: number;
  phone?: string;
  nickname: string;
  avatar?: string;
}

interface AdminUser {
  id: number;
  username: string;
  name?: string;
}

interface AuthContextType {
  user: User | null;
  admin: AdminUser | null;
  token: string | null;
  isAdmin: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, userData: User, isAdmin?: boolean) => void;
  adminLogin: (token: string, adminData: AdminUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 从localStorage读取用户信息
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    const storedAdmin = localStorage.getItem('admin');
    const storedAdminToken = localStorage.getItem('adminToken');

    if (storedAdminToken && storedAdmin) {
      // 管理员登录
      setToken(storedAdminToken);
      setAdmin(JSON.parse(storedAdmin));
    } else if (storedToken && storedUser) {
      // 普通用户登录
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }

    setIsLoading(false);
  }, []);

  const login = (newToken: string, userData: User, isAdmin = false) => {
    if (isAdmin) {
      localStorage.setItem('adminToken', newToken);
      localStorage.setItem('admin', JSON.stringify(userData));
      setAdmin(userData as any);
    } else {
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
    }
    setToken(newToken);
  };

  const adminLogin = (newToken: string, adminData: AdminUser) => {
    localStorage.setItem('adminToken', newToken);
    localStorage.setItem('admin', JSON.stringify(adminData));
    setToken(newToken);
    setAdmin(adminData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('adminToken');
    localStorage.removeItem('admin');
    setUser(null);
    setAdmin(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        admin,
        token,
        isAdmin: !!admin,
        isAuthenticated: !!user || !!admin,
        isLoading,
        login,
        adminLogin,
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
