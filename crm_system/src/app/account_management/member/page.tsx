'use client';

import { useAuth } from '@/contexts/AuthContext';

export default function MemberManagementPage() {
  const { user } = useAuth();

  return (
    <div className="max-w-7xl mx-auto">
      {/* 页面标题 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">會員帳號管理</h1>
        <p className="mt-2 text-gray-600">
          管理會員帳號，包括新增、編輯和刪除會員帳號及會員等級設置
        </p>
      </div>

      {/* 页面内容 */}
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">👥</div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">會員帳號管理</h2>
          <p className="text-gray-600 mb-8">
            此頁面將用於管理會員帳號<br/>
            功能包括：新增會員、編輯會員資訊、設置會員等級、管理會員權限等
          </p>
          
          {user && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 inline-block">
              <p className="text-purple-800">
                <strong>當前登入用戶：</strong>{user.username} ({user.role === 'admin' ? '管理員' : '普通用戶'})
              </p>
            </div>
          )}
          
          <div className="mt-8 text-gray-500">
            <p>📝 此頁面正在開發中...</p>
          </div>
        </div>
      </div>
    </div>
  );
} 