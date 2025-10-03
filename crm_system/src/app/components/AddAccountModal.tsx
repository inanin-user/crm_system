'use client';

import { useState, useEffect } from 'react';
import CustomSelect from '@/app/components/CustomSelect';

interface AddAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultRole: string;
}

export default function AddAccountModal({ isOpen, onClose, onSuccess, defaultRole }: AddAccountModalProps) {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: defaultRole === 'member' ? 'regular-member' : defaultRole,
    // 會員专用字段
    memberName: '',
    phone: '',
    herbalifePCNumber: '',
    joinDate: '',
    trainerIntroducer: '',
    referrer: '',
    quota: 0
  });
  const [trainers, setTrainers] = useState<{_id: string, username: string}[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // 獲取教练列表
  useEffect(() => {
    const fetchTrainers = async () => {
      try {
        const response = await fetch('/api/accounts?role=trainer');
        const result = await response.json();
        if (result.success) {
          setTrainers(result.data);
        }
      } catch (error) {
        console.error('獲取教练列表失敗:', error);
      }
    };

    if (isOpen && ['member', 'regular-member', 'premium-member'].includes(defaultRole)) {
      fetchTrainers();
    }
  }, [isOpen, defaultRole]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // 为會員角色准备完整的資料
      const submitData = ['member', 'regular-member', 'premium-member'].includes(defaultRole) ? formData : {
        username: formData.username,
        password: formData.password,
        role: formData.role
      };

      const response = await fetch('/api/accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      const result = await response.json();

      if (result.success) {
        setFormData({ 
          username: '', 
          password: '', 
          role: defaultRole === 'member' ? 'regular-member' : defaultRole,
          memberName: '',
          phone: '',
          herbalifePCNumber: '',
          joinDate: '',
          trainerIntroducer: '',
          referrer: '',
          quota: 0
        });
        onSuccess();
        onClose();
      } else {
        setError(result.message || '添加帳戶失敗');
      }
    } catch (error) {
      setError('網絡錯誤，請重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({ 
      username: '', 
      password: '', 
      role: defaultRole === 'member' ? 'regular-member' : defaultRole,
      memberName: '',
      phone: '',
      herbalifePCNumber: '',
      joinDate: '',
      trainerIntroducer: '',
      referrer: '',
      quota: 0
    });
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  const isMember = ['member', 'regular-member', 'premium-member'].includes(defaultRole);

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-lg shadow-2xl w-full max-h-[90vh] overflow-y-auto ${isMember ? 'max-w-2xl' : 'max-w-md'}`}>
        {/* 標題欄 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">添加新{isMember ? '會員' : '帳戶'}</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 表單內容 */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* 账号名称 - 所有角色都需要 */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
              帳號名稱 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="username"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={isMember ? "請輸入會員帳號名稱" : "請輸入帳號名稱"}
              required
            />
          </div>

          {/* 密码 */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              密碼 <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              id="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="請輸入密碼"
              required
            />
          </div>

          {isMember && (
            <>
              {/* 會員基本信息 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="memberName" className="block text-sm font-medium text-gray-700 mb-2">
                    會員姓名 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="memberName"
                    value={formData.memberName}
                    onChange={(e) => setFormData({ ...formData, memberName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="請輸入會員真實姓名"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                    電話號碼 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="請輸入電話號碼"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="herbalifePCNumber" className="block text-sm font-medium text-gray-700 mb-2">
                    康寶萊PC/會員號碼 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="herbalifePCNumber"
                    value={formData.herbalifePCNumber}
                    onChange={(e) => setFormData({ ...formData, herbalifePCNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="請輸入康寶萊PC/會員號碼"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="joinDate" className="block text-sm font-medium text-gray-700 mb-2">
                    入會日期 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    id="joinDate"
                    value={formData.joinDate}
                    onChange={(e) => setFormData({ ...formData, joinDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="trainerIntroducer" className="block text-sm font-medium text-gray-700 mb-2">
                    教練介紹人 <span className="text-red-500">*</span>
                  </label>
                  <CustomSelect
                    value={formData.trainerIntroducer}
                    onChange={(value) => setFormData({ ...formData, trainerIntroducer: value })}
                    options={[
                      { value: '', label: '請選擇教練介紹人' },
                      ...trainers.map((trainer) => ({
                        value: trainer.username,
                        label: trainer.username,
                      })),
                    ]}
                    placeholder="請選擇教練介紹人"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="referrer" className="block text-sm font-medium text-gray-700 mb-2">
                    轉介人
                  </label>
                  <input
                    type="text"
                    id="referrer"
                    value={formData.referrer}
                    onChange={(e) => setFormData({ ...formData, referrer: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="請輸入轉介人（可選）"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="quota" className="block text-sm font-medium text-gray-700 mb-2">
                  初始配額
                </label>
                <input
                  type="number"
                  id="quota"
                  min="0"
                  value={formData.quota}
                  onChange={(e) => setFormData({ ...formData, quota: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="請輸入初始配額（默認為0）"
                />
                <p className="text-xs text-gray-500 mt-1">
                  會員可用的活動參與次數
                </p>
              </div>
            </>
          )}

          {/* 角色選擇 */}
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
              角色 <span className="text-red-500">*</span>
            </label>
            {isMember ? (
              <CustomSelect
                value={formData.role}
                onChange={(value) => setFormData({ ...formData, role: value })}
                options={[
                  { value: 'regular-member', label: '會員-普通會員' },
                  { value: 'premium-member', label: '會員-星級會員' },
                ]}
                placeholder="請選擇會員類型"
                required
              />
            ) : (
              <input
                type="text"
                id="role"
                value={formData.role === 'trainer' ? '教練' : formData.role === 'admin' ? '管理員' : formData.role}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
              />
            )}
            <p className="text-xs text-gray-500 mt-1">
              {isMember ? '請選擇會員類型' : '角色會根據當前頁面自動設置'}
            </p>
          </div>

          {/* 操作按鈕 */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={isLoading}
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? '添加中...' : '確認添加'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 