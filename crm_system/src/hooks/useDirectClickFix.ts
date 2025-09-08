'use client'

import { useEffect } from 'react';

/**
 * 直接修復移動端點擊問題的 Hook
 * 在每個頁面組件中使用
 */
export function useDirectClickFix() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const isMobile = window.innerWidth <= 768;
    if (!isMobile) return;

    console.log('頁面級點擊修復啟動...');

    let attempts = 0;
    const maxAttempts = 10;

    const directFix = () => {
      attempts++;
      
      // 查找所有可點擊元素
      const clickableElements = document.querySelectorAll(`
        button,
        a,
        input[type="button"],
        input[type="submit"],
        [role="button"],
        [onclick],
        .cursor-pointer
      `);

      console.log(`第${attempts}次修復，找到 ${clickableElements.length} 個可點擊元素`);

      clickableElements.forEach((element) => {
        const el = element as HTMLElement;
        
        // 強制設置內聯樣式（優先級最高）
        el.style.setProperty('pointer-events', 'auto', 'important');
        el.style.setProperty('touch-action', 'manipulation', 'important');
        el.style.setProperty('-webkit-tap-highlight-color', 'rgba(0,0,0,0.1)', 'important');
        el.style.setProperty('cursor', 'pointer', 'important');
        el.style.setProperty('user-select', 'none', 'important');
        el.style.setProperty('-webkit-user-select', 'none', 'important');
        
        // 確保元素可見且可交互
        el.style.setProperty('opacity', '1', 'important');
        el.style.setProperty('visibility', 'visible', 'important');
        el.style.setProperty('display', el.style.display || 'block', 'important');
        
        // 添加點擊測試標記
        el.setAttribute('data-click-fixed', 'true');
        
        // 移除所有可能阻擋的事件監聽器並重新綁定
        if (el.onclick) {
          const originalHandler = el.onclick;
          el.onclick = null;
          el.addEventListener('click', originalHandler, { passive: false });
        }
        
        // 添加觸摸事件支持
        el.addEventListener('touchend', (e) => {
          e.preventDefault();
          e.stopPropagation();
          
          // 視覺反饋
          el.style.opacity = '0.7';
          setTimeout(() => {
            el.style.opacity = '1';
          }, 100);
          
          // 強制觸發點擊
          const clickEvent = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: window
          });
          
          setTimeout(() => {
            el.dispatchEvent(clickEvent);
          }, 50);
          
        }, { passive: false });
        
        console.log(`修復元素: ${el.tagName}${el.className ? '.' + el.className.split(' ')[0] : ''}`);
      });

      // 如果還沒有找到足夠的元素，繼續嘗試
      if (clickableElements.length === 0 && attempts < maxAttempts) {
        setTimeout(directFix, 500);
      }
    };

    // 立即執行修復
    directFix();
    
    // 定期重新檢查（以防新元素被添加）
    const intervalId = setInterval(directFix, 3000);

    // 頁面焦點變化時重新修復
    const handleFocus = () => {
      setTimeout(directFix, 100);
    };
    
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    // 清理函數
    return () => {
      clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, []); // 空依賴數組，只在組件掛載時運行一次
}