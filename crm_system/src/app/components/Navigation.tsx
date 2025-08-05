'use client'

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export default function Navigation() {
  const pathname = usePathname();
  const { user, isLoading, logout } = useAuth();
  const [isAttendanceOpen, setIsAttendanceOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  
  // 新增：用於防止快速鼠標移動造成的閃爍
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const accountTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const userMenuTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // 新增：標記是否是從菜單項點擊導航的
  const isMenuClickNavigation = useRef(false);

  // 監聽路徑變化，只在從其他菜單項導航時關閉菜單
  useEffect(() => {
    // 如果是從菜單項點擊導航的，重置標記
    if (isMenuClickNavigation.current) {
      isMenuClickNavigation.current = false;
    }
    // 移除自動打開菜單的邏輯，只保留必要的狀態管理
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

  const isAccountActive = () => {
    return pathname.startsWith('/account_management');
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

  // 账号管理鼠标事件处理函数
  const handleAccountMouseEnter = () => {
    // 清除任何待執行的關閉操作
    if (accountTimeoutRef.current) {
      clearTimeout(accountTimeoutRef.current);
      accountTimeoutRef.current = null;
    }
    setIsAccountOpen(true);
  };

  const handleAccountMouseLeave = () => {
    // 添加延遲，防止快速移動造成的意外關閉
    accountTimeoutRef.current = setTimeout(() => {
      setIsAccountOpen(false);
    }, 150);
  };

  // 新增：點擊菜單項後關閉菜單
  const handleMenuItemClick = () => {
    // 清除任何待執行的關閉操作
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (accountTimeoutRef.current) {
      clearTimeout(accountTimeoutRef.current);
      accountTimeoutRef.current = null;
    }
    // 標記為菜單項點擊導航
    isMenuClickNavigation.current = true;
    // 立即關閉菜單
    setIsAttendanceOpen(false);
    setIsAccountOpen(false);
  };

  // 用户菜单鼠标事件处理
  const handleUserMenuEnter = () => {
    if (userMenuTimeoutRef.current) {
      clearTimeout(userMenuTimeoutRef.current);
      userMenuTimeoutRef.current = null;
    }
    setIsUserMenuOpen(true);
  };

  const handleUserMenuLeave = () => {
    userMenuTimeoutRef.current = setTimeout(() => {
      setIsUserMenuOpen(false);
    }, 150);
  };

  // 注销功能
  const handleLogout = async () => {
    await logout();
  };

  // 清理計時器
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (accountTimeoutRef.current) {
        clearTimeout(accountTimeoutRef.current);
      }
      if (userMenuTimeoutRef.current) {
        clearTimeout(userMenuTimeoutRef.current);
      }
    };
  }, []);

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-50 will-change-transform"
         style={{ 
           transform: 'translateZ(0)',
           backfaceVisibility: 'hidden',
           WebkitBackfaceVisibility: 'hidden'
         }}>
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
                    style={{
                      transform: 'translateZ(0)',
                      backfaceVisibility: 'hidden',
                      WebkitBackfaceVisibility: 'hidden',
                      willChange: 'opacity, transform'
                    }}
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

              {/* 账号管理下拉菜单 */}
              <li 
                className="nav-item relative"
                onMouseEnter={handleAccountMouseEnter}
                onMouseLeave={handleAccountMouseLeave}
              >
                <div
                  className={`nav-link flex items-center space-x-2 px-4 py-2 text-sm font-medium transition-all duration-200 border-b-2 cursor-pointer ${
                    isAccountActive()
                      ? 'text-blue-700 border-blue-700'
                      : 'text-gray-600 hover:text-gray-900 border-transparent hover:border-gray-300'
                  }`}
                >
                  <span>帳號管理</span>
                  <svg 
                    className={`w-4 h-4 transition-transform duration-200 ${isAccountOpen ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>

                {/* 下拉菜單 */}
                {isAccountOpen && (
                  <div 
                    className="absolute top-full left-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50"
                    style={{
                      transform: 'translateZ(0)',
                      backfaceVisibility: 'hidden',
                      WebkitBackfaceVisibility: 'hidden',
                      willChange: 'opacity, transform'
                    }}
                    onMouseEnter={handleAccountMouseEnter}
                    onMouseLeave={handleAccountMouseLeave}
                  >
                    <Link
                      href="/account_management/admin"
                      className={`block px-4 py-2 text-sm transition-colors ${
                        pathname === '/account_management/admin'
                          ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                      onClick={handleMenuItemClick}
                    >
                      <div className="flex items-center space-x-2">
                        <span>管理員</span>
                      </div>
                    </Link>
                    <Link
                      href="/account_management/trainer"
                      className={`block px-4 py-2 text-sm transition-colors ${
                        pathname === '/account_management/trainer'
                          ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                      onClick={handleMenuItemClick}
                    >
                      <div className="flex items-center space-x-2">
                        <span>教練</span>
                      </div>
                    </Link>
                    <Link
                      href="/account_management/member"
                      className={`block px-4 py-2 text-sm transition-colors ${
                        pathname === '/account_management/member'
                          ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                      onClick={handleMenuItemClick}
                    >
                      <div className="flex items-center space-x-2">
                        <span>會員</span>
                      </div>
                    </Link>
                  </div>
                )}
              </li>
            </ul>

            {/* 用户信息和菜单 */}
            {!isLoading && user && (
              <div className="relative ml-4 border-l border-gray-200 pl-4">
                <div
                  className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 px-3 py-2 rounded-md transition-colors"
                  onMouseEnter={handleUserMenuEnter}
                  onMouseLeave={handleUserMenuLeave}
                >
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {user.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="hidden sm:block">
                      <div className="text-sm font-medium text-gray-900">{user.username}</div>
                      <div className="text-xs text-gray-500 capitalize">{user.role}</div>
                    </div>
                  </div>
                  <svg 
                    className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>

                {/* 用户下拉菜单 */}
                {isUserMenuOpen && (
                  <div 
                    className="absolute top-full right-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50"
                    style={{
                      transform: 'translateZ(0)',
                      backfaceVisibility: 'hidden',
                      WebkitBackfaceVisibility: 'hidden',
                      willChange: 'opacity, transform'
                    }}
                    onMouseEnter={handleUserMenuEnter}
                    onMouseLeave={handleUserMenuLeave}
                  >
                    <div className="px-4 py-2 border-b border-gray-100">
                      <div className="text-sm font-medium text-gray-900">{user.username}</div>
                      <div className="text-xs text-gray-500">角色: {user.role === 'admin' ? '管理员' : '普通用户'}</div>
                      {user.lastLogin && (
                        <div className="text-xs text-gray-500">
                          最后登录: {new Date(user.lastLogin).toLocaleString('zh-CN')}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors flex items-center space-x-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      <span>注销</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
} 