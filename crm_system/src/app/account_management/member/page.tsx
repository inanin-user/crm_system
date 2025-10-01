'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useScrollOptimization } from '@/hooks/useScrollOptimization';
import { useMobileDetection } from '@/hooks/useMobileDetection';
import AddAccountModal from '@/app/components/AddAccountModal';
import DeleteAccountModal from '@/app/components/DeleteAccountModal';
import EditAccountModal from '@/app/components/EditAccountModal';

interface Account {
  _id: string;
  username: string;
  role: string;
  isActive: boolean;
  locations: string[];
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
}

interface AccountDetail extends Account {
  password: string;
}

export default function MemberManagementPage() {
  const { } = useAuth();
  const { isMobile } = useMobileDetection();
  useScrollOptimization();

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<AccountDetail | null>(null);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<Account | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [accountToEdit, setAccountToEdit] = useState<AccountDetail | null>(null);
  const [error, setError] = useState('');
  const [showDetails, setShowDetails] = useState(!isMobile); // 移动端默认顯示列表，桌面端默认顯示詳情

  // 獲取會員列表
  const fetchMemberAccounts = async () => {
    try {
      setIsLoadingAccounts(true);
      const response = await fetch('/api/accounts?role=member');
      const result = await response.json();
      
      if (result.success) {
        setAccounts(result.data);
        // 如果有帳戶且没有选中的帳戶，默认选中第一个
        if (result.data.length > 0 && !selectedAccount) {
          handleSelectAccount(result.data[0]._id);
        }
      } else {
        setError('獲取會員列表失敗');
      }
    } catch {
      setError('網絡錯誤，請重试');
    } finally {
      setIsLoadingAccounts(false);
    }
  };

  // 獲取帳戶详细信息
  const handleSelectAccount = async (accountId: string) => {
    try {
      setIsLoadingDetail(true);
      const response = await fetch(`/api/accounts/${accountId}`);
      const result = await response.json();
      
      if (result.success) {
        setSelectedAccount(result.data);
        // 在移动端選擇帳戶后切换到詳情视图
        if (isMobile) {
          setShowDetails(true);
        }
      } else {
        setError('獲取帳戶詳情失敗');
      }
    } catch {
      setError('網絡錯誤，請重试');
    } finally {
      setIsLoadingDetail(false);
    }
  };

  // 添加帳戶成功回调
  const handleAddSuccess = () => {
    fetchMemberAccounts(); // 重新獲取列表
  };

  // 刪除帳戶处理
  const handleDeleteClick = () => {
    if (selectedAccount) {
      setAccountToDelete(selectedAccount);
      setIsDeleteModalOpen(true);
    }
  };

  // 刪除帳戶成功回调
  const handleDeleteSuccess = () => {
    fetchMemberAccounts(); // 重新獲取列表
    setSelectedAccount(null); // 清空选中的帳戶
  };

  // 修改帳戶处理
  const handleEditClick = () => {
    if (selectedAccount) {
      setAccountToEdit(selectedAccount);
      setIsEditModalOpen(true);
    }
  };

  // 修改帳戶成功回调
  const handleEditSuccess = () => {
    fetchMemberAccounts(); // 重新獲取列表
    if (selectedAccount) {
      // 重新獲取选中帳戶的详细信息
      handleSelectAccount(selectedAccount._id);
    }
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    if (!dateString) return '從未登錄';
    return new Date(dateString).toLocaleString('zh-CN');
  };

  useEffect(() => {
    fetchMemberAccounts();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 頁面標題和添加按钮 */}
        <div className="mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">會員帳號管理</h1>
            <p className="mt-2 text-gray-600">管理系統會員帳號，包括查看詳情和新增會員</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleDeleteClick}
              disabled={!selectedAccount}
              className="bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              刪除帳戶
            </button>
            <button
              onClick={handleEditClick}
              disabled={!selectedAccount}
              className="bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              修改帳戶
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              添加帳戶
            </button>
          </div>
        </div>

        {/* 錯誤提示 */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* 主要内容区域 */}
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          {/* 移动端标题栏 */}
          {isMobile && (
            <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                {showDetails ? '帳戶詳情' : '會員列表'}
              </h2>
              {showDetails && selectedAccount && (
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-600 hover:text-gray-900 flex items-center"
                >
                  <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  返回列表
                </button>
              )}
            </div>
          )}

          <div className="flex flex-col lg:flex-row min-h-96">
            {/* 左侧 - 會員列表 */}
            <div className={`w-full lg:w-1/3 lg:border-r border-gray-200 ${isMobile ? (showDetails ? 'hidden' : 'block') : 'block'}`}>
            {!isMobile && (
              <div className="p-4 bg-gray-50 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">會員列表</h2>
                <p className="text-sm text-gray-600">共 {accounts.length} 個會員</p>
              </div>
            )}
            
            <div className="overflow-y-auto max-h-80 lg:h-80">
              {isLoadingAccounts ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
                </div>
              ) : accounts.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500">
                  暫無會員帳戶
                </div>
              ) : (
                <div className="space-y-1 p-2">
                  {accounts.map((account) => (
                    <button
                      key={account._id}
                      onClick={() => handleSelectAccount(account._id)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        selectedAccount?._id === account._id
                          ? 'bg-orange-50 border border-orange-200 text-orange-900'
                          : 'hover:bg-gray-50 border border-transparent'
                      }`}
                    >
                      <div className="font-medium">{account.username}</div>
                      <div className="text-sm text-gray-500">
                        {account.isActive ? '活躍' : '已禁用'} · 創建於 {formatDate(account.createdAt).split(' ')[0]}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

            {/* 右侧 - 帳戶詳情 */}
            <div className={`flex-1 border-t lg:border-t-0 lg:border-l border-gray-200 ${isMobile ? (showDetails ? 'block' : 'hidden') : 'block'}`}>
            {!isMobile && (
              <div className="p-4 bg-gray-50 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">帳戶詳情</h2>
              </div>
            )}
            
            <div className="p-6">
              {!selectedAccount ? (
                <div className="flex items-center justify-center min-h-64 lg:h-64 text-gray-500">
                  請從列表中選擇一個會員帳戶
                </div>
              ) : isLoadingDetail ? (
                <div className="flex items-center justify-center min-h-64 lg:h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      帳號名
                    </label>
                    <div className="text-lg font-semibold text-gray-900">
                      {selectedAccount.username}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      密碼
                    </label>
                    <div className="font-mono text-gray-600 bg-gray-50 p-3 rounded-md">
                      {selectedAccount.password}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      角色
                    </label>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
                      {selectedAccount.role === 'member' ? '會員' : selectedAccount.role}
                    </span>
                  </div>



                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        創建時間
                      </label>
                      <div className="text-gray-600">
                        {formatDate(selectedAccount.createdAt)}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        最後登錄
                      </label>
                      <div className="text-gray-600">
                        {formatDate(selectedAccount.lastLogin || '')}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        </div>
      </div>

      {/* 添加帳戶弹窗 */}
      <AddAccountModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleAddSuccess}
        defaultRole="member"
      />
      
      <DeleteAccountModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onSuccess={handleDeleteSuccess}
        account={accountToDelete}
        currentRole="member"
      />
      
      <EditAccountModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={handleEditSuccess}
        account={accountToEdit}
        currentRole="member"
      />
    </div>
  );
} 