'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface User {
  id: string;
  username: string;
  role: 'admin' | 'user';
  lastLogin?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (userData: User) => void;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 需要保护的路由列表
const PROTECTED_ROUTES = [
  '/',
  '/attendance',
  '/admin',
];

// 公开路由列表
const PUBLIC_ROUTES = [
  '/login',
];

// 检查路径是否需要认证
function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some(route => {
    if (route === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(route);
  });
}

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route => pathname.startsWith(route));
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // 检查认证状态
  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setUser(data.user);
          return;
        }
      }
      setUser(null);
    } catch (error) {
      console.error('认证检查失败:', error);
      setUser(null);
    }
  };

  // 登录
  const login = (userData: User) => {
    setUser(userData);
  };

  // 注销
  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('注销失败:', error);
    } finally {
      setUser(null);
      router.push('/login');
    }
  };

  // 初始化认证检查
  useEffect(() => {
    const initAuth = async () => {
      await checkAuth();
      setIsLoading(false);
    };
    
    initAuth();
  }, []);

  // 路由保护逻辑
  useEffect(() => {
    if (isLoading) return; // 等待认证检查完成

    const isProtected = isProtectedRoute(pathname);
    const isPublic = isPublicRoute(pathname);

    if (isProtected && !user) {
      // 需要认证但用户未登录，重定向到登录页
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
    } else if (pathname === '/login' && user) {
      // 已登录用户访问登录页，重定向到主页
      router.push('/');
    }
  }, [user, pathname, isLoading, router]);

  const contextValue: AuthContextType = {
    user,
    isLoading,
    login,
    logout,
    checkAuth,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// 自定义 Hook
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 