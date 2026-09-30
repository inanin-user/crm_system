"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useScrollOptimization } from "@/hooks/useScrollOptimization";
import { withBasePath } from "@/lib/basePath";
import { LocationCode, useLocation } from "@/types/location";
import { useMobileDetection } from "@/hooks/useMobileDetection";

interface Trainer {
  id: string;
  username: string;
  role: string;
  isActive: boolean;
  locations: LocationCode[];
  createdAt: string;
  lastLogin?: string;
}

interface Activity {
  id: string;
  activityName: string;
  startTime: string;
  endTime: string;
  duration: number;
  location: LocationCode;
  participants: string[];
  createdAt: string;
}

interface TrainerProfile {
  id?: string;
  trainerId: string;
  trainerUsername: string;
  otherWorkHours: number;
  notes?: string;
}

export default function TrainerProfilePage() {
  const { user } = useAuth();
  useScrollOptimization();
  const { isMobile } = useMobileDetection();
  const [showDetails, setShowDetails] = useState(!isMobile); // 移动端默认顯示列表，桌面端默认顯示詳情
  const { label } = useLocation();

  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [selectedTrainer, setSelectedTrainer] = useState<Trainer | null>(null);
  const [trainerActivities, setTrainerActivities] = useState<Activity[]>([]);
  const [trainerProfile, setTrainerProfile] = useState<TrainerProfile | null>(
    null,
  );
  const [isLoadingTrainers, setIsLoadingTrainers] = useState(true);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isUpdatingWorkHours, setIsUpdatingWorkHours] = useState(false);
  const [otherWorkHours, setOtherWorkHours] = useState("0");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // 獲取教练列表
  const fetchTrainers = async () => {
    try {
      setIsLoadingTrainers(true);
      const response = await fetch(withBasePath("/api/accounts?role=trainer"));
      const result = await response.json();

      if (result.success) {
        setTrainers(result.data);
        if (result.data.length > 0 && !selectedTrainer) {
          const firstTrainer = result.data[0];
          setSelectedTrainer(firstTrainer);
          fetchTrainerActivities(firstTrainer.id);
          fetchTrainerProfile(firstTrainer.id);
        }
      } else {
        setError("獲取教练列表失敗");
      }
    } catch (error) {
      setError("Server error");
    } finally {
      setIsLoadingTrainers(false);
    }
  };

  // 獲取教练的活动記錄
  const fetchTrainerActivities = async (trainerId: string) => {
    try {
      setIsLoadingActivities(true);
      const response = await fetch(
        withBasePath(`/api/activities/by-trainer?trainerId=${trainerId}`),
      );
      const result = await response.json();
      console.log("fetchTrainerActivities result:", result.data);
      if (result.success) {
        setTrainerActivities(result.data);
      } else {
        setTrainerActivities([]);
      }
    } catch (error) {
      setTrainerActivities([]);
    } finally {
      setIsLoadingActivities(false);
    }
  };

  // 獲取教练档案信息
  const fetchTrainerProfile = async (trainerId: string) => {
    try {
      setIsLoadingProfile(true);
      const response = await fetch(
        withBasePath(`/api/trainer-profile/${trainerId}`),
      );
      const result = await response.json();

      if (result.success && result.data) {
        setTrainerProfile(result.data);
        setOtherWorkHours(result.data.otherWorkHours.toString());
        setNotes(result.data.notes || "");
      } else {
        // 如果没有档案，创建默认值
        setTrainerProfile({
          trainerId,
          trainerUsername: selectedTrainer?.username || "",
          otherWorkHours: 0,
          notes: "",
        });
        setOtherWorkHours("0");
        setNotes("");
      }
    } catch (error) {
      setTrainerProfile({
        trainerId,
        trainerUsername: selectedTrainer?.username || "",
        otherWorkHours: 0,
        notes: "",
      });
      setOtherWorkHours("0");
      setNotes("");
    } finally {
      setIsLoadingProfile(false);
    }
  };

  // 選擇教练
  const handleSelectTrainer = (trainer: Trainer) => {
    setSelectedTrainer(trainer);
    if (isMobile) {
      setShowDetails(true);
    }
    fetchTrainerActivities(trainer.id);
    fetchTrainerProfile(trainer.id);
    setError("");
    setSuccessMessage("");
  };

  // 更新其他工作时间
  const handleUpdateWorkHours = async () => {
    if (!selectedTrainer) return;

    const workHours = parseFloat(otherWorkHours);
    if (isNaN(workHours) || workHours < 0) {
      setError("請輸入有效的工作时间（不能为负数）");
      return;
    }

    try {
      setIsUpdatingWorkHours(true);
      const response = await fetch(
        withBasePath(`/api/trainer-profile/${selectedTrainer.id}`),
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            otherWorkHours: workHours,
            notes: notes.trim(),
            trainerUsername: selectedTrainer.username,
          }),
        },
      );

      const result = await response.json();

      if (result.success) {
        setTrainerProfile(result.data);
        setSuccessMessage("工作时间更新成功");
        setError("");
      } else {
        setError(result.message || "更新工作时间失敗");
      }
    } catch (error) {
      setError("Server error");
    } finally {
      setIsUpdatingWorkHours(false);
    }
  };

  // 计算总带队时间
  const getTotalTeachingHours = () => {
    return trainerActivities.reduce(
      (total, activity) => total + activity.duration,
      0,
    );
  };

  // 计算总工作时间
  const getTotalWorkHours = () => {
    const teachingHours = getTotalTeachingHours();
    const otherHours = trainerProfile?.otherWorkHours || 0;
    return teachingHours + otherHours;
  };

  // Shows up to 2 decimals, but at least 1 (12 → "12.0", 12.5 → "12.5", 12.256 → "12.26")
  const formatHours = (value: unknown): string => {
    const n = Number(value);
    if (!Number.isFinite(n)) return "0.0";
    const s = n.toFixed(2);
    return s.endsWith("0") ? s.slice(0, -1) : s;
  };

  // 格式化时间顯示
  const formatDateTime = (dateString: string) => {
    if (!dateString) return "无时间";
    const date = new Date(dateString);
    return date.toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // 格式化日期顯示
  const formatDateOnly = (dateString: string) => {
    if (!dateString) return "无日期";
    return new Date(dateString).toLocaleDateString("zh-CN");
  };

  useEffect(() => {
    fetchTrainers();
  }, []);

  // 清除消息
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  return (
    <div className="max-w-7xl mx-auto">
      {/* 頁面標題 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">教練資料管理</h1>
        <p className="mt-2 text-gray-600">
          查看和管理教練資料、帶隊記錄以及工作時間
        </p>
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
      {/* 主要内容区域 */}
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        {/* 移动端标题栏 */}
        {isMobile && (
          <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              {showDetails ? "教練詳情" : "教練列表"}
            </h2>
            {showDetails && selectedTrainer && (
              <button
                onClick={() => setShowDetails(false)}
                className="text-gray-600 hover:text-gray-900 flex items-center"
              >
                <svg
                  className="w-5 h-5 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                返回列表
              </button>
            )}
          </div>
        )}

        <div className="flex flex-col lg:flex-row min-h-96">
          {/* 左侧 - 教练列表 */}
          <div
            className={`w-full lg:w-1/3 lg:border-r border-gray-200 ${isMobile ? (showDetails ? "hidden" : "block") : "block"}`}
          >
            {!isMobile && (
              <div className="p-4 bg-gray-50 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  教練列表
                </h2>
                <p className="text-sm text-gray-600">
                  共 {trainers.length} 位教練
                </p>
              </div>
            )}

            <div className="overflow-y-auto max-h-96">
              {isLoadingTrainers ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : trainers.length === 0 ? (
                <div className="flex items-center justify-center h-32 text-gray-500">
                  暫無教練資料
                </div>
              ) : (
                <div className="space-y-1 p-2">
                  {trainers.map((trainer) => (
                    <button
                      key={trainer.id}
                      onClick={() => handleSelectTrainer(trainer)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        selectedTrainer?.id === trainer.id
                          ? "bg-blue-50 border border-blue-200 text-blue-900"
                          : "hover:bg-gray-50 border border-transparent"
                      }`}
                    >
                      <div
                        className={`font-medium ${
                          selectedTrainer?.id === trainer.id
                            ? "text-black"
                            : "text-gray-500"
                        }`}
                      >
                        {trainer.username}
                      </div>

                      <div
                        className={`text-sm ${
                          selectedTrainer?.id === trainer.id
                            ? "text-black"
                            : "text-gray-500"
                        }`}
                      >
                        {trainer.isActive ? "活躍" : "已禁用"} ·{" "}
                        {trainer.locations.join(", ")}
                      </div>

                      <div
                        className={`text-xs ${
                          selectedTrainer?.id === trainer.id
                            ? "text-black"
                            : "text-gray-500"
                        }`}
                      >
                        加入時間: {formatDateOnly(trainer.createdAt)}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 右侧 - 教练詳情和工作时间 */}
          <div
            className={`flex-1 flex flex-col min-w-0 border-t lg:border-t-0 lg:border-l border-gray-200 ${isMobile ? (showDetails ? "flex" : "hidden") : "flex"}`}
          >
            {!selectedTrainer ? (
              <div className="flex items-center justify-center min-h-64 lg:h-96 text-gray-500">
                請從列表中選擇一位教練
              </div>
            ) : (
              <>
                {/* 教练基本信息 */}
                <div className="p-4 sm:p-6 border-b border-gray-200">
                  <div className="flex justify-between items-start gap-3 mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 break-all">
                      {selectedTrainer.username}
                    </h2>
                    <span
                      className={`shrink-0 px-3 py-1 rounded-full text-sm font-medium ${
                        selectedTrainer.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {selectedTrainer.isActive ? "活躍" : "已禁用"}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        教練帳號
                      </label>
                      <div className="text-gray-900 break-all">
                        {selectedTrainer.username}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        授權地區
                      </label>
                      <div className="text-gray-900">
                        {selectedTrainer.locations.join(", ") || "無授權地區"}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        加入時間
                      </label>
                      <div className="text-gray-900">
                        {formatDateOnly(selectedTrainer.createdAt)}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        最後登錄
                      </label>
                      <div className="text-gray-900">
                        {selectedTrainer.lastLogin
                          ? formatDateTime(selectedTrainer.lastLogin)
                          : "從未登錄"}
                      </div>
                    </div>
                  </div>

                  {/* 工作时间统计 */}
                  <div className="mt-6 p-3 sm:p-4 bg-gray-50 rounded-lg">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      工作時間統計
                    </h3>

                    <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-xl sm:text-2xl font-bold text-blue-600">
                          {formatHours(getTotalTeachingHours())}h
                        </div>
                        <div className="text-xs sm:text-sm text-gray-600">
                          帶隊時間
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl sm:text-2xl font-bold text-green-600">
                          {formatHours(trainerProfile?.otherWorkHours || 0)}h
                        </div>
                        <div className="text-xs sm:text-sm text-gray-600">
                          其他工作時間
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl sm:text-2xl font-bold text-purple-600">
                          {formatHours(getTotalWorkHours())}h
                        </div>
                        <div className="text-xs sm:text-sm text-gray-600">
                          總工作時間
                        </div>
                      </div>
                    </div>

                    {/* 其他工作时间編輯 */}
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          其他工作時間 (小時)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.5"
                          value={otherWorkHours}
                          onChange={(e) => setOtherWorkHours(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                          placeholder="輸入其他工作時間"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          備註
                        </label>
                        <textarea
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                          placeholder="輸入工作備註（可選）"
                        />
                      </div>

                      <button
                        onClick={handleUpdateWorkHours}
                        disabled={isUpdatingWorkHours}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md font-medium transition-colors"
                      >
                        {isUpdatingWorkHours ? "更新中..." : "更新工作時間"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* 带队記錄 */}
                <div className="flex-1 p-4 sm:p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      帶隊記錄
                    </h3>
                    <span className="text-sm text-gray-600">
                      共 {trainerActivities.length} 項活動
                    </span>
                  </div>

                  <div className="overflow-y-auto max-h-64">
                    {isLoadingActivities ? (
                      <div className="flex items-center justify-center h-32">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      </div>
                    ) : trainerActivities.length === 0 ? (
                      <div className="flex items-center justify-center h-32 text-gray-500">
                        暫無帶隊記錄
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {trainerActivities.map((activity) => (
                          <div
                            key={activity.id}
                            className="border border-gray-200 rounded-lg p-3 sm:p-4"
                          >
                            <div className="flex justify-between items-start gap-3 mb-2">
                              <div className="font-medium text-gray-900 break-words min-w-0">
                                {activity.activityName}
                              </div>
                              <div className="text-right shrink-0">
                                <div className="font-semibold text-blue-600">
                                  {formatHours(activity.duration)}h
                                </div>
                                <div className="text-xs text-gray-500">
                                  帶隊時間
                                </div>
                              </div>
                            </div>
                            <div className="text-sm text-gray-600 space-y-1">
                              <div>地點: {label(activity.location)}</div>
                              <div className="break-words">
                                時間: {formatDateTime(activity.startTime)} -{" "}
                                {formatDateTime(activity.endTime)}
                              </div>
                              <div>
                                參與者: {activity.participants.length} 人
                              </div>
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
