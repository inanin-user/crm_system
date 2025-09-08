'use client'

import { useEffect } from 'react';
import { initializeMobileClickFix } from '@/utils/mobileClickFix';

export default function MobileClickInitializer() {
  useEffect(() => {
    // 延遲初始化以確保 DOM 已完全加載
    const timer = setTimeout(() => {
      initializeMobileClickFix();
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // 這個組件不渲染任何內容
  return null;
}