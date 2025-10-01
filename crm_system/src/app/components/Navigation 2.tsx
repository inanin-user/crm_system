'use client'

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSidebar } from '@/contexts/SidebarContext';

export default function Navigation() {
  const pathname = usePathname();
  const { user, isLoading, logout } = useAuth();
  const { isCollapsed, toggleCollapse, isMobile } = useSidebar();
  const [isAttendanceOpen, setIsAttendanceOpen] = useState(false);
  const [isMemberManagementOpen, setIsMemberManagementOpen] = useState(false);
  const [isTrainerManagementOpen, setIsTrainerManagementOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isActivityManagementOpen, setIsActivityManagementOpen] = useState(false);
  const [isFinancialManagementOpen, setIsFinancialManagementOpen] = useState(false);
  const [isQRCodeOpen, setIsQRCodeOpen] = useState(false);
  
  // 防止快速鼠标移动造成的闪烁
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const accountTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 觸摸手勢支持
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // 處理觸摸開始
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isMobile) return;
    setTouchStart(e.targetTouches[0].clientX);
  };

  // 處理觸摸移動
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isMobile) return;
    setTouchEnd(e.targetTouches[0].clientX);
  };

  // 處理觸摸結束，檢測滑動手勢
  const handleTouchEnd = () => {
    if (!isMobile || !touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    // 如果在屏幕左邊緣開始滑動且向右滑動，打開菜單
    if (touchStart < 50 && isRightSwipe && isCollapsed) {
      toggleCollapse();
    }
    
    // 如果菜單打開且向左滑動，關閉菜單
    if (isLeftSwipe && !isCollapsed) {
      toggleCollapse();
    }

    // 重置觸摸狀態
    setTouchStart(null);
    setTouchEnd(null);
  };

  // 监听路径变化
  useEffect(() => {
    // 当路径变化时，自动展开相关的菜单
    if (pathname.startsWith('/attendance')) {
      setIsAttendanceOpen(true);
    } else {
      setIsAttendanceOpen(false);
    }
    
    if (pathname.startsWith('/member_management')) {
      setIsMemberManagementOpen(true);
    } else {
      setIsMemberManagementOpen(false);
    }
    
    if (pathname.startsWith('/trainer_management')) {
      setIsTrainerManagementOpen(true);
    } else {
      setIsTrainerManagementOpen(false);
    }
    
    if (pathname.startsWith('/account_management')) {
      setIsAccountOpen(true);
    } else {
      setIsAccountOpen(false);
    }
    
    if (pathname.startsWith('/activity_management')) {
      setIsActivityManagementOpen(true);
    } else {
      setIsActivityManagementOpen(false);
    }
    
    if (pathname.startsWith('/financial_management')) {
      setIsFinancialManagementOpen(true);
    } else {
      setIsFinancialManagementOpen(false);
    }

    if (pathname.startsWith('/qrcode')) {
      setIsQRCodeOpen(true);
    } else {
      setIsQRCodeOpen(false);
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

  const isAccountActive = () => {
    return pathname.startsWith('/account_management');
  };

  const isMemberManagementActive = () => {
    return pathname.startsWith('/member_management');
  };

  const isTrainerManagementActive = () => {
    return pathname.startsWith('/trainer_management');
  };

  const isActivityManagementActive = () => {
    return pathname.startsWith('/activity_management');
  };

  const isFinancialManagementActive = () => {
    return pathname.startsWith('/financial_management');
  };

  const isQRCodeActive = () => {
    return pathname.startsWith('/qrcode');
  };

  // 检查用户是否有权限访问账号管理
  const hasAccountManagementAccess = () => {
    return user?.role === 'admin';
  };

  // 注销功能
  const handleLogout = async () => {
    await logout();
  };

  // 清理计时器
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (accountTimeoutRef.current) {
        clearTimeout(accountTimeoutRef.current);
      }
    };
  }, []);

  return (
    <>
      {/* 移動端觸摸手勢檢測區域 */}
      {isMobile && (
        <div
          className="fixed inset-0 z-30 pointer-events-none"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{
            pointerEvents: isCollapsed ? 'auto' : 'none',
            // 只在左邊緣 50px 內響應觸摸
            background: isCollapsed 
              ? 'linear-gradient(to right, transparent 0px, transparent 50px, transparent 100%)' 
              : 'transparent'
          }}
        />
      )}

      {/* 侧边导航栏 */}
      <nav
        className={`fixed left-0 top-0 h-full bg-white shadow-2xl border-r border-gray-200 z-50 transition-all duration-300 ease-in-out ${
          isMobile
            ? isCollapsed
              ? '-translate-x-full w-64'
              : 'translate-x-0 w-72 sm:w-64'
            : isCollapsed
              ? 'w-16'
              : 'w-48'
        }`}
        style={{ 
          transform: 'translateZ(0)',
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
          // 移動端時添加更強的陰影效果
          ...(isMobile && !isCollapsed && {
            boxShadow: '4px 0 20px rgba(0, 0, 0, 0.15), 0 0 40px rgba(0, 0, 0, 0.1)'
          })
        }}
        onTouchStart={isMobile ? handleTouchStart : undefined}
        onTouchMove={isMobile ? handleTouchMove : undefined}
        onTouchEnd={isMobile ? handleTouchEnd : undefined}
      >
        <div className="flex flex-col h-full">
          {/* 顶部区域 - Logo和折叠按钮 */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            {!isCollapsed && (
              <Link href="/" className="flex items-center space-x-3">
                <div>
                  <span className="text-lg font-bold text-gray-800">CRM 系統</span>
                  <div className="text-xs text-gray-500">管理系統</div>
                </div>
              </Link>
            )}
            <button
              onClick={toggleCollapse}
              className="p-2 rounded-md hover:bg-gray-100 transition-colors"
            >
              <svg 
                className={`w-5 h-5 text-gray-600 transition-transform duration-300 ${
                  isCollapsed ? 'rotate-180' : ''
                }`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>
          </div>

          {/* 用户信息和注销按钮区域 */}
          {!isLoading && user && (
            <div className="p-4 border-b border-gray-200">
              {!isCollapsed ? (
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {user.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">{user.username}</div>
                      <div className="text-xs text-gray-500 capitalize">{
                        user.role === 'admin' ? '管理員' :
                        user.role === 'trainer' ? '教練' :
                        user.role === 'regular-member' ? '普通會員' :
                        user.role === 'premium-member' ? '星級會員' :
                        user.role === 'member' ? '會員' :
                        '普通用戶'
                      }</div>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 rounded-md transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>登出</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center mx-auto">
                    <span className="text-white text-xs font-medium">
                      {user.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full p-2 text-gray-700 hover:bg-red-50 hover:text-red-700 rounded-md transition-colors"
                    title="登出"
                  >
                    <svg className="w-4 h-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 导航菜单 */}
          <div className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-2">
              {/* 首页 */}
              <li>
                <Link
                  href="/"
                  className={`flex items-center space-x-3 px-3 py-2 rounded-md transition-colors ${
                    isActive('/')
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {!isCollapsed && (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                  )}
                  {!isCollapsed && <span>首頁</span>}
                </Link>
              </li>

              {/* 活動管理 - 獨立菜單項 */}
              {user?.role === 'admin' && (
                <li>
                  <Link
                    href="/attendance/activity_management"
                    className={`flex items-center space-x-3 px-3 py-2 rounded-md transition-colors ${
                      pathname === '/attendance/activity_management'
                        ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {!isCollapsed && (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    )}
                    {!isCollapsed && <span>活動管理</span>}
                  </Link>
                </li>
              )}

              {/* 出席管理 */}
              <li>
                <div>
                  <button
                    onClick={() => setIsAttendanceOpen(!isAttendanceOpen)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-md transition-colors ${
                      isAttendanceActive()
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      {!isCollapsed && (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                        </svg>
                      )}
                      {!isCollapsed && <span>運動班管理</span>}
                    </div>
                    {!isCollapsed && (
                      <svg 
                        className={`w-4 h-4 transition-transform duration-200 ${isAttendanceOpen ? 'rotate-180' : ''}`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    )}
                  </button>

                  {/* 出席管理子菜单 */}
                  {(isAttendanceOpen && !isCollapsed) && (
                    <ul className="mt-1 ml-8 space-y-1">
                      <li>
                        <Link
                          href="/attendance"
                          className={`block px-3 py-2 text-sm rounded-md transition-colors ${
                            pathname === '/attendance'
                              ? 'bg-blue-50 text-blue-700 border-l-2 border-blue-700'
                              : 'text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          運動班
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/attendance/check"
                          className={`block px-3 py-2 text-sm rounded-md transition-colors ${
                            pathname === '/attendance/check'
                              ? 'bg-blue-50 text-blue-700 border-l-2 border-blue-700'
                              : 'text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          點名記錄
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/attendance/by_name"
                          className={`block px-3 py-2 text-sm rounded-md transition-colors ${
                            pathname === '/attendance/by_name'
                              ? 'bg-blue-50 text-blue-700 border-l-2 border-blue-700'
                              : 'text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          按教練分類
                        </Link>
                      </li>
                      {/* 會員掃描簽到 */}
                      {['member', 'regular-member', 'premium-member'].includes(user?.role || '') && (
                        <li>
                          <Link
                            href="/attendance/scan"
                            className={`block px-3 py-2 text-sm rounded-md transition-colors ${
                              pathname === '/attendance/scan'
                                ? 'bg-blue-50 text-blue-700 border-l-2 border-blue-700'
                                : 'text-gray-600 hover:bg-gray-100'
                            }`}
                          >
                            掃描簽到
                          </Link>
                        </li>
                      )}
                    </ul>
                  )}
                </div>
              </li>

              {/* 会员管理 - 只有管理员可以看到 */}
              {user?.role === 'admin' && (
                <li>
                  <div>
                    <button
                      onClick={() => setIsMemberManagementOpen(!isMemberManagementOpen)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-md transition-colors ${
                        isMemberManagementActive()
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        {!isCollapsed && (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        )}
                        {!isCollapsed && <span>會員管理</span>}
                      </div>
                      {!isCollapsed && (
                        <svg 
                          className={`w-4 h-4 transition-transform duration-200 ${isMemberManagementOpen ? 'rotate-180' : ''}`} 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      )}
                    </button>

                    {/* 会员管理子菜单 */}
                    {(isMemberManagementOpen && !isCollapsed) && (
                      <ul className="mt-1 ml-8 space-y-1">
                        <li>
                          <Link
                            href="/member_management/profile"
                            className={`block px-3 py-2 text-sm rounded-md transition-colors ${
                              pathname === '/member_management/profile'
                                ? 'bg-blue-50 text-blue-700 border-l-2 border-blue-700'
                                : 'text-gray-600 hover:bg-gray-100'
                            }`}
                          >
                            續卡
                          </Link>
                        </li>
                      </ul>
                    )}
                  </div>
                </li>
              )}

              {/* 教练管理 - 只有管理员可以看到 */}
              {user?.role === 'admin' && (
                <li>
                  <div>
                    <button
                      onClick={() => setIsTrainerManagementOpen(!isTrainerManagementOpen)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-md transition-colors ${
                        isTrainerManagementActive()
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        {!isCollapsed && (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                          </svg>
                        )}
                        {!isCollapsed && <span>教練管理</span>}
                      </div>
                      {!isCollapsed && (
                        <svg 
                          className={`w-4 h-4 transition-transform duration-200 ${isTrainerManagementOpen ? 'rotate-180' : ''}`} 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      )}
                    </button>

                    {/* 教练管理子菜单 */}
                    {(isTrainerManagementOpen && !isCollapsed) && (
                      <ul className="mt-1 ml-8 space-y-1">
                        <li>
                          <Link
                            href="/trainer_management/profile"
                            className={`block px-3 py-2 text-sm rounded-md transition-colors ${
                              pathname === '/trainer_management/profile'
                                ? 'bg-blue-50 text-blue-700 border-l-2 border-blue-700'
                                : 'text-gray-600 hover:bg-gray-100'
                            }`}
                          >
                            教練資料
                          </Link>
                        </li>
                      </ul>
                    )}
                  </div>
                </li>
              )}

              {/* 活动管理 - 只有教练可以看到 */}
              {user?.role === 'trainer' && (
                <li>
                  <div>
                    <button
                      onClick={() => setIsActivityManagementOpen(!isActivityManagementOpen)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-md transition-colors ${
                        isActivityManagementActive()
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        {!isCollapsed && (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        )}
                        {!isCollapsed && <span>活動管理</span>}
                      </div>
                      {!isCollapsed && (
                        <svg 
                          className={`w-4 h-4 transition-transform duration-200 ${isActivityManagementOpen ? 'rotate-180' : ''}`} 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      )}
                    </button>

                    {/* 活动管理子菜单 */}
                    {(isActivityManagementOpen && !isCollapsed) && (
                      <ul className="mt-1 ml-8 space-y-1">
                        <li>
                          <Link
                            href="/activity_management/my_activity"
                            className={`block px-3 py-2 text-sm rounded-md transition-colors ${
                              pathname === '/activity_management/my_activity'
                                ? 'bg-blue-50 text-blue-700 border-l-2 border-blue-700'
                                : 'text-gray-600 hover:bg-gray-100'
                            }`}
                          >
                            我的活動
                          </Link>
                        </li>
                      </ul>
                    )}
                  </div>
                </li>
              )}

              {/* 財務管理 - 只有管理员可以看到 */}
              {user?.role === 'admin' && (
                <li>
                  <div>
                    <button
                      onClick={() => setIsFinancialManagementOpen(!isFinancialManagementOpen)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-md transition-colors ${
                        isFinancialManagementActive()
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        {!isCollapsed && (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                          </svg>
                        )}
                        {!isCollapsed && <span>財務管理</span>}
                      </div>
                      {!isCollapsed && (
                        <svg 
                          className={`w-4 h-4 transition-transform duration-200 ${isFinancialManagementOpen ? 'rotate-180' : ''}`} 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      )}
                    </button>

                    {/* 財務管理子菜单 */}
                    {(isFinancialManagementOpen && !isCollapsed) && (
                      <ul className="mt-1 ml-8 space-y-1">
                        <li>
                          <Link
                            href="/financial_management"
                            className={`block px-3 py-2 text-sm rounded-md transition-colors ${
                              pathname === '/financial_management'
                                ? 'bg-blue-50 text-blue-700 border-l-2 border-blue-700'
                                : 'text-gray-600 hover:bg-gray-100'
                            }`}
                          >
                            財務總覽
                          </Link>
                        </li>
                        <li>
                          <Link
                            href="/financial_management/by_name"
                            className={`block px-3 py-2 text-sm rounded-md transition-colors ${
                              pathname === '/financial_management/by_name'
                                ? 'bg-blue-50 text-blue-700 border-l-2 border-blue-700'
                                : 'text-gray-600 hover:bg-gray-100'
                            }`}
                          >
                            按姓名分類
                          </Link>
                        </li>
                        <li>
                          <Link
                            href="/financial_management/report"
                            className={`block px-3 py-2 text-sm rounded-md transition-colors ${
                              pathname === '/financial_management/report'
                                ? 'bg-blue-50 text-blue-700 border-l-2 border-blue-700'
                                : 'text-gray-600 hover:bg-gray-100'
                            }`}
                          >
                            財務報告
                          </Link>
                        </li>
                        <li>
                          <Link
                            href="/financial_management/add"
                            className={`block px-3 py-2 text-sm rounded-md transition-colors ${
                              pathname === '/financial_management/add'
                                ? 'bg-blue-50 text-blue-700 border-l-2 border-blue-700'
                                : 'text-gray-600 hover:bg-gray-100'
                            }`}
                          >
                            新增記錄
                          </Link>
                        </li>
                      </ul>
                    )}
                  </div>
                </li>
              )}

              {/* 账号管理 - 只有管理员可以看到 */}
              {hasAccountManagementAccess() && (
                <li>
                  <div>
                    <button
                      onClick={() => setIsAccountOpen(!isAccountOpen)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-md transition-colors ${
                        isAccountActive()
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        {!isCollapsed && (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                          </svg>
                        )}
                        {!isCollapsed && <span>帳號管理</span>}
                      </div>
                      {!isCollapsed && (
                        <svg 
                          className={`w-4 h-4 transition-transform duration-200 ${isAccountOpen ? 'rotate-180' : ''}`} 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      )}
                    </button>

                    {/* 账号管理子菜单 */}
                    {(isAccountOpen && !isCollapsed) && (
                      <ul className="mt-1 ml-8 space-y-1">
                        <li>
                          <Link
                            href="/account_management/admin"
                            className={`block px-3 py-2 text-sm rounded-md transition-colors ${
                              pathname === '/account_management/admin'
                                ? 'bg-blue-50 text-blue-700 border-l-2 border-blue-700'
                                : 'text-gray-600 hover:bg-gray-100'
                            }`}
                          >
                            管理員
                          </Link>
                        </li>
                        <li>
                          <Link
                            href="/account_management/trainer"
                            className={`block px-3 py-2 text-sm rounded-md transition-colors ${
                              pathname === '/account_management/trainer'
                                ? 'bg-blue-50 text-blue-700 border-l-2 border-blue-700'
                                : 'text-gray-600 hover:bg-gray-100'
                            }`}
                          >
                            教練
                          </Link>
                        </li>
                        <li>
                          <Link
                            href="/account_management/member"
                            className={`block px-3 py-2 text-sm rounded-md transition-colors ${
                              pathname === '/account_management/member'
                                ? 'bg-blue-50 text-blue-700 border-l-2 border-blue-700'
                                : 'text-gray-600 hover:bg-gray-100'
                            }`}
                          >
                            會員
                          </Link>
                        </li>
                      </ul>
                    )}
                  </div>
                </li>
              )}

              {/* 二維碼管理 - 只有管理員可以看到 */}
              {user?.role === 'admin' && (
                <li>
                  <div>
                    <button
                      onClick={() => setIsQRCodeOpen(!isQRCodeOpen)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-md transition-colors ${
                        isQRCodeActive()
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        {!isCollapsed && (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h-1m-9-1H7a2 2 0 01-2-2V7a2 2 0 012-2h1m0 0V4a1 1 0 011-1h4a1 1 0 011 1v1m0 0h1a2 2 0 012 2v6a2 2 0 01-2 2h-1m-9 0v1m4-4h.01m3-3h.01" />
                          </svg>
                        )}
                        {!isCollapsed && <span>二維碼</span>}
                      </div>
                      {!isCollapsed && (
                        <svg
                          className={`w-4 h-4 transition-transform duration-200 ${isQRCodeOpen ? 'rotate-180' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      )}
                    </button>

                    {/* 二維碼管理子菜单 */}
                    {(isQRCodeOpen && !isCollapsed) && (
                      <ul className="mt-1 ml-8 space-y-1">
                        <li>
                          <Link
                            href="/qrcode/checkin"
                            className={`block px-3 py-2 text-sm rounded-md transition-colors ${
                              pathname === '/qrcode/checkin'
                                ? 'bg-blue-50 text-blue-700 border-l-2 border-blue-700'
                                : 'text-gray-600 hover:bg-gray-100'
                            }`}
                          >
                            補簽到
                          </Link>
                        </li>
                        <li>
                          <Link
                            href="/qrcode/milkshake"
                            className={`block px-3 py-2 text-sm rounded-md transition-colors ${
                              pathname === '/qrcode/milkshake'
                                ? 'bg-blue-50 text-blue-700 border-l-2 border-blue-700'
                                : 'text-gray-600 hover:bg-gray-100'
                            }`}
                          >
                            奶昔
                          </Link>
                        </li>
                      </ul>
                    )}
                  </div>
                </li>
              )}
            </ul>
          </div>
        </div>
      </nav>

      {/* 移动端遮罩层 - 變暗半透明背景，凸顯菜單欄 */}
      {isMobile && !isCollapsed && (
        <div 
          className="fixed inset-0 z-40 transition-all duration-300"
          onClick={toggleCollapse}
          onTouchStart={(e) => {
            // 添加觸摸回饋 - 稍微加深
            e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
          }}
          onTouchEnd={(e) => {
            // 恢復原色
            e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.4)';
          }}
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            // 移除模糊效果，保持內容清晰可見
            // backdropFilter: 移除
            // WebkitBackdropFilter: 移除
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            // 確保在所有設備上顯示
            opacity: 1,
            visibility: 'visible',
          }}
        />
      )}

      {/* 移动端菜单按钮 - 改進的漢堡包菜單 */}
      {isMobile && (
        <button
          onClick={toggleCollapse}
          className="fixed top-4 left-4 z-50 p-3 bg-white rounded-xl shadow-lg border border-gray-200 hover:shadow-xl active:scale-95 transition-all duration-200"
          style={{
            minHeight: '48px',
            minWidth: '48px',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'rgba(0,0,0,0.1)'
          }}
          aria-label={isCollapsed ? "打開菜單" : "關閉菜單"}
        >
          <div className="relative w-6 h-6 flex flex-col justify-center items-center">
            {/* 漢堡包菜單動畫圖標 */}
            <span className={`block absolute h-0.5 w-6 bg-gray-700 transform transition duration-300 ease-in-out ${
              isCollapsed ? 'rotate-0 translate-y-0' : 'rotate-45 translate-y-0'
            }`} />
            <span className={`block absolute h-0.5 w-6 bg-gray-700 transform transition duration-300 ease-in-out ${
              isCollapsed ? 'opacity-100' : 'opacity-0'
            }`} style={{ top: '50%', transform: 'translateY(-50%)' }} />
            <span className={`block absolute h-0.5 w-6 bg-gray-700 transform transition duration-300 ease-in-out ${
              isCollapsed ? 'rotate-0 translate-y-0' : '-rotate-45 translate-y-0'
            }`} />
          </div>
        </button>
      )}
    </>
  );
} 