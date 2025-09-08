'use client'

import { useEffect } from 'react';

/**
 * 直接修復移動端點擊問題的 Hook
 * 在每個頁面組件中使用
 */
export function useDirectClickFix() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // 檢測設備類型
    const userAgent = navigator.userAgent.toLowerCase();
    const isIPhone = /iphone/.test(userAgent);
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const pixelRatio = window.devicePixelRatio || 1;
    
    console.log('設備信息:', {
      userAgent: userAgent,
      isIPhone: isIPhone,
      isIOS: isIOS,
      screenWidth: screenWidth,
      screenHeight: screenHeight,
      pixelRatio: pixelRatio,
      viewport: `${window.innerWidth}x${window.innerHeight}`
    });
    
    // 只在移動端執行，但對 iPhone 使用特殊處理
    const isMobile = screenWidth <= 768 || isIOS;
    if (!isMobile) return;

    // iPhone 小屏幕特殊處理
    const isSmallIPhone = isIPhone && (screenWidth <= 414 || screenHeight <= 736);
    console.log('iPhone 屏幕檢測:', { isSmallIPhone, screenWidth, screenHeight });

    console.log('頁面級點擊修復啟動... (iPhone優化版)');

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
        let el = element as HTMLElement;
        
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
        
        // iPhone 特定樣式優化
        if (isIPhone) {
          el.style.setProperty('min-height', '48px', 'important');
          el.style.setProperty('min-width', '48px', 'important');
          el.style.setProperty('-webkit-touch-callout', 'none', 'important');
          el.style.setProperty('-webkit-text-size-adjust', '100%', 'important');
          el.style.setProperty('transform', 'translateZ(0)', 'important'); // 硬件加速
          
          // 小屏 iPhone 額外處理
          if (isSmallIPhone) {
            el.style.setProperty('font-size', '16px', 'important'); // 防止縮放
            el.style.setProperty('padding', '12px', 'important');
          }
        }
        
        // 添加點擊測試標記
        el.setAttribute('data-click-fixed', 'true');
        
        // iPhone 特殊處理：完全移除並重新創建元素（避免事件監聽器衝突）
        if (isIPhone) {
          const parent = el.parentNode;
          const newElement = el.cloneNode(true) as HTMLElement;
          
          // 保存原始處理函數
          const originalOnClick = el.onclick;
          const originalHandlers: any = {};
          
          // 複製所有事件處理器
          ['click', 'touchstart', 'touchend', 'mousedown', 'mouseup'].forEach(eventType => {
            const listeners = (el as any)._listeners?.[eventType] || [];
            originalHandlers[eventType] = listeners;
          });
          
          if (parent) {
            parent.replaceChild(newElement, el);
            
            // 重新綁定 onClick
            if (originalOnClick) {
              newElement.onclick = originalOnClick;
            }
            
            // 為新元素添加 iPhone 優化的觸摸處理
            newElement.addEventListener('touchstart', (e) => {
              newElement.style.opacity = '0.8';
            }, { passive: true });
            
            newElement.addEventListener('touchend', (e) => {
              e.preventDefault();
              e.stopPropagation();
              
              newElement.style.opacity = '1';
              
              // iPhone 專用：直接調用 onclick 而不是派發事件
              if (newElement.onclick) {
                setTimeout(() => {
                  newElement.onclick!(e as any);
                }, 10);
              } else {
                // 如果沒有 onclick，嘗試派發點擊事件
                const syntheticClick = new Event('click', { bubbles: true });
                setTimeout(() => {
                  newElement.dispatchEvent(syntheticClick);
                }, 10);
              }
            }, { passive: false });
            
            el = newElement;
          }
        } else {
          // 非 iPhone 設備的原有處理邏輯
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
        }
        
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