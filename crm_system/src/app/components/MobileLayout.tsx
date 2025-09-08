'use client'

import { ReactNode } from 'react';
import { useMobileDetection } from '@/hooks/useMobileDetection';

interface MobileLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  showBackButton?: boolean;
  onBack?: () => void;
  className?: string;
}

export default function MobileLayout({ 
  children, 
  title, 
  subtitle, 
  showBackButton = false, 
  onBack,
  className = ''
}: MobileLayoutProps) {
  const { isMobile } = useMobileDetection();

  if (!isMobile) {
    // 桌面端直接返回 children，不做任何修改
    return <>{children}</>;
  }

  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      {/* 移動端專用頭部 */}
      {(title || showBackButton) && (
        <div className="bg-white shadow-sm sticky top-0 z-10">
          <div className="flex items-center px-4 py-3">
            {showBackButton && (
              <button
                onClick={onBack}
                className="p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
            )}
            
            {title && (
              <div className="flex-1 ml-2">
                <h1 className="text-lg font-semibold text-gray-900 truncate">
                  {title}
                </h1>
                {subtitle && (
                  <p className="text-sm text-gray-600 truncate">
                    {subtitle}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* 主要內容區域 */}
      <div className="px-4 py-4">
        {children}
      </div>
    </div>
  );
}