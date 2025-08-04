'use client'

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';

export default function Navigation() {
  const pathname = usePathname();
  const [isAttendanceOpen, setIsAttendanceOpen] = useState(() => {
    // 如果當前路徑是出席管理相關的，預設展開菜單
    return pathname.startsWith('/attendance');
  });
  
  // 新增：用於防止快速鼠標移動造成的閃爍
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  // 新增：標記是否是從菜單項點擊導航的
  const isMenuClickNavigation = useRef(false);

  // 監聽路徑變化，自動調整下拉菜單狀態
  useEffect(() => {
    // 如果是從菜單項點擊導航的，不自動打開菜單
    if (isMenuClickNavigation.current) {
      isMenuClickNavigation.current = false;
      return;
    }
    
    if (pathname.startsWith('/attendance')) {
      setIsAttendanceOpen(true);
    }
  }, [pathname]);

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  const isAttendanceActive = () => {
    return pathname.startsWith('/attendance');
  };

  // 修改鼠標事件處理函數
  const handleMouseEnter = () => {
    // 清除任何待執行的關閉操作
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsAttendanceOpen(true);
  };

  const handleMouseLeave = () => {
    // 添加延遲，防止快速移動造成的意外關閉
    timeoutRef.current = setTimeout(() => {
      // 無論在哪個頁面，鼠標移開都關閉菜單，提升用戶體驗
      setIsAttendanceOpen(false);
    }, 150); // 稍微增加延遲到150ms，讓操作更流暢
  };

  // 新增：點擊菜單項後關閉菜單
  const handleMenuItemClick = () => {
    // 清除任何待執行的關閉操作
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    // 標記為菜單項點擊導航
    isMenuClickNavigation.current = true;
    // 立即關閉菜單
    setIsAttendanceOpen(false);
  };

  // 清理計時器
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* 左側 Logo 和標題 */}
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-3">
              <div>
                <span className="text-xl font-bold text-gray-800">CRM 系統</span>
                <div className="text-xs text-gray-500">管理系統</div>
              </div>
            </Link>
          </div>
          
          {/* 右側導航選項 */}
          <div className="flex items-center space-x-1">
            <ul className="nav nav-underline flex items-center space-x-1">
              {/* 首頁 */}
              <li className="nav-item">
                <Link
                  href="/"
                  className={`nav-link flex items-center space-x-2 px-4 py-2 text-sm font-medium transition-all duration-200 relative border-b-2 ${
                    isActive('/')
                      ? 'text-blue-700 border-blue-700'
                      : 'text-gray-600 hover:text-gray-900 border-transparent hover:border-gray-300'
                  }`}
                >
                  <span>首頁</span>
                </Link>
              </li>

              {/* 出席管理下拉菜單 - 改為鼠標懸停 */}
              <li 
                className="nav-item relative"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              >
                <div
                  className={`nav-link flex items-center space-x-2 px-4 py-2 text-sm font-medium transition-all duration-200 border-b-2 cursor-pointer ${
                    isAttendanceActive()
                      ? 'text-blue-700 border-blue-700'
                      : 'text-gray-600 hover:text-gray-900 border-transparent hover:border-gray-300'
                  }`}
                >
                  <span>出席管理</span>
                  <svg 
                    className={`w-4 h-4 transition-transform duration-200 ${isAttendanceOpen ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>

                {/* 下拉菜單 */}
                {isAttendanceOpen && (
                  <div 
                    className="absolute top-full left-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50"
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                  >
                    <Link
                      href="/attendance"
                      className={`block px-4 py-2 text-sm transition-colors ${
                        pathname === '/attendance'
                          ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                      onClick={handleMenuItemClick}
                    >
                      <div className="flex items-center space-x-2">
                        <span>出席記錄管理</span>
                      </div>
                    </Link>
                    <Link
                      href="/attendance/by_name"
                      className={`block px-4 py-2 text-sm transition-colors ${
                        pathname === '/attendance/by_name'
                          ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                      onClick={handleMenuItemClick}
                    >
                      <div className="flex items-center space-x-2">
                        <span>按姓名分類</span>
                      </div>
                    </Link>
                    <Link
                      href="/attendance/add"
                      className={`block px-4 py-2 text-sm transition-colors ${
                        pathname === '/attendance/add'
                          ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                      onClick={handleMenuItemClick}
                    >
                      <div className="flex items-center space-x-2">
                        <span>添加記錄</span>
                      </div>
                    </Link>
                    <Link
                      href="/attendance/check"
                      className={`block px-4 py-2 text-sm transition-colors ${
                        pathname === '/attendance/check'
                          ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                      onClick={handleMenuItemClick}
                    >
                      <div className="flex items-center space-x-2">
                        <span>點名記錄</span>
                      </div>
                    </Link>
                  </div>
                )}
              </li>

              {/* 其他導航項目可以在這裡添加 */}
              <li className="nav-item">
                <Link
                  href="#"
                  className="nav-link flex items-center space-x-2 px-4 py-2 text-sm font-medium transition-all duration-200 border-b-2 text-gray-400 border-transparent cursor-not-allowed"
                >
                  <span>報告</span>
                </Link>
              </li>

              <li className="nav-item">
                <Link
                  href="#"
                  className="nav-link flex items-center space-x-2 px-4 py-2 text-sm font-medium transition-all duration-200 border-b-2 text-gray-400 border-transparent cursor-not-allowed"
                >
                  <span>設置</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </nav>
  );
} 