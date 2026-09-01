'use client';

import { usePathname } from 'next/navigation';
import React from 'react';
import { useSidebar } from '@/contexts/SidebarContext';

interface ConditionalMainProps {
  children: React.ReactNode;
}

export default function ConditionalMain({ children }: ConditionalMainProps) {
  const pathname = usePathname();
  const { isCollapsed, isMobile, disableGPULayer } = useSidebar();
  
  // 需要全屏布局的页面（不需要容器约束）
  const fullScreenPages = [
    '/login',
    '/unauthorized'
  ];
  
  // 檢查当前页面是否需要全屏布局
  const isFullScreenPage = fullScreenPages.some(page => 
    pathname === page || pathname.startsWith(page + '/')
  );

  const gpuStyle = disableGPULayer
    ? undefined
    : { transform: 'translateZ(0)', willChange: 'scroll-position' as const };
  
  if (isFullScreenPage) {
    return <main style={gpuStyle}>{children}</main>;
  }
  
  // 计算左边距
  const getLeftMargin = () => {
    if (isMobile) {
      return 'ml-0'; // 移动端不需要边距
    }
    return isCollapsed ? 'ml-16' : 'ml-56';
  };
  
  // 普通页面：使用容器约束并添加侧边栏边距
  return (
    <main className={`transition-all duration-300 ${getLeftMargin()}`} style={gpuStyle}>
      <div className={`container mx-auto px-4 py-6 ${isMobile ? 'pt-24' : ''}`}>
        {children}
      </div>
    </main>
  );
} 