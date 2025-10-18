'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useScrollOptimization } from '@/hooks/useScrollOptimization';

interface MemberProfile {
  username: string;
  memberName: string;
  phone: string;
  role: string;
  quota: number;
  initialTickets?: number;
  addedTickets?: number;
  usedTickets?: number;
  trainerIntroducer: string;
  referrer?: string;
  joinDate: string;
  renewalCount: number;
  herbalifePCNumber?: string;
  locations: string[];
}

interface DescriptionItem {
  key: string;
  value: React.ReactNode;
  span?: number;
}

export default function MyProfilePage() {
  const { user } = useAuth();
  useScrollOptimization();

  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // 獲取當前會員資料
  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      setError('');

      const response = await fetch('/api/accounts/current-member', {
        method: 'GET',
        credentials: 'include',
      });

      const result = await response.json();

      if (result.success && result.data) {
        setProfile(result.data);
      } else {
        setError(result.message || '無法獲取個人資料');
      }
    } catch (err) {
      console.error('獲取個人資料錯誤:', err);
      setError('網絡錯誤，請稍後重試');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // 格式化日期
  const formatDate = (dateString: string) => {
    if (!dateString) return '無記錄';
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // 獲取角色顯示名稱
  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'regular-member':
        return '普通會員';
      case 'premium-member':
        return '星級會員';
      case 'member':
        return '會員';
      default:
        return role;
    }
  };

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
            onClick={fetchProfile}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            重試
          </button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <p className="text-yellow-800">找不到個人資料</p>
        </div>
      </div>
    );
  }

  // 構建描述數據
  const descriptionData: DescriptionItem[] = [
    { key: '帳號名', value: profile.username },
    { key: '會員姓名', value: profile.memberName },
    { key: '角色', value: getRoleDisplayName(profile.role) },
    { key: '電話號碼', value: profile.phone },
    {
      key: '剩餘配額',
      value: (
        <span className="text-2xl font-bold text-blue-600">{profile.quota}</span>
      )
    },
    { key: '教練介紹人', value: profile.trainerIntroducer },
    { key: '加入日期', value: formatDate(profile.joinDate) },
    { key: '續卡次數', value: `${profile.renewalCount} 次` },
  ];

  // 添加可選字段
  if (profile.herbalifePCNumber) {
    descriptionData.splice(4, 0, {
      key: '康寶萊PC/會員號碼',
      value: profile.herbalifePCNumber
    });
  }

  if (profile.referrer) {
    descriptionData.push({
      key: '轉介人',
      value: profile.referrer
    });
  }

  if (profile.initialTickets !== undefined) {
    descriptionData.push({
      key: '初始套票',
      value: profile.initialTickets
    });
  }

  if (profile.addedTickets !== undefined) {
    descriptionData.push({
      key: '累計添加套票',
      value: profile.addedTickets
    });
  }

  if (profile.usedTickets !== undefined) {
    descriptionData.push({
      key: '已使用套票',
      value: profile.usedTickets
    });
  }

  if (profile.locations && profile.locations.length > 0) {
    descriptionData.push({
      key: '可訪問地點',
      value: (
        <div className="flex flex-wrap gap-2">
          {profile.locations.map((location, index) => (
            <span
              key={index}
              className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
            >
              {location}
            </span>
          ))}
        </div>
      ),
      span: 2
    });
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 md:py-8">
      {/* 頁面標題 */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">個人資料</h1>
      </div>

      {/* 描述列表 */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-6 md:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {descriptionData.map((item, index) => (
              <div
                key={index}
                className={`
                  ${item.span === 2 ? 'md:col-span-2' : ''}
                  ${item.span === 3 ? 'md:col-span-3' : ''}
                  ${item.span === 4 ? 'md:col-span-4' : ''}
                `}
              >
                <dt className="text-sm font-medium text-gray-500 mb-2">
                  {item.key}
                </dt>
                <dd className="text-base text-gray-900 break-words">
                  {item.value}
                </dd>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
