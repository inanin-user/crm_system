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

  // 強制修復點擊事件（移除危險的元素替換）
  const forceEnableClicks = () => {
    // 確保所有按鈕可點擊
    const elements = document.querySelectorAll('button, a, [role="button"], input[type="button"], input[type="submit"]');

    elements.forEach((el) => {
      const element = el as HTMLElement;

      // 只設置安全的樣式，不破壞React事件綁定
      element.style.pointerEvents = 'auto';
      element.style.touchAction = 'manipulation';
      element.style.setProperty('-webkit-tap-highlight-color', 'rgba(0,0,0,0.1)');
      element.style.cursor = 'pointer';
      element.style.userSelect = 'none';
      element.style.setProperty('-webkit-user-select', 'none');

      // 添加標記，避免重複處理
      if (!element.dataset.mobileOptimized) {
        element.dataset.mobileOptimized = 'true';

        // 添加觸摸事件優化（不替換元素）
        element.addEventListener('touchstart', (e) => {
          element.style.opacity = '0.8';
        }, { passive: true });

        element.addEventListener('touchend', (e) => {
          element.style.opacity = '';
        }, { passive: true });
      }
    });

    console.log(`優化了 ${elements.length} 個可點擊元素`);
  };

  // 立即修復現有按鈕
  forceEnableClicks();

  // 減少頻繁檢查，改為只在需要時執行
  let intervalId: NodeJS.Timeout | null = null;

  // 延遲啟動定期檢查，且頻率降低
  setTimeout(() => {
    intervalId = setInterval(() => {
      forceEnableClicks();
    }, 5000); // 每5秒檢查一次，減少性能影響
  }, 1000);

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
    if (intervalId) clearInterval(intervalId);
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