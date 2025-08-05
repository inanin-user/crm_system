'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useScrollOptimization } from '@/hooks/useScrollOptimization';

export default function Home() {
  const { user, isLoading } = useAuth();
  
  // 启用滚动性能优化
  useScrollOptimization();

  return (
    <div>
      {/* 歡迎標題 */}
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold text-gray-800 mb-4">
          歡迎使用 CRM 管理系統
        </h1>
        {!isLoading && user && (
          <div className="mb-4">
            <p className="text-lg text-blue-600 font-medium">
              欢迎回来，{user.username}！
            </p>
            <p className="text-sm text-gray-500">
              您的身份：{user.role === 'admin' ? '系统管理员' : '普通用户'}
            </p>
          </div>
        )}
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          這是一個功能強大的客戶關係管理系統，專門為活動出席管理而設計。
          您可以輕鬆管理參與者資訊、追蹤出席記錄，並生成詳細的統計報告。
        </p>
      </div>

      {/* 功能卡片 */}
      <div className="grid md:grid-cols-3 gap-8 mb-12">
        <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow duration-300">
          <div className="text-center">
            <div className="text-5xl mb-4">📋</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-3">出席記錄管理</h3>
            <p className="text-gray-600 mb-4">
              全面管理活動出席記錄，支持批量編輯、搜索和篩選功能
            </p>
            <a 
              href="/attendance" 
              className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              開始管理
            </a>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow duration-300">
          <div className="text-center">
            <div className="text-5xl mb-4">👥</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-3">參與者統計</h3>
            <p className="text-gray-600 mb-4">
              按姓名分類查看參與者統計，了解每個人的出席頻率和參與度
            </p>
            <a 
              href="/attendance/by_name" 
              className="inline-block bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              查看統計
            </a>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow duration-300">
          <div className="text-center">
            <div className="text-5xl mb-4">➕</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-3">快速添加</h3>
            <p className="text-gray-600 mb-4">
              快速添加新的出席記錄，簡單直觀的表單設計讓錄入變得輕鬆
            </p>
            <a 
              href="/attendance/add" 
              className="inline-block bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              添加記錄
            </a>
          </div>
        </div>
      </div>

      {/* 系統特色 */}
      <div className="bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-3xl font-bold text-gray-800 text-center mb-8">系統特色</h2>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🔍</span>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-gray-800 mb-2">智能搜索</h4>
              <p className="text-gray-600">支持多欄位搜索，快速找到您需要的記錄，搜索結果實時高亮顯示。</p>
            </div>
          </div>

          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">✏️</span>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-gray-800 mb-2">批量操作</h4>
              <p className="text-gray-600">支持批量編輯和刪除，提高工作效率，操作簡單安全。</p>
            </div>
          </div>

          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📊</span>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-gray-800 mb-2">統計報告</h4>
              <p className="text-gray-600">自動生成詳細的統計報告，幫助您了解活動參與情況和趨勢。</p>
            </div>
          </div>

          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">💾</span>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-gray-800 mb-2">雲端儲存</h4>
              <p className="text-gray-600">使用 MongoDB 雲端數據庫，確保數據安全可靠，隨時隨地訪問。</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
