'use client'

import { useState, useEffect } from 'react';

interface MobileDetection {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isTouchDevice: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  screenWidth: number;
  screenHeight: number;
}

export function useMobileDetection(): MobileDetection {
  const [detection, setDetection] = useState<MobileDetection>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    isTouchDevice: false,
    isIOS: false,
    isAndroid: false,
    screenWidth: 1024,
    screenHeight: 768,
  });

  useEffect(() => {
    const checkDevice = () => {
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;
      const userAgent = navigator.userAgent.toLowerCase();

      // 基於屏幕寬度的判斷
      const isMobile = screenWidth < 768;
      const isTablet = screenWidth >= 768 && screenWidth < 1024;
      const isDesktop = screenWidth >= 1024;

      // 基於用戶代理的判斷
      const isIOS = /iphone|ipad|ipod/.test(userAgent);
      const isAndroid = /android/.test(userAgent);
      
      // 觸摸設備檢測
      const isTouchDevice = 'ontouchstart' in window || 
        navigator.maxTouchPoints > 0;

      setDetection({
        isMobile,
        isTablet,
        isDesktop,
        isTouchDevice,
        isIOS,
        isAndroid,
        screenWidth,
        screenHeight,
      });
    };

    // 初始檢測
    checkDevice();

    // 監聽窗口大小變化
    const handleResize = () => {
      checkDevice();
    };

    window.addEventListener('resize', handleResize);
    
    // 監聽方向變化（移動設備）
    const handleOrientationChange = () => {
      // 延遲一點確保屏幕尺寸已更新
      setTimeout(checkDevice, 100);
    };

    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  return detection;
}