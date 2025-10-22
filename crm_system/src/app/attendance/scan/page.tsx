'use client'

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import QrScanner from 'qr-scanner';

interface QrData {
  type: string;
  activityId: string;
  activityName: string;
  location: string;
  trainerId: string;
  trainerName: string;
  startTime: string;
  endTime: string;
  duration: number;
  generatedAt: string;
  generatedBy: string;
}

interface ProductQrData {
  number: string;
  regionCode: string;
  regionName: string;
  productDescription: string;
  price: number;
  timestamp: string;
  formattedDisplay?: {
    line1: string;
    line2: string;
  };
}

interface Member {
  _id: string;
  username: string;
  memberName: string;
  phone: string;
  email: string;
  quota: number;
  isActive: boolean;
}

export default function ScanAttendancePage() {
  const router = useRouter();
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const qrScannerRef = useRef<QrScanner | null>(null);


  // 状态管理
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<QrData | null>(null);
  const [productScanResult, setProductScanResult] = useState<ProductQrData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [memberInfo, setMemberInfo] = useState<Member | null>(null);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // 檢查用戶權限
  useEffect(() => {
    if (user && !['member', 'regular-member', 'premium-member', 'trainer'].includes(user.role)) {
      router.push('/unauthorized');
    }
  }, [user, router]);

  // 初始化掃描器
  useEffect(() => {
    return () => {
      // 清理掃描器
      if (qrScannerRef.current) {
        qrScannerRef.current.destroy();
      }
    };
  }, []);

  // 獲取會員信息
  const fetchMemberInfo = async () => {
    if (!user) return;
    
    try {
      const response = await fetch('/api/accounts/current-member');
      const result = await response.json();
      
      if (result.success && result.data) {
        setMemberInfo(result.data);
        return result.data;
      } else {
        setError('無法獲取會員資料，請聯絡管理員');
        console.error('獲取會員資料失敗:', result);
        return null;
      }
    } catch (error) {
      console.error('獲取會員資料時發生錯誤:', error);
      setError('獲取會員資料時發生錯誤');
      return null;
    }
  };

  // 開始掃描
  const startScanning = async () => {
    try {
      setError('');
      setSuccess('');
      setIsScanning(true);

      if (!videoRef.current) {
        throw new Error('視頻元素未初始化');
      }

      // 創建 QR 掃描器
      qrScannerRef.current = new QrScanner(
        videoRef.current,
        async (result) => {
          try {
            // 嘗試解析為 JSON
            const parsedData = JSON.parse(result.data);

            // 檢查是否為簽到二維碼
            if (parsedData.type === 'attendance_checkin') {
              // 檢查二維碼是否過期 (例如：24小時內有效)
              const generatedTime = new Date(parsedData.generatedAt).getTime();
              const now = new Date().getTime();
              const hoursDiff = (now - generatedTime) / (1000 * 60 * 60);

              if (hoursDiff > 24) {
                setError('二維碼已過期，請要求管理員生成新的二維碼');
                return;
              }

              setScanResult(parsedData as QrData);
              stopScanning();
              return;
            }

            // 檢查是否為產品二維碼
            if (parsedData.number && parsedData.regionCode && parsedData.productDescription) {
              // 調用API獲取產品信息
              try {
                const response = await fetch('/api/qrcode/scan', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ qrCodeData: result.data }),
                });

                if (response.ok) {
                  const data = await response.json();
                  if (data.success) {
                    setProductScanResult(data.data);
                    stopScanning();
                    return;
                  }
                }
              } catch (apiError) {
                console.error('API調用失敗:', apiError);
              }

              // 如果API調用失敗，直接顯示解析的數據
              setProductScanResult(parsedData as ProductQrData);
              stopScanning();
              return;
            }

            setError('無效的二維碼類型');

          } catch {
            setError('無法解析二維碼內容');
          }
        },
        {
          highlightScanRegion: true,
          highlightCodeOutline: true,
          preferredCamera: 'environment', // 使用後置攝像頭
        }
      );

      await qrScannerRef.current.start();
      
    } catch (err) {
      console.error('啟動掃描失敗:', err);
      setError('無法啟動相機，請確保已授權相機權限');
      setIsScanning(false);
    }
  };

  // 停止掃描
  const stopScanning = () => {
    if (qrScannerRef.current) {
      qrScannerRef.current.stop();
    }
    setIsScanning(false);
  };

  // 提交簽到
  const handleSubmit = async () => {
    if (!scanResult || !user) return;

    setIsSubmitting(true);
    setError('');

    try {
      // 獲取會員信息
      const member = await fetchMemberInfo();
      if (!member) {
        return;
      }

      // 檢查配額
      if (!member.isActive) {
        throw new Error('您的帳戶已被禁用，無法簽到');
      }

      if (member.quota <= 0) {
        throw new Error('您的配額不足，無法參加活動');
      }

      // 提交簽到記錄
      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: member.memberName,
          contactInfo: member.phone || member.email,
          location: scanResult.location,
          activity: scanResult.activityName,
          activityId: scanResult.activityId,
          memberId: member._id
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(`✅ 簽到成功！歡迎參加 ${scanResult.activityName}`);
        setScanResult(null);
        setMemberInfo(null);
        
        // 3秒後自動關閉成功信息
        setTimeout(() => {
          setSuccess('');
        }, 3000);
        
      } else {
        throw new Error(data.error || '簽到失敗');
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '簽到時發生未知錯誤';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 處理產品二維碼扣款
  const handleProductPayment = async () => {
    if (!productScanResult || !user) return;

    setIsProcessingPayment(true);
    setError('');
    setSuccess('');

    try {
      // 先獲取會員信息
      const member = await fetchMemberInfo();
      if (!member) {
        setError('無法獲取會員資料，請聯絡管理員');
        return;
      }

      // 檢查會員狀態
      if (!member.isActive) {
        setError('您的帳戶已被禁用，無法進行交易');
        return;
      }

      // 檢查配額是否足夠
      if (member.quota < productScanResult.price) {
        setError(`餘額不足！您的剩餘配額為 ${member.quota}，需要 ${productScanResult.price}`);
        return;
      }

      // 構建二維碼數據
      const qrCodeData = JSON.stringify({
        number: productScanResult.number,
        regionCode: productScanResult.regionCode,
        regionName: productScanResult.regionName,
        productDescription: productScanResult.productDescription,
        price: productScanResult.price,
        timestamp: productScanResult.timestamp
      });

      // 調用扣款 API
      const response = await fetch('/api/qrcode/deduct', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ qrCodeData }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // 扣款成功
        setSuccess(
          `✅ 扣款成功！已扣除 ${result.data.transaction.deductedAmount} 配額，` +
          `剩餘配額: ${result.data.transaction.newQuota}`
        );
        
        // 清空產品掃描結果
        setProductScanResult(null);
        setMemberInfo(null);
        
        // 3秒後跳轉到個人資料頁面
        setTimeout(() => {
          setSuccess('');
          router.push('/member_management/my_profile');
        }, 3000);
        
      } else {
        // 扣款失敗
        if (result.message === '餘額不足') {
          setError(
            `餘額不足！您的剩餘配額為 ${result.data?.currentQuota || 0}，` +
            `需要 ${result.data?.requiredAmount || productScanResult.price}`
          );
        } else {
          setError(result.message || '扣款失敗，請稍後重試');
        }
      }
      
    } catch (err) {
      console.error('處理扣款時發生錯誤:', err);
      setError('處理扣款時發生錯誤，請稍後重試');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // 重置狀態
  const resetScan = () => {
    setScanResult(null);
    setProductScanResult(null);
    setError('');
    setSuccess('');
    setMemberInfo(null);
    setIsProcessingPayment(false);
  };

  if (!user || !['member', 'regular-member', 'premium-member', 'trainer'].includes(user.role)) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">權限不足</h1>
          <p className="text-gray-600">只有會員和教練可以使用掃描功能</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 sm:px-0">
      {/* 返回按鈕和頁面標題 */}
      <div className="flex items-center mb-6">
        <button
          onClick={() => router.push('/attendance')}
          className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors mr-4"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          返回
        </button>
        <div className="flex-1">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">掃描簽到</h1>
          <p className="text-gray-600 mt-1 text-sm md:text-base">掃描二維碼快速簽到</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
        {/* 錯誤信息 */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center text-red-800">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          </div>
        )}

        {/* 成功信息 */}
        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center text-green-800">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {success}
            </div>
          </div>
        )}

        {/* 掃描區域 */}
        {!scanResult && !productScanResult && (
          <div className="text-center">
            <div className="relative mb-4">
              <video
                ref={videoRef}
                className={`w-full h-64 object-cover rounded-lg border-2 border-dashed border-gray-300 ${
                  isScanning ? 'block' : 'hidden'
                }`}
                playsInline
                muted
              />
              
              {!isScanning && (
                <div className="w-full h-64 flex items-center justify-center bg-gray-100 rounded-lg border-2 border-dashed border-gray-300">
                  <div className="text-center">
                    <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 16h4.01M12 8h4.01" />
                    </svg>
                    <p className="text-gray-600">點擊下方按鈕開始掃描</p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3">
              {!isScanning ? (
                <button
                  onClick={startScanning}
                  className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  開始掃描二維碼
                </button>
              ) : (
                <button
                  onClick={stopScanning}
                  className="w-full px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
                >
                  停止掃描
                </button>
              )}
            </div>

            <div className="mt-4 text-sm text-gray-600">
              <p>• 請對準簽到二維碼</p>
              <p>• 確保光線充足</p>
              <p>• 保持相機穩定</p>
            </div>
          </div>
        )}

        {/* 掃描結果確認 */}
        {scanResult && (
          <div>
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="text-lg font-semibold text-green-800 mb-2">掃描成功！</h3>
              <div className="space-y-2 text-sm text-green-700">
                <p><strong>活動:</strong> {scanResult.activityName}</p>
                <p><strong>地點:</strong> {scanResult.location}</p>
                <p><strong>教練:</strong> {scanResult.trainerName}</p>
                <p><strong>時間:</strong> {new Date(scanResult.startTime).toLocaleString('zh-TW')}</p>
              </div>
            </div>

            {memberInfo && (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="text-sm font-semibold text-blue-800 mb-2">會員資料</h3>
                <div className="space-y-1 text-sm text-blue-700">
                  <p><strong>姓名:</strong> {memberInfo.memberName}</p>
                  <p><strong>剩餘配額:</strong> {memberInfo.quota}</p>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={resetScan}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
              >
                重新掃描
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors flex items-center justify-center"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    簽到中...
                  </>
                ) : (
                  '確認簽到'
                )}
              </button>
            </div>
          </div>
        )}

        {/* 產品二維碼顯示 */}
        {productScanResult && (
          <div>
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-800 mb-2">確認信息</h3>
              <div className="space-y-2 text-sm text-blue-700">
                <p><strong>編號:</strong> {productScanResult.number}</p>
                <p><strong>地區:</strong> {
                  typeof productScanResult.formattedDisplay !== 'undefined'
                    ? (productScanResult.formattedDisplay.line1.replace('地區：', '') || productScanResult.regionName || productScanResult.regionCode)
                    : (productScanResult.regionName || productScanResult.regionCode)
                }</p>
                <p><strong>產品信息:</strong> {
                  typeof productScanResult.formattedDisplay !== 'undefined'
                    ? productScanResult.formattedDisplay.line2
                    : `${productScanResult.productDescription}：$${productScanResult.price}`
                }</p>
                {productScanResult.timestamp && (
                  <p><strong>生成時間:</strong> {new Date(productScanResult.timestamp).toLocaleString('zh-TW')}</p>
                )}
              </div>
            </div>

            {/* 只有會員才顯示扣款按鈕 */}
            {['member', 'regular-member', 'premium-member'].includes(user?.role || '') && (
              <>
                {memberInfo && (
                  <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h3 className="text-sm font-semibold text-green-800 mb-2">會員資料</h3>
                    <div className="space-y-1 text-sm text-green-700">
                      <p><strong>姓名:</strong> {memberInfo.memberName}</p>
                      <p><strong>當前剩餘配額:</strong> <span className="text-lg font-bold">{memberInfo.quota}</span></p>
                      <p><strong>本次消費:</strong> <span className="text-lg font-bold text-red-600">{productScanResult.price}</span></p>
                      {memberInfo.quota >= productScanResult.price ? (
                        <p><strong>扣款後剩餘:</strong> <span className="text-lg font-bold text-blue-600">{memberInfo.quota - productScanResult.price}</span></p>
                      ) : (
                        <p className="text-red-600 font-bold">⚠️ 配額不足，無法完成交易</p>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={resetScan}
                    disabled={isProcessingPayment}
                    className="flex-1 px-4 py-2 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 text-white font-medium rounded-lg transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={async () => {
                      // 如果還沒有獲取會員信息，先獲取
                      if (!memberInfo) {
                        await fetchMemberInfo();
                      }
                      handleProductPayment();
                    }}
                    disabled={isProcessingPayment}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors flex items-center justify-center"
                  >
                    {isProcessingPayment ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        處理中...
                      </>
                    ) : (
                      '確認扣款'
                    )}
                  </button>
                </div>
              </>
            )}

            {/* 教練只能查看，不能扣款 */}
            {user?.role === 'trainer' && (
              <div className="flex justify-center">
                <button
                  onClick={resetScan}
                  className="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
                >
                  關閉
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}