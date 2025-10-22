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

  // 檢查用户是否有權限訪問帳號管理
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
      {/* 手機端頂部導航欄 */}
      {isMobile && (
        <div className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-[60] flex items-center px-4">
          {/* 漢堡按鈕 */}
          <button
            onClick={toggleCollapse}
            className="p-2 rounded-lg hover:bg-gray-100 active:scale-95 transition-all duration-200"
            style={{
              minHeight: '44px',
              minWidth: '44px',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'rgba(0,0,0,0.1)'
            }}
            aria-label={isCollapsed ? "打開菜單" : "關閉菜單"}
          >
            <div className="relative w-6 h-6 flex flex-col justify-center items-center">
              {/* 漢堡包菜單動畫圖標 */}
              <span className={`block absolute h-0.5 w-6 bg-gray-700 transform transition duration-300 ease-in-out ${
                isCollapsed ? 'rotate-0 -translate-y-2' : 'rotate-45 translate-y-0'
              }`} />
              <span className={`block absolute h-0.5 w-6 bg-gray-700 transform transition duration-300 ease-in-out ${
                isCollapsed ? 'opacity-100' : 'opacity-0'
              }`} />
              <span className={`block absolute h-0.5 w-6 bg-gray-700 transform transition duration-300 ease-in-out ${
                isCollapsed ? 'rotate-0 translate-y-2' : '-rotate-45 translate-y-0'
              }`} />
            </div>
          </button>

          {/* 品牌標誌 */}
          <div className="flex-1 flex items-center justify-center">
            <span className="text-lg font-bold text-gray-800">CRM 系統</span>
          </div>

          {/* 右側佔位（保持對稱） */}
          <div style={{ minWidth: '44px' }} />
        </div>
      )}

      {/* 侧边导航栏 */}
      <nav
        className={`fixed z-50 transition-all duration-300 ease-in-out bg-white ${
          isMobile
            ? isCollapsed
              ? 'hidden'
              : 'inset-0 top-16 overflow-y-auto'
            : isCollapsed
              ? 'left-0 top-0 h-full w-16 shadow-2xl border-r border-gray-200'
              : 'left-0 top-0 h-full w-56 shadow-2xl border-r border-gray-200'
        }`}
        style={{
          transform: 'translateZ(0)',
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
          // 確保手機端滾動流暢，不會觸發任何關閉事件
          ...(isMobile && !isCollapsed && {
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain',
            touchAction: 'pan-y', // 只允許垂直滾動
            isolation: 'isolate' // 防止觸摸事件冒泡到外層
          })
        }}
        onTouchStart={(e) => {
          // 阻止事件冒泡，避免觸發其他觸摸處理器
          if (isMobile && !isCollapsed) {
            e.stopPropagation();
          }
        }}
        onTouchMove={(e) => {
          // 阻止觸摸移動事件冒泡
          if (isMobile && !isCollapsed) {
            e.stopPropagation();
          }
        }}
        onTouchEnd={(e) => {
          // 阻止觸摸結束事件冒泡
          if (isMobile && !isCollapsed) {
            e.stopPropagation();
          }
        }}
        onClick={(e) => {
          // 阻止點擊事件冒泡到可能的全局點擊處理器
          if (isMobile && !isCollapsed) {
            e.stopPropagation();
          }
        }}
      >
        <div className="flex flex-col h-full">
          {/* 顶部区域 - Logo和折叠按钮（只在電腦端顯示） */}
          {!isMobile && (
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
          )}

          {/* 使用者資訊和登出按鈕区域 */}
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

              {/* 出席管理 - 會員角色顯示直接連結，其他角色顯示折疊菜單 */}
              <li>
                {/* 會員角色：直接顯示掃描簽到連結 */}
                {['member', 'regular-member', 'premium-member'].includes(user?.role || '') ? (
                  <Link
                    href="/attendance/scan"
                    className={`flex items-center space-x-3 px-3 py-2 rounded-md transition-colors ${
                      pathname === '/attendance/scan'
                        ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {!isCollapsed && (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                      </svg>
                    )}
                    {!isCollapsed && <span>掃描簽到</span>}
                  </Link>
                ) : (
                  /* 其他角色：顯示折疊菜單 */
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
                        {/* 運動班、點名記錄、按教練分類 - 只對管理員和教練顯示 */}
                        {['admin', 'trainer'].includes(user?.role || '') && (
                          <>
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
                          </>
                        )}
                        {/* 補簽到 */}
                        {user?.role === 'admin' && (
                          <li>
                            <Link
                              href="/attendance/checkin"
                              className={`block px-3 py-2 text-sm rounded-md transition-colors ${
                                pathname === '/attendance/checkin'
                                  ? 'bg-blue-50 text-blue-700 border-l-2 border-blue-700'
                                  : 'text-gray-600 hover:bg-gray-100'
                              }`}
                            >
                              補簽到
                            </Link>
                          </li>
                        )}
                      </ul>
                    )}
                  </div>
                )}
              </li>

              {/* 會員資料 - 只有會員可以看到 */}
              {['member', 'regular-member', 'premium-member'].includes(user?.role || '') && (
                <li>
                  <Link
                    href="/member_management/my_profile"
                    className={`flex items-center space-x-3 px-3 py-2 rounded-md transition-colors ${
                      pathname === '/member_management/my_profile'
                        ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {!isCollapsed && (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    )}
                    {!isCollapsed && <span>會員資料</span>}
                  </Link>
                </li>
              )}

              {/* 會員管理 - 只有管理员可以看到 */}
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

                    {/* 會員管理子菜单 */}
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

              {/* 帳號管理 - 只有管理员可以看到 */}
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

                    {/* 帳號管理子菜单 */}
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
                            href="/qrcode/generate"
                            className={`block px-3 py-2 text-sm rounded-md transition-colors ${
                              pathname === '/qrcode/generate'
                                ? 'bg-blue-50 text-blue-700 border-l-2 border-blue-700'
                                : 'text-gray-600 hover:bg-gray-100'
                            }`}
                          >
                            二維碼生成
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
    </>
  );
} 