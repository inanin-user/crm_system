'use client'

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { withBasePath } from "@/lib/basePath";

interface AttendanceRecord {
  _id: string;
  name: string;
  contactInfo: string;
  location: string;
  activity: string;
  createdAt: string;
}

interface PersonSummary {
  name: string;
  contactInfo: string;
  count: number;
  records: AttendanceRecord[];
  // 新增會員相關信息
  memberInfo?: {
    _id: string;
    role: string;
    memberName: string;
    joinDate: string;
    initialTickets: number;
    addedTickets: number;
    usedTickets: number;
    quota: number;
  };
}

export default function AttendanceByNamePage() {
  const router = useRouter();
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [personSummaries, setPersonSummaries] = useState<PersonSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  interface Member {
    _id: string;
    name?: string;
    memberName?: string;
    role: string;
    email?: string;
    phone?: string;
    joinDate?: string;
    createdAt?: string;
    initialTickets?: number;
    addedTickets?: number;
    usedTickets?: number;
    quota?: number;
  }
  const [members, setMembers] = useState<Member[]>([]);
  const [, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // 獲取會員列表 - 使用 useCallback 優化
  const fetchMembers = useCallback(async () => {
    try {
      const response = await fetch(withBasePath('/api/accounts?role=member'));
      const data = await response.json();
      if (response.ok && data.success) {
        setMembers(data.data);
        console.log(`加載了 ${data.data.length} 個會員資料`);

        // 統計會員類別
        const memberStats = data.data.reduce((acc: Record<string, number>, member: Member) => {
          acc[member.role] = (acc[member.role] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        console.log('會員類別統計:', memberStats);
      }
    } catch (error) {
      console.error('獲取會員列表失敗:', error);
    }
  }, []);

  const fetchAttendanceRecords = useCallback(async () => {
    try {
      // 獲取所有記錄（使用更大的limit）
      const response = await fetch(withBasePath('/api/attendance/accessible?limit=5000'));
      const data = await response.json();
      if (response.ok && data.success) {
        setAttendanceRecords(data.data);
        console.log(`加載了 ${data.data.length} 條出席記錄`);

        // 顯示詳細統計
        const uniqueNames = new Set(data.data.map((r: AttendanceRecord) => r.name));
        console.log(`獨特參與者: ${uniqueNames.size} 人`);
        
        // 如果用户是教练且没有地区權限，顯示提示信息
        if (data.data.length === 0 && data.message) {
          console.info(data.message);
        }

        // 顯示分頁信息
        if (data.pagination) {
          console.log(`總記錄數: ${data.pagination.total}, 當前頁: ${data.pagination.page}/${data.pagination.pages}`);
          if (data.pagination.total > data.data.length) {
            console.warn(`警告: 只加載了 ${data.data.length}/${data.pagination.total} 條記錄`);
          }
        }
      } else {
        console.error('獲取資料失敗:', data.message || data.error);
        if (response.status === 403) {
          alert('您沒有權限查看出席記錄');
        }
      }
    } catch (error) {
      console.error('獲取資料失敗:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // 初始化和自動刷新
  useEffect(() => {
    fetchAttendanceRecords();
    fetchMembers();

    // 設置自動刷新（每30秒刷新一次）
    const interval = setInterval(() => {
      fetchAttendanceRecords();
      fetchMembers();
      setLastRefresh(new Date());
    }, 30000); // 30秒

    setRefreshInterval(interval);

    // 清理函数
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [fetchAttendanceRecords, fetchMembers]);

  // 當會員數據和出席記錄都加載完成時，處理參與者摘要
  useEffect(() => {
    if (attendanceRecords.length >= 0 && members.length >= 0) {
      processPersonSummaries(attendanceRecords);
    }
  }, [attendanceRecords, members]);

  // 創建會員查找表 - 移到組件頂層
  const memberLookup = useMemo(() => {
    const lookup = new Map<string, Member>();
    members.forEach(member => {
      if (member.memberName) lookup.set(member.memberName, member);
      if (member.phone) lookup.set(member.phone, member);
      if (member.email) lookup.set(member.email, member);
    });
    return lookup;
  }, [members]);

  const processPersonSummaries = useCallback((records: AttendanceRecord[]) => {
    const personMap = new Map<string, PersonSummary>();

    records.forEach(record => {
      const key = record.name.trim().toLowerCase();
      if (personMap.has(key)) {
        const existing = personMap.get(key)!;
        existing.count += 1;
        existing.records.push(record);
      } else {
        personMap.set(key, {
          name: record.name,
          contactInfo: record.contactInfo,
          count: 1,
          records: [record]
        });
      }
    });

    const summaries = Array.from(personMap.values()).map(person => {
      // 使用查找表快速找到會員信息
      const member = memberLookup.get(person.name) ||
                    memberLookup.get(person.contactInfo);

      if (member) {
        person.memberInfo = {
          _id: member._id,
          role: member.role,
          memberName: member.memberName || member.name || '',
          joinDate: member.joinDate || member.createdAt || new Date().toISOString(),
          initialTickets: member.initialTickets || 0,
          addedTickets: member.addedTickets || 0,
          usedTickets: member.usedTickets || 0,
          quota: member.quota || 0
        };
      }

      return person;
    }).sort((a, b) => b.count - a.count); // 按参与次数降序排序

    setPersonSummaries(summaries);
  }, [memberLookup]);

  // 優化搜索結果的計算
  const filteredPersons = useMemo(() => {
    if (!searchTerm.trim()) return personSummaries;
    const searchLower = searchTerm.toLowerCase();
    return personSummaries.filter(person =>
      person.name.toLowerCase().includes(searchLower) ||
      person.contactInfo.toLowerCase().includes(searchLower)
    );
  }, [personSummaries, searchTerm]);

  // 手動刷新數據
  const handleManualRefresh = async () => {
    setLoading(true);
    await Promise.all([fetchAttendanceRecords(), fetchMembers()]);
    setLastRefresh(new Date());
    setLoading(false);
  };

  // 判斷是否為本月加入
  const isJoinedThisMonth = (joinDate: string) => {
    if (!joinDate) return false;
    const join = new Date(joinDate);
    const now = new Date();
    return join.getFullYear() === now.getFullYear() && join.getMonth() === now.getMonth();
  };

  // 獲取會員類別顯示文字
  const getMemberTypeDisplay = (role: string) => {
    switch (role) {
      case 'regular-member': return '會員-普通會員';
      case 'premium-member': return '會員-星級會員';
      default: return '非會員';
    }
  };

  const handlePersonClick = (person: PersonSummary) => {
    // 使用姓名作为ID（URL编码）
    const personId = encodeURIComponent(person.name);
    router.push(`/attendance/person/${personId}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      {/* 頁面標題和搜索框 */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            👨‍🏫 按教練分類
          </h1>
          <p className="text-gray-600">
            查看所有參與者的出席統計，包括會員類別、套票信息和本月加入狀態
          </p>
        </div>
        
        {/* 右上角操作區域 */}
        <div className="flex items-center space-x-4">
          {/* 刷新按鈕和狀態 */}
          <div className="flex flex-col items-end space-y-2">
            <button
              onClick={handleManualRefresh}
              disabled={loading}
              className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <svg className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {loading ? '刷新中...' : '刷新數據'}
            </button>
            <div className="text-xs text-gray-500">
              上次更新: {lastRefresh.toLocaleTimeString('zh-TW')}
            </div>
            <div className="text-xs text-green-600">
              自動刷新: 30秒/次
            </div>
          </div>

          {/* 搜索框 */}
          <div className="relative">
            <input
            type="text"
            placeholder="搜索姓名或聯絡方式..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setSearchTerm('');
                e.currentTarget.blur();
              }
            }}
            className="w-64 px-4 py-2 pl-10 pr-10 text-sm border border-gray-300 rounded-full bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all hover:shadow-md"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          {/* 搜索結果提示 */}
          {searchTerm && (
            <div className="absolute top-full mt-2 right-0 bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-xs text-gray-600 whitespace-nowrap z-10">
              找到 <span className="font-semibold text-blue-600">{filteredPersons.length}</span> 位參與者
            </div>
          )}
          </div>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="bg-blue-50 p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">總參與人數</h3>
          <p className="text-3xl font-bold text-blue-600">
            {personSummaries.length} 人
          </p>
          <div className="text-sm text-blue-600 mt-2">
            會員: {personSummaries.filter(p => p.memberInfo).length} 人
          </div>
        </div>
        <div className="bg-green-50 p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-green-800 mb-2">總出席次數</h3>
          <p className="text-3xl font-bold text-green-600">
            {attendanceRecords.length} 次
          </p>
          <div className="text-sm text-green-600 mt-2">
            本月新會員: {personSummaries.filter(p => p.memberInfo && isJoinedThisMonth(p.memberInfo.joinDate)).length} 人
          </div>
        </div>
      </div>

      {/* 人員列表 */}
      <div className="bg-white rounded-lg shadow-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">
            參與者列表 ({filteredPersons.length} 人)
            {searchTerm && personSummaries.length !== filteredPersons.length && (
              <span className="text-sm text-gray-500 ml-2">
                (總共 {personSummaries.length} 人)
              </span>
            )}
          </h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  姓名
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  聯絡方式
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  參與次數
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  本月加入
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  會員類別
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  套票次數
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  剩余運動班
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPersons.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    {searchTerm ? '未找到符合條件的參與者' : '暫無參與者數據'}
                  </td>
                </tr>
              ) : (
                filteredPersons.map((person) => (
                  <tr key={person.name} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handlePersonClick(person)}
                        className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors cursor-pointer"
                      >
                        {person.name}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{person.contactInfo}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          {person.count} 次
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {person.memberInfo ? (
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            isJoinedThisMonth(person.memberInfo.joinDate)
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {isJoinedThisMonth(person.memberInfo.joinDate) ? '是' : '否'}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">非會員</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {person.memberInfo ? (
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            person.memberInfo.role === 'premium-member'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-orange-100 text-orange-800'
                          }`}>
                            {getMemberTypeDisplay(person.memberInfo.role)}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">非會員</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {person.memberInfo ? (
                          <div className="text-xs space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-gray-600">初始:</span>
                              <span className="font-medium">{person.memberInfo.initialTickets}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-gray-600">添加:</span>
                              <span className="text-green-600 font-medium">+{person.memberInfo.addedTickets}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-gray-600">已用:</span>
                              <span className="text-red-600 font-medium">-{person.memberInfo.usedTickets}</span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">非會員</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {person.memberInfo ? (
                          <div className="flex flex-col items-center">
                            <span className={`inline-flex px-3 py-1 text-sm font-bold rounded-full ${
                              person.memberInfo.quota > 0
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {person.memberInfo.quota}
                            </span>
                            <span className="text-xs text-gray-500 mt-1">
                              {person.memberInfo.initialTickets + person.memberInfo.addedTickets - person.memberInfo.usedTickets === person.memberInfo.quota ? '✓' : '⚠️'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">非會員</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 