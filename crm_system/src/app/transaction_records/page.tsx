'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

interface TransactionRecord {
  _id: string;
  productDescription: string;
  region: string;
  quotaUsed: number;
  transactionDate: string;
  qrCodeNumber: string;
  previousQuota: number;
  newQuota: number;
}

export default function TransactionRecordsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [records, setRecords] = useState<TransactionRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<TransactionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // 檢查用戶權限
  useEffect(() => {
    if (user && !['member', 'regular-member', 'premium-member'].includes(user.role)) {
      router.push('/unauthorized');
    }
  }, [user, router]);

  // 獲取交易記錄
  const fetchRecords = async () => {
    try {
      setIsLoading(true);
      setError('');

      const response = await fetch('/api/transactions', {
        method: 'GET',
        credentials: 'include',
      });

      const result = await response.json();

      if (result.success && result.data) {
        setRecords(result.data);
        setFilteredRecords(result.data);
      } else {
        setError(result.message || '無法獲取交易記錄');
      }
    } catch (err) {
      console.error('獲取交易記錄錯誤:', err);
      setError('網絡錯誤，請稍後重試');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchRecords();
    }
  }, [user]);

  // 搜索過濾
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredRecords(records);
    } else {
      const lowercaseSearch = searchTerm.toLowerCase();
      const filtered = records.filter((record) =>
        record.productDescription.toLowerCase().includes(lowercaseSearch) ||
        record.region.toLowerCase().includes(lowercaseSearch) ||
        record.quotaUsed.toString().includes(lowercaseSearch) ||
        formatDate(record.transactionDate).toLowerCase().includes(lowercaseSearch) ||
        record.qrCodeNumber.toLowerCase().includes(lowercaseSearch)
      );
      setFilteredRecords(filtered);
    }
  }, [searchTerm, records]);

  // 格式化日期（只顯示年月日）
  const formatDate = (dateString: string) => {
    if (!dateString) return '無記錄';
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).replace(/\//g, '/'); // 格式：YYYY/MM/DD
  };

  if (!user || !['member', 'regular-member', 'premium-member'].includes(user.role)) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">權限不足</h1>
          <p className="text-gray-600">只有會員可以查看交易記錄</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">載入中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <svg className="w-6 h-6 text-red-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="text-lg font-medium text-red-900">載入失敗</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
          <button
            onClick={fetchRecords}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            重試
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 md:py-8">
      {/* 頁面標題和搜索欄 */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">記錄</h1>
          </div>
          
          {/* 搜索欄 */}
          <div className="relative w-full md:w-96">
            <input
              type="text"
              placeholder="搜索項目、地區、配額或日期..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <svg
              className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* 交易記錄表格 */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {filteredRecords.length === 0 ? (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className="mt-4 text-gray-600">
              {searchTerm ? '沒有找到匹配的記錄' : '暫無交易記錄'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    項目名稱
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    地區
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    使用配額
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    日期
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRecords.map((record) => (
                  <tr key={record._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {record.productDescription}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {record.region}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {record.quotaUsed}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(record.transactionDate)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 底部提示 */}
      {filteredRecords.length > 0 && (
        <div className="mt-4 text-sm text-gray-500 text-center">
          顯示 {filteredRecords.length} 條記錄，共 {records.length} 條
        </div>
      )}
    </div>
  );
}

