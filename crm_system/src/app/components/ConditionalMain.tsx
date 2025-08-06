'use client';

import { usePathname } from 'next/navigation';
import React from 'react';

interface ConditionalMainProps {
  children: React.ReactNode;
}

export default function ConditionalMain({ children }: ConditionalMainProps) {
  const pathname = usePathname();
  
  // 需要全屏布局的页面（不需要容器约束）
  const fullScreenPages = [
    '/login',
    '/unauthorized'
  ];
  
  // 检查当前页面是否需要全屏布局
  const isFullScreenPage = fullScreenPages.some(page => 
    pathname === page || pathname.startsWith(page + '/')
  );
  
  if (isFullScreenPage) {
    // 全屏页面：不添加容器约束
    return (
      <main 
        style={{
          transform: 'translateZ(0)',
          willChange: 'scroll-position'
        }}
      >
        {children}
      </main>
    );
  }
  
  // 普通页面：使用容器约束
  return (
    <main 
      className="container mx-auto px-4 py-6"
      style={{
        transform: 'translateZ(0)',
        willChange: 'scroll-position'
      }}
    >
      {children}
    </main>
  );
} 