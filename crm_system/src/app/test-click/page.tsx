'use client'

import { useState } from 'react';

export default function TestClickPage() {
  const [clickCount, setClickCount] = useState(0);
  const [touchCount, setTouchCount] = useState(0);
  

  const handleClick = () => {
    setClickCount(prev => prev + 1);
    console.log('按鈕被點擊了！');
    alert('按鈕點擊成功！');
  };

  const handleTouchEnd = () => {
    setTouchCount(prev => prev + 1);
    console.log('觸摸事件觸發！');
  };

  return (
    <div className="p-8 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-6">移動端點擊測試頁面</h1>
      
      <div className="space-y-4">
        <div>
          <p>點擊次數: {clickCount}</p>
          <p>觸摸次數: {touchCount}</p>
        </div>
        
        <button
          onClick={handleClick}
          onTouchEnd={handleTouchEnd}
          className="w-full p-4 bg-blue-600 text-white rounded-lg font-bold text-lg"
          style={{
            pointerEvents: 'auto',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'rgba(0,0,0,0.1)',
            cursor: 'pointer'
          }}
        >
          測試按鈕 - 點我試試
        </button>

        <button
          onClick={() => alert('普通按鈕也被點擊了！')}
          className="w-full p-4 bg-green-600 text-white rounded-lg"
        >
          普通測試按鈕
        </button>

        <button
          onClick={() => window.history.back()}
          className="w-full p-2 bg-gray-500 text-white rounded"
        >
          返回上一頁
        </button>
      </div>
    </div>
  );
}