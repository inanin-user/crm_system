'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface SidebarContextType {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  toggleCollapse: () => void;
  isMobile: boolean;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // 检测屏幕尺寸
  useEffect(() => {
    let previousMobileState: boolean | null = null;
    let isInitialCheck = true;

    const checkMobile = () => {
      const mobile = window.innerWidth < 768;

      // 初始檢查：如果是移動端，默認關閉菜單
      if (isInitialCheck && mobile) {
        setIsCollapsed(true);
        isInitialCheck = false;
      }
      // 只在真正從桌面端切換到移動端時才自動關閉菜單
      // 如果已經是移動端，不要重複關閉（這會干擾用戶操作）
      else if (!isInitialCheck && mobile && previousMobileState === false) {
        // 從桌面切換到移動端，自動關閉菜單
        setIsCollapsed(true);
      }
      // 從移動端切換到桌面端，保持菜單狀態不變

      setIsMobile(mobile);
      previousMobileState = mobile;

      if (isInitialCheck) {
        isInitialCheck = false;
      }
    };

    // 初始检查
    checkMobile();

    // 使用防抖來避免頻繁的 resize 事件（特別是移動端滾動時的地址欄變化）
    let resizeTimer: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        checkMobile();
      }, 150); // 150ms 防抖延遲
    };

    // 监听窗口大小变化
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimer);
    };
  }, []);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <SidebarContext.Provider value={{
      isCollapsed,
      setIsCollapsed,
      toggleCollapse,
      isMobile
    }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
} 