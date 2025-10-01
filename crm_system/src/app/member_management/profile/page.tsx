'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useScrollOptimization } from '@/hooks/useScrollOptimization';

interface Member {
  _id: string;
  username: string;
  memberName: string;
  phone: string;
  quota: number;
  trainerIntroducer: string;
  renewalCount: number;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}

interface AttendanceRecord {
  _id: string;
  name: string;
  contactInfo: string;
  location: string;
  activity: string;
  status: string;
  createdAt: string;
}

export default function MemberProfilePage() {
  const { user } = useAuth();
  useScrollOptimization();

  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);
  const [isLoadingRecords, setIsLoadingRecords] = useState(false);
  const [newQuota, setNewQuota] = useState('');
  const [isUpdatingQuota, setIsUpdatingQuota] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // 獲取會員列表
  const fetchMembers = async () => {
    try {
      setIsLoadingMembers(true);
      const response = await fetch('/api/accounts?role=member');
      const result = await response.json();
      
      if (result.success) {
        setMembers(result.data);
        // 如果有會員且没有选中的會員，默认选中第一个
        if (result.data.length > 0 && !selectedMember) {
          setSelectedMember(result.data[0]);
          fetchMemberAttendance(result.data[0]);
        }
      } else {
        setError('獲取會員列表失敗');
      }
    } catch (error) {
      setError('網絡錯誤，請重试');
    } finally {
      setIsLoadingMembers(false);
    }
  };

  // 獲取會員出席記錄
  const fetchMemberAttendance = async (member: Member) => {
    try {
      setIsLoadingRecords(true);
      // 通过姓名和联系方式查找出席記錄
      const response = await fetch(`/api/attendance/by-member?name=${encodeURIComponent(member.memberName)}&contact=${encodeURIComponent(member.phone)}`);
      const result = await response.json();
      
      if (result.success) {
        setAttendanceRecords(result.data);
      } else {
        setAttendanceRecords([]);
      }
    } catch (error) {
      setAttendanceRecords([]);
    } finally {
      setIsLoadingRecords(false);
    }
  };

  // 選擇會員
  const handleSelectMember = (member: Member) => {
    setSelectedMember(member);
    setNewQuota(member.quota.toString());
    fetchMemberAttendance(member);
    setError('');
    setSuccessMessage('');
  };

  // 更新配额
  const handleUpdateQuota = async () => {
    if (!selectedMember) return;
    
    const quotaValue = parseInt(newQuota);
    if (isNaN(quotaValue) || quotaValue < 0) {
      setError('請輸入有效的配额数值（不能为负数）');
      return;
    }

    try {
      setIsUpdatingQuota(true);
      console.log('開始更新配額...', {
        memberId: selectedMember._id,
        memberName: selectedMember.memberName,
        quotaValue
      });

      const response = await fetch(`/api/accounts/${selectedMember._id}/quota`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ quota: quotaValue }),
      });

      console.log('響應狀態:', response.status);
      const result = await response.json();
      console.log('響應結果:', result);

      if (result.success) {
        // 更新本地状态
        const updatedMember = {
          ...selectedMember,
          quota: quotaValue,
          renewalCount: (selectedMember.renewalCount || 0) + 1
        };
        setSelectedMember(updatedMember);
        setMembers(members.map(m => m._id === selectedMember._id ? updatedMember : m));
        setSuccessMessage('配额更新成功');
        setError('');
      } else {
        console.error('API返回錯誤:', result);
        setError(result.message || '更新配额失敗');
        if (result.error) {
          console.error('詳細錯誤:', result.error);
        }
      }
    } catch (error) {
      console.error('網絡錯誤:', error);
      setError('網絡錯誤，請重试');
    } finally {
      setIsUpdatingQuota(false);
    }
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    if (!dateString) return '无記錄';
    return new Date(dateString).toLocaleString('zh-CN');
  };

  // 格式化日期（仅日期）
  const formatDateOnly = (dateString: string) => {
    if (!dateString) return '无記錄';
    return new Date(dateString).toLocaleDateString('zh-CN');
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  // 清除消息
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  return (
    <div className="max-w-7xl mx-auto">
      {/* 頁面標題 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">續卡管理</h1>
        <p className="mt-2 text-gray-600">查看和管理會員續卡、配額以及出席記錄</p>
      </div>

      {/* 錯誤和成功提示 */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
      
      {successMessage && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
          <p className="text-sm text-green-600">{successMessage}</p>
        </div>
      )}

      {/* 主要内容区域 */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="flex h-auto min-h-96">
          {/* 左侧 - 會員列表 */}
          <div className="w-1/3 border-r border-gray-200">
            <div className="p-4 bg-gray-50 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">會員列表</h2>
              <p className="text-sm text-gray-600">共 {members.length} 位會員</p>
            </div>
            
            <div className="overflow-y-auto max-h-96">
              {isLoadingMembers ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : members.length === 0 ? (
                <div className="flex items-center justify-center h-32 text-gray-500">
                  暫無會員資料
                </div>
              ) : (
                <div className="space-y-1 p-2">
                  {members.map((member) => (
                    <button
                      key={member._id}
                      onClick={() => handleSelectMember(member)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        selectedMember?._id === member._id
                          ? 'bg-blue-50 border border-blue-200 text-blue-900'
                          : 'hover:bg-gray-50 border border-transparent'
                      }`}
                    >
                      <div className="font-medium">{member.memberName}</div>
                      <div className="text-sm text-gray-500">
                        配額: {member.quota} · 續卡: {member.renewalCount || 0}次 · {member.isActive ? '活躍' : '已禁用'}
                      </div>
                      <div className="text-xs text-gray-400">{member.phone}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 右侧 - 會員詳情和配额管理 */}
          <div className="flex-1 flex flex-col">
            {!selectedMember ? (
              <div className="flex items-center justify-center h-96 text-gray-500">
                請從左側選擇一位會員
              </div>
            ) : (
              <>
                {/* 會員基本信息 */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex justify-between items-start mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">{selectedMember.memberName}</h2>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      selectedMember.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedMember.isActive ? '活躍' : '已禁用'}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        電話號碼
                      </label>
                      <div className="text-gray-900">{selectedMember.phone}</div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        教練介紹人
                      </label>
                      <div className="text-gray-900">{selectedMember.trainerIntroducer}</div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        帳號名
                      </label>
                      <div className="text-gray-900">{selectedMember.username}</div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        續卡次數
                      </label>
                      <div className="text-gray-900">{selectedMember.renewalCount || 0} 次</div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        加入時間
                      </label>
                      <div className="text-gray-900">{formatDateOnly(selectedMember.createdAt)}</div>
                    </div>
                  </div>

                  {/* 配额管理 */}
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">配額管理</h3>
                        <p className="text-sm text-gray-600">當前剩餘配額: <span className="font-semibold text-blue-600">{selectedMember.quota}</span></p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <input
                        type="number"
                        min="0"
                        value={newQuota}
                        onChange={(e) => setNewQuota(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="輸入新的配額數量"
                      />
                      <button
                        onClick={handleUpdateQuota}
                        disabled={isUpdatingQuota || newQuota === selectedMember.quota.toString()}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md font-medium transition-colors"
                      >
                        {isUpdatingQuota ? '更新中...' : '更新配額'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* 出席記錄 */}
                <div className="flex-1 p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">出席記錄</h3>
                    <span className="text-sm text-gray-600">共 {attendanceRecords.length} 條記錄</span>
                  </div>
                  
                  <div className="overflow-y-auto max-h-64">
                    {isLoadingRecords ? (
                      <div className="flex items-center justify-center h-32">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      </div>
                    ) : attendanceRecords.length === 0 ? (
                      <div className="flex items-center justify-center h-32 text-gray-500">
                        暫無出席記錄
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {attendanceRecords.map((record) => (
                          <div key={record._id} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex justify-between items-start mb-2">
                              <div className="font-medium text-gray-900">{record.activity}</div>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                record.status === '出席' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {record.status}
                              </span>
                            </div>
                            <div className="text-sm text-gray-600 space-y-1">
                              <div>地點: {record.location}</div>
                              <div>聯絡方式: {record.contactInfo}</div>
                              <div>時間: {formatDate(record.createdAt)}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 