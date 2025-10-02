'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import AuthLoadingScreen from '@/app/components/AuthLoadingScreen';

interface User {
  id: string;
  username: string;
  role: 'admin' | 'user' | 'trainer' | 'member' | 'regular-member' | 'premium-member';
  locations?: string[];
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
  '/account_management',
  '/admin',
  '/financial_management',
];

// PUBLIC_ROUTES removed as it's not used

// 检查路径是否需要认证
function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some(route => {
    if (route === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(route);
  });
}

// isPublicRoute function removed as it's not used

// 检查用户是否有权限访问特定路径
function hasRouteAccess(pathname: string, userRole: string): boolean {
  // 管理员可以访问所有页面
  if (userRole === 'admin') {
    return true;
  }
  
  // 教练只能访问首页和出席管理
  if (userRole === 'trainer') {
    if (pathname === '/' || pathname.startsWith('/attendance')) {
      return true;
    }
    // 不能访问账号管理
    if (pathname.startsWith('/account_management')) {
      return false;
    }
    return true; // 其他页面暂时允许访问
  }
  
  // 普通用户和会员暂时按原来的逻辑
  if (userRole === 'user' || userRole === 'member') {
    return true; // 暂时允许访问所有页面
  }
  
  return false;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // 自動登出時間設定（毫秒）- 30分鐘不活動後自動登出
  const AUTO_LOGOUT_TIME = 30 * 60 * 1000; // 30分鐘
  
  // 檢查會話是否仍然有效的間隔（毫秒）
  const SESSION_CHECK_INTERVAL = 60 * 1000; // 1分鐘檢查一次

  // 檢查會話是否有效（基於 sessionStorage 和時間）
  const isSessionValid = useCallback((): boolean => {
    const sessionData = sessionStorage.getItem('auth_session');
    if (!sessionData) {
      return false;
    }
    
    try {
      const { timestamp, userId } = JSON.parse(sessionData);
      const now = Date.now();
      
      // 檢查會話是否過期（超過自動登出時間）
      if (now - timestamp > AUTO_LOGOUT_TIME) {
        console.log('會話已過期，需要重新登錄');
        sessionStorage.removeItem('auth_session');
        return false;
      }
      
      return Boolean(userId);
    } catch {
      sessionStorage.removeItem('auth_session');
      return false;
    }
  }, [AUTO_LOGOUT_TIME]);

  // 更新用戶活動時間
  const updateActivity = () => {
    const now = Date.now();
    
    // 更新 sessionStorage 中的時間戳
    const sessionData = sessionStorage.getItem('auth_session');
    if (sessionData) {
      try {
        const data = JSON.parse(sessionData);
        data.timestamp = now;
        sessionStorage.setItem('auth_session', JSON.stringify(data));
      } catch {
        // 如果 sessionStorage 有問題，清除它
        sessionStorage.removeItem('auth_session');
      }
    }
  };

  // 检查认证状态（修改為僅在有有效會話時檢查服務器）
  const checkAuth = useCallback(async (forceCheck = false) => {
    try {
      // 首先檢查本地會話是否有效
      if (!forceCheck && !isSessionValid()) {
        console.log('本地會話無效，跳過服務器檢查');
        setUser(null);
        return;
      }

      // 只有在有有效本地會話或強制檢查時才向服務器請求
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
          if (data.user.id && data.user.username && data.user.role) {
            setUser(data.user);
            
            // 創建或更新 sessionStorage
            sessionStorage.setItem('auth_session', JSON.stringify({
              userId: data.user.id,
              timestamp: Date.now()
            }));
            
            console.log('用戶已認證:', data.user.username, data.user.role);
            return;
          }
        }
      }
      
      // 認證失敗，清理狀態
      console.log('服務器認證檢查失敗');
      setUser(null);
      sessionStorage.removeItem('auth_session');
      
    } catch (error) {
      console.log('認證檢查出錯:', error);
      setUser(null);
      sessionStorage.removeItem('auth_session');
    }
  }, [isSessionValid]);

  // 登录
  const login = (userData: User) => {
    setUser(userData);
    const now = Date.now();
    
    // 創建會話記錄
    sessionStorage.setItem('auth_session', JSON.stringify({
      userId: userData.id,
      timestamp: now
    }));
    
    console.log('用戶登錄成功，創建新會話');
  };

  // 注销（手動或自動）
  const logout = useCallback(async (isAutoLogout = false) => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // 忽略登出 API 錯誤
    } finally {
      setUser(null);
      sessionStorage.removeItem('auth_session');
      
      if (isAutoLogout) {
        console.log('自動登出：會話已過期');
        router.push('/login?message=session_expired');
      } else {
        console.log('手動登出');
        router.push('/login');
      }
    }
  }, [router]);

  // 初始化认证检查
  useEffect(() => {
    const initAuth = async () => {
      try {
        // 檢查本地會話，如果有效才檢查服務器
        if (isSessionValid()) {
          console.log('發現本地會話，檢查服務器認證狀態');
          await checkAuth();
        } else {
          console.log('啟動時無有效會話，跳過認證檢查');
          setUser(null);
          // 如果沒有會話且當前在受保護路由，立即重定向
          const currentIsProtected = isProtectedRoute(pathname);
          if (currentIsProtected && pathname !== '/login') {
            console.log('當前為受保護路由，立即重定向到登錄頁面');
          }
        }
      } catch (error) {
        console.error('初始化認證檢查失敗:', error);
        setUser(null);
      } finally {
        // 確保加載狀態在認證檢查完成後結束
        setTimeout(() => setIsLoading(false), 100);
      }
    };
    
    initAuth();
  }, [checkAuth, isSessionValid, pathname]);

  // 用戶活動監聽器
  useEffect(() => {
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const handleActivity = () => {
      if (user) {
        updateActivity();
      }
    };
    
    // 添加事件監聽器
    activityEvents.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });
    
    // 清理函數
    return () => {
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
    };
  }, [user]);

  // 定期檢查會話是否過期
  useEffect(() => {
    if (!user) return;
    
    const checkSessionExpiry = () => {
      if (user && !isSessionValid()) {
        console.log('會話檢查：會話已過期，執行自動登出');
        logout(true);
      }
    };
    
    // 設置定期檢查
    const interval = setInterval(checkSessionExpiry, SESSION_CHECK_INTERVAL);
    
    return () => clearInterval(interval);
  }, [user, isSessionValid, logout, SESSION_CHECK_INTERVAL]);

  // 路由保护逻辑
  useEffect(() => {
    if (isLoading) return; // 等待认证检查完成

    const isProtected = isProtectedRoute(pathname);

    if (isProtected && !user) {
      // 需要认证但用户未登录，立即重定向到登录页
      console.log('用戶未登錄，重定向到登錄頁面');
      setIsRedirecting(true);
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    } 
    
    if (pathname === '/login' && user) {
      // 已登录用户访问登录页，重定向到主页
      console.log('用戶已登錄，重定向到首頁');
      setIsRedirecting(true);
      router.replace('/');
      return;
    } 
    
    if (user && isProtected && !hasRouteAccess(pathname, user.role)) {
      // 用户已登录但没有权限访问该页面，重定向到无权限页面
      console.warn(`用户 ${user.username} (${user.role}) 尝试访问无权限页面: ${pathname}`);
      setIsRedirecting(true);
      router.replace('/unauthorized');
      return;
    }

    // 如果沒有需要重定向，清除重定向狀態
    setIsRedirecting(false);
  }, [user, pathname, isLoading, router]);

  const contextValue: AuthContextType = {
    user,
    isLoading,
    login,
    logout,
    checkAuth,
  };

  // 如果正在加載，顯示加載頁面
  if (isLoading) {
    return (
      <AuthContext.Provider value={contextValue}>
        <AuthLoadingScreen message="正在驗證身份..." />
      </AuthContext.Provider>
    );
  }

  // 如果正在重定向，顯示加載狀態（避免內容閃爍）
  if (isRedirecting) {
    return (
      <AuthContext.Provider value={contextValue}>
        <AuthLoadingScreen message="正在重定向..." />
      </AuthContext.Provider>
    );
  }

  // 如果在受保護的路由但未登錄，也顯示加載狀態（避免閃爍）
  const isProtected = isProtectedRoute(pathname);
  if (isProtected && !user && pathname !== '/login') {
    return (
      <AuthContext.Provider value={contextValue}>
        <AuthLoadingScreen message="正在重定向到登錄頁面..." />
      </AuthContext.Provider>
    );
  }

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