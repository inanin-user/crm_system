// 移動端工具函數

/**
 * 檢查是否為移動設備
 */
export const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 768;
};

/**
 * 檢查是否為觸摸設備
 */
export const isTouchDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

/**
 * 獲取安全的觸摸目標大小（CSS類名）
 */
export const getTouchTargetSize = (): string => {
  return isMobileDevice() ? 'min-h-[44px] min-w-[44px]' : 'min-h-[32px] min-w-[32px]';
};

/**
 * 獲取響應式文字大小
 */
export const getResponsiveTextSize = (desktop: string, mobile: string): string => {
  return `${mobile} md:${desktop}`;
};

/**
 * 獲取響應式間距
 */
export const getResponsivePadding = (desktop: string, mobile: string): string => {
  return `${mobile} md:${desktop}`;
};

/**
 * 防止 iOS 縮放的輸入框樣式
 */
export const getIOSInputStyle = (): { fontSize: string } => {
  return { fontSize: '16px' };
};

/**
 * 移動端優化的按鈕類名
 */
export const getMobileButtonClass = (baseClass: string): string => {
  const mobileOptimizations = [
    'touch-manipulation', // 優化觸摸響應
    'select-none', // 防止文字選擇
    'active:scale-95', // 觸摸反饋
    'transition-transform',
    'duration-100'
  ];

  return isMobileDevice() 
    ? `${baseClass} ${mobileOptimizations.join(' ')}` 
    : baseClass;
};

/**
 * 移動端優化的表單輸入框類名
 */
export const getMobileInputClass = (baseClass: string): string => {
  const mobileOptimizations = [
    'text-base', // 防止 iOS 縮放
    'leading-normal'
  ];

  return isMobileDevice() 
    ? `${baseClass} ${mobileOptimizations.join(' ')}` 
    : baseClass;
};

/**
 * 調整視口以處理移動端鍵盤彈出
 */
export const handleMobileViewport = (): void => {
  if (typeof window === 'undefined' || !isMobileDevice()) return;

  const viewport = document.querySelector('meta[name="viewport"]');
  if (viewport) {
    const handleFocus = () => {
      viewport.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1');
    };

    const handleBlur = () => {
      viewport.setAttribute('content', 'width=device-width, initial-scale=1');
    };

    // 監聽輸入框焦點事件
    document.addEventListener('focusin', handleFocus);
    document.addEventListener('focusout', handleBlur);

    // 清理函數
    return () => {
      document.removeEventListener('focusin', handleFocus);
      document.removeEventListener('focusout', handleBlur);
    };
  }
};

/**
 * 移動端滾動到頂部
 */
export const scrollToTop = (smooth: boolean = true): void => {
  if (typeof window === 'undefined') return;

  window.scrollTo({
    top: 0,
    left: 0,
    behavior: smooth ? 'smooth' : 'auto'
  });
};

/**
 * 檢查元素是否在視窗內
 */
export const isElementInViewport = (element: HTMLElement): boolean => {
  if (!element || typeof window === 'undefined') return false;

  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= window.innerHeight &&
    rect.right <= window.innerWidth
  );
};

/**
 * 移動端優化的事件處理
 */
export const addMobileEventListeners = (
  element: HTMLElement,
  onClick: () => void
): (() => void) => {
  if (!element || typeof window === 'undefined') {
    return () => {};
  }

  const handleClick = (event: Event) => {
    event.preventDefault();
    onClick();
  };

  const handleTouchStart = (event: TouchEvent) => {
    // 添加觸摸開始的視覺反饋
    element.style.transform = 'scale(0.95)';
    element.style.transition = 'transform 0.1s ease';
  };

  const handleTouchEnd = () => {
    // 恢復原始大小
    element.style.transform = 'scale(1)';
  };

  if (isTouchDevice()) {
    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });
    element.addEventListener('touchcancel', handleTouchEnd, { passive: true });
  }

  element.addEventListener('click', handleClick);

  // 返回清理函數
  return () => {
    element.removeEventListener('click', handleClick);
    if (isTouchDevice()) {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('touchcancel', handleTouchEnd);
    }
  };
};

/**
 * 獲取移動端安全區域內邊距
 */
export const getSafeAreaPadding = (): string => {
  if (!isMobileDevice()) return '';
  
  // iOS 安全區域支持
  return 'pb-safe pt-safe pl-safe pr-safe';
};

/**
 * 移動端專用的模態框樣式
 */
export const getMobileModalClass = (): string => {
  if (!isMobileDevice()) return '';
  
  return 'rounded-t-lg rounded-b-none fixed bottom-0 left-0 right-0 max-h-[90vh] overflow-auto';
};