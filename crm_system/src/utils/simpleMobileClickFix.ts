'use client'

/**
 * 简单安全的移动端点击修复
 * 避免破坏React事件绑定
 */

let isInitialized = false;

export function initializeSimpleMobileClickFix() {
  if (typeof window === 'undefined' || isInitialized) return;

  const isMobile = window.innerWidth <= 768;
  if (!isMobile) return;

  console.log('初始化简单移动端点击修复...');

  // 只通过CSS确保元素可点击，不修改DOM
  const addMobileStyles = () => {
    const existingStyle = document.getElementById('mobile-click-fix');
    if (existingStyle) return;

    const style = document.createElement('style');
    style.id = 'mobile-click-fix';
    style.textContent = `
      @media (max-width: 768px) {
        button, a, [role="button"], input[type="button"], input[type="submit"] {
          pointer-events: auto !important;
          touch-action: manipulation !important;
          -webkit-tap-highlight-color: rgba(0,0,0,0.1) !important;
          cursor: pointer !important;
          user-select: none !important;
          -webkit-user-select: none !important;
        }

        button:active, a:active, [role="button"]:active {
          opacity: 0.8;
          transform: scale(0.98);
          transition: opacity 0.1s ease, transform 0.1s ease;
        }
      }
    `;

    document.head.appendChild(style);
    console.log('移动端点击样式已应用');
  };

  // 添加样式
  addMobileStyles();

  // 监听路由变化时重新应用（如果需要）
  window.addEventListener('popstate', addMobileStyles);

  isInitialized = true;
  console.log('简单移动端点击修复初始化完成');
}

// 手动修复特定元素（更安全的版本）
export function fixElementClickSafe(element: HTMLElement) {
  if (typeof window === 'undefined') return;

  const isMobile = window.innerWidth <= 768;
  if (!isMobile) return;

  // 只设置样式，不添加事件监听器
  element.style.pointerEvents = 'auto';
  element.style.touchAction = 'manipulation';
  element.style.setProperty('-webkit-tap-highlight-color', 'rgba(0,0,0,0.1)');
  element.style.cursor = 'pointer';
}