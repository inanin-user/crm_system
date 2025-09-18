'use client'

/**
 * 移動端點擊修復工具
 * 解決移動端按鈕點擊無響應的問題
 */

let isInitialized = false;

export function initializeMobileClickFix() {
  if (typeof window === 'undefined' || isInitialized) return;
  
  const isMobile = window.innerWidth <= 768;
  if (!isMobile) return;

  console.log('初始化移動端點擊修復（簡化版）...');

  // 強制修復點擊事件
  const forceEnableClicks = () => {
    // 移除所有可能阻擋的事件監聽器
    document.removeEventListener('touchstart', () => {});
    document.removeEventListener('touchend', () => {});
    
    // 確保所有按鈕可點擊
    const elements = document.querySelectorAll('button, a, [role="button"], input[type="button"], input[type="submit"]');
    
    elements.forEach((el) => {
      const element = el as HTMLElement;
      
      // 直接設置樣式
      element.style.pointerEvents = 'auto';
      element.style.touchAction = 'manipulation';
      element.style.setProperty('-webkit-tap-highlight-color', 'rgba(0,0,0,0.1)');
      element.style.cursor = 'pointer';
      element.style.userSelect = 'none';
      element.style.setProperty('-webkit-user-select', 'none');
      
      // 移除舊的事件監聽器
      const newElement = element.cloneNode(true) as HTMLElement;
      element.parentNode?.replaceChild(newElement, element);
    });
    
    console.log(`修復了 ${elements.length} 個可點擊元素`);
  };

  // 立即修復現有按鈕
  forceEnableClicks();

  // 定期重新修復（簡單但有效）
  const intervalId = setInterval(() => {
    forceEnableClicks();
  }, 2000); // 每2秒重新檢查一次

  // 頁面可見性變化時重新修復
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      setTimeout(forceEnableClicks, 100);
    }
  });

  // 監聽 DOM 變化（簡化版）
  const observer = new MutationObserver(() => {
    setTimeout(forceEnableClicks, 200);
  });

  // 開始觀察 DOM 變化
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  // 路由變化監聽
  window.addEventListener('popstate', () => {
    setTimeout(forceEnableClicks, 100);
  });

  // 清理函數（當需要時）
  const cleanup = () => {
    clearInterval(intervalId);
    observer.disconnect();
  };

  // 暴露清理函數到全局（調試用）
  (window as Window & { mobileClickCleanup?: () => void }).mobileClickCleanup = cleanup;

  isInitialized = true;
  console.log('移動端點擊修復初始化完成（簡化版）');
}

// 手動修復特定元素
export function fixElementClick(element: HTMLElement) {
  if (typeof window === 'undefined') return;
  
  const isMobile = window.innerWidth <= 768;
  if (!isMobile) return;

  element.style.pointerEvents = 'auto';
  element.style.touchAction = 'manipulation';
  
  if (!element.dataset.mobileFixed) {
    element.dataset.mobileFixed = 'true';
    
    element.addEventListener('touchend', (e) => {
      e.preventDefault();
      setTimeout(() => {
        element.click();
      }, 10);
    }, { passive: false });
  }
}