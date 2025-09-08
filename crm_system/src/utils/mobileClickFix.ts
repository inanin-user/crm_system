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

  console.log('初始化移動端點擊修復...');

  // 修復所有現有按鈕
  const fixExistingButtons = () => {
    const buttons = document.querySelectorAll('button, a, [role="button"], [onclick]');
    
    buttons.forEach((element) => {
      const htmlElement = element as HTMLElement;
      
      // 確保元素可以接收點擊事件
      if (htmlElement.style.pointerEvents !== 'auto') {
        htmlElement.style.pointerEvents = 'auto';
      }
      
      // 添加觸摸事件處理
      if (!htmlElement.dataset.mobileFixed) {
        htmlElement.dataset.mobileFixed = 'true';
        
        // 處理觸摸開始
        htmlElement.addEventListener('touchstart', (e) => {
          htmlElement.style.opacity = '0.8';
        }, { passive: true });
        
        // 處理觸摸結束
        htmlElement.addEventListener('touchend', (e) => {
          htmlElement.style.opacity = '1';
          
          // 如果是按鈕，觸發點擊
          if (htmlElement.tagName === 'BUTTON' || htmlElement.getAttribute('role') === 'button') {
            e.preventDefault();
            setTimeout(() => {
              htmlElement.click();
            }, 10);
          }
        }, { passive: false });
        
        // 處理觸摸取消
        htmlElement.addEventListener('touchcancel', () => {
          htmlElement.style.opacity = '1';
        }, { passive: true });
      }
    });
  };

  // 立即修復現有按鈕
  fixExistingButtons();

  // 監聽 DOM 變化，修復新添加的按鈕
  const observer = new MutationObserver((mutations) => {
    let shouldFix = false;
    
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) { // Element node
            const element = node as HTMLElement;
            if (element.tagName === 'BUTTON' || 
                element.tagName === 'A' || 
                element.getAttribute('role') === 'button' ||
                element.hasAttribute('onclick')) {
              shouldFix = true;
            }
            
            // 檢查子元素
            const childButtons = element.querySelectorAll('button, a, [role="button"], [onclick]');
            if (childButtons.length > 0) {
              shouldFix = true;
            }
          }
        });
      }
    });
    
    if (shouldFix) {
      setTimeout(fixExistingButtons, 100);
    }
  });

  // 開始觀察 DOM 變化
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  // 添加全局觸摸事件委託
  document.addEventListener('touchend', (e) => {
    const target = e.target as HTMLElement;
    
    if (target && (
      target.tagName === 'BUTTON' || 
      target.getAttribute('role') === 'button' ||
      target.closest('button') ||
      target.closest('[role="button"]')
    )) {
      // 強制觸發點擊事件
      const clickableElement = target.tagName === 'BUTTON' ? target : target.closest('button') || target.closest('[role="button"]');
      
      if (clickableElement && !e.defaultPrevented) {
        e.preventDefault();
        setTimeout(() => {
          (clickableElement as HTMLElement).click();
        }, 10);
      }
    }
  }, { passive: false });

  // 監聽頁面路由變化
  let currentUrl = window.location.href;
  const checkForRouteChange = () => {
    if (currentUrl !== window.location.href) {
      currentUrl = window.location.href;
      setTimeout(fixExistingButtons, 500); // 延遲一點讓新頁面完全加載
    }
  };
  
  setInterval(checkForRouteChange, 1000);

  // 監聽 popstate 事件（瀏覽器後退/前進）
  window.addEventListener('popstate', () => {
    setTimeout(fixExistingButtons, 100);
  });

  isInitialized = true;
  console.log('移動端點擊修復初始化完成');
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