'use client';

interface AuthLoadingScreenProps {
  message?: string;
}

export default function AuthLoadingScreen({ message = '正在驗證身份...' }: AuthLoadingScreenProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md mx-auto px-4">
        {/* 主要加載動畫 */}
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 mx-auto"></div>
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent absolute top-0 left-1/2 transform -translate-x-1/2"></div>
        </div>
        
        {/* 消息文本 */}
        <p className="mt-6 text-lg text-gray-700 font-medium">{message}</p>
        
        {/* 二級加載指示 */}
        <div className="mt-4 flex justify-center space-x-1">
          <div className="animate-pulse bg-blue-600 rounded-full h-2 w-2"></div>
          <div className="animate-pulse bg-blue-600 rounded-full h-2 w-2 animation-delay-200"></div>
          <div className="animate-pulse bg-blue-600 rounded-full h-2 w-2 animation-delay-400"></div>
        </div>
        
        {/* 品牌信息 */}
        <div className="mt-8 text-center">
          <h3 className="text-xl font-bold text-gray-800">CRM 管理系統</h3>
          <p className="text-sm text-gray-500 mt-1">安全驗證中</p>
        </div>
      </div>
      
      <style jsx>{`
        .animation-delay-200 {
          animation-delay: 0.2s;
        }
        .animation-delay-400 {
          animation-delay: 0.4s;
        }
      `}</style>
    </div>
  );
}