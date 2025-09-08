'use client'

import { useEffect, useState } from 'react';

export default function DebugClickHelper() {
  const [isDebugMode, setIsDebugMode] = useState(false);
  const [clickEvents, setClickEvents] = useState<string[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // 只在移動端和開發環境啟用
    const isMobile = window.innerWidth <= 768;
    const isDev = process.env.NODE_ENV === 'development';
    
    if (!isMobile || !isDev) return;

    // 監聽所有點擊事件
    const handleClick = (e: Event) => {
      const target = e.target as HTMLElement;
      const timestamp = new Date().toLocaleTimeString();
      const info = `${timestamp}: 點擊 ${target.tagName}${target.className ? '.' + target.className.split(' ')[0] : ''}`;
      
      setClickEvents(prev => [...prev.slice(-4), info]); // 只保留最近5條記錄
      
      console.log('移動端點擊事件:', {
        target: target,
        tagName: target.tagName,
        className: target.className,
        id: target.id,
        onclick: target.onclick,
        eventPropagation: !e.defaultPrevented
      });
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      const timestamp = new Date().toLocaleTimeString();
      const info = `${timestamp}: 觸摸結束 ${target.tagName}`;
      
      console.log('觸摸結束事件:', {
        target: target,
        tagName: target.tagName,
        defaultPrevented: e.defaultPrevented,
        touches: e.touches.length
      });
    };

    document.addEventListener('click', handleClick, true);
    document.addEventListener('touchend', handleTouchEnd, true);

    // 雙擊啟用/關閉調試模式
    let clickCount = 0;
    const handleDoubleClick = () => {
      clickCount++;
      if (clickCount >= 2) {
        setIsDebugMode(prev => !prev);
        clickCount = 0;
      }
      setTimeout(() => { clickCount = 0; }, 500);
    };

    document.addEventListener('dblclick', handleDoubleClick);

    return () => {
      document.removeEventListener('click', handleClick, true);
      document.removeEventListener('touchend', handleTouchEnd, true);
      document.removeEventListener('dblclick', handleDoubleClick);
    };
  }, []);

  if (!isDebugMode) return null;

  return (
    <div 
      className="fixed top-4 right-4 bg-black bg-opacity-75 text-white p-2 rounded text-xs z-[9999] max-w-xs"
      onClick={() => setIsDebugMode(false)}
    >
      <div className="font-bold mb-1">移動端點擊調試</div>
      {clickEvents.map((event, index) => (
        <div key={index} className="text-green-300 text-xs">
          {event}
        </div>
      ))}
      <div className="text-gray-400 text-xs mt-1">點擊關閉</div>
    </div>
  );
}