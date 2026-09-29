"use client";

import { useState, useEffect } from "react";
import { useScrollOptimization } from "@/hooks/useScrollOptimization";
import CustomSelect from "@/app/components/CustomSelect";
import ActivityModal, {
  ActivityFormData,
} from "@/app/components/ActivityModal";
import { withBasePath } from "@/lib/basePath";
import { LocationCode, useLocation } from "@/types/location";

interface Activity {
  id: string;
  activityName: string;
  trainerId: string;
  trainerName: string;
  startTime: string;
  endTime: string;
  duration: number;
  participants: string[];
  location: LocationCode;
  description?: string;
  isActive: boolean;
  createdAt: string;
}

interface Trainer {
  id: string;
  username: string;
  role: string;
  isActive: boolean;
}

const emptyActivityForm: ActivityFormData = {
  activityName: "",
  trainerId: "",
  startTime: "",
  endTime: "",
  location: "",
  description: "",
};

export default function ActivityManagementPage() {
  useScrollOptimization();

  const { label } = useLocation();

  const [activities, setActivities] = useState<Activity[]>([]);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [selectedActivity, setSelectedActivity] =
    useState<Activity | null>(null);

  const [isLoadingActivities, setIsLoadingActivities] = useState(true);
  const [, setIsLoadingTrainers] = useState(true);

  // Activity modal
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [activityModalMode, setActivityModalMode] =
    useState<"add" | "edit">("add");

  const [activityFormData, setActivityFormData] =
    useState<ActivityFormData>(emptyActivityForm);

  const [editingActivity, setEditingActivity] =
    useState<Activity | null>(null);

  const [activityFormError, setActivityFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Page messages
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const locationOptions = Object.values(LocationCode).map((code) => ({
    value: code,
    label: label(code),
  }));

  // ------------------------------------------------------------
  // Fetch activities
  // ------------------------------------------------------------

  const fetchActivities = async () => {
    try {
      setIsLoadingActivities(true);

      const response = await fetch(withBasePath("/api/activities"));
      const result = await response.json();

      if (result.success) {
        setActivities(result.data);

        if (result.data.length > 0 && !selectedActivity) {
          setSelectedActivity(result.data[0]);
        }
      } else {
        setError("獲取活動列表失敗");
      }
    } catch {
      setError("Server error");
    } finally {
      setIsLoadingActivities(false);
    }
  };

  // ------------------------------------------------------------
  // Fetch trainers
  // ------------------------------------------------------------

  const fetchTrainers = async () => {
    try {
      setIsLoadingTrainers(true);

      const response = await fetch(
        withBasePath("/api/accounts?role=trainer"),
      );

      const result = await response.json();

      if (result.success) {
        setTrainers(result.data);
      } else {
        setError("獲取教練列表失敗");
      }
    } catch {
      setError("Server error");
    } finally {
      setIsLoadingTrainers(false);
    }
  };

  // ------------------------------------------------------------
  // Activity form change
  // ------------------------------------------------------------

  const handleActivityFormChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;

    setActivityFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // User changed a field, so clear validation message.
    setActivityFormError("");
  };

  // ------------------------------------------------------------
  // Format datetime for datetime-local input
  // ------------------------------------------------------------

  const formatDateTimeLocal = (value: string | Date) => {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    const pad = (n: number) => String(n).padStart(2, "0");

    return `${date.getFullYear()}-${pad(
      date.getMonth() + 1,
    )}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(
      date.getMinutes(),
    )}`;
  };

  // ------------------------------------------------------------
  // Open Add modal
  // ------------------------------------------------------------

  const handleOpenAddModal = () => {
    setActivityModalMode("add");
    setActivityFormData({ ...emptyActivityForm });
    setEditingActivity(null);
    setActivityFormError("");
    setIsActivityModalOpen(true);
  };

  // ------------------------------------------------------------
  // Open Edit modal
  // ------------------------------------------------------------

  const handleOpenEditModal = (activity: Activity) => {
    setActivityModalMode("edit");

    setActivityFormData({
      activityName: activity.activityName || "",
      trainerId: activity.trainerId || "",
      startTime: activity.startTime
        ? formatDateTimeLocal(activity.startTime)
        : "",
      endTime: activity.endTime
        ? formatDateTimeLocal(activity.endTime)
        : "",
      location: activity.location || "",
      description: activity.description || "",
    });

    setEditingActivity(activity);
    setActivityFormError("");
    setIsActivityModalOpen(true);
  };

  // ------------------------------------------------------------
  // Close Activity modal
  // ------------------------------------------------------------

  const handleCloseActivityModal = () => {
    if (isSubmitting) {
      return;
    }

    setIsActivityModalOpen(false);
    setActivityFormError("");
    setEditingActivity(null);
  };

  // ------------------------------------------------------------
  // Validate activity form
  // ------------------------------------------------------------

  const validateActivityForm = () => {
    if (!activityFormData.activityName.trim()) {
      setActivityFormError("請輸入活動名稱");
      return false;
    }

    if (!activityFormData.trainerId) {
      setActivityFormError("請選擇負責教練");
      return false;
    }

    if (!activityFormData.startTime || !activityFormData.endTime) {
      setActivityFormError("請選擇開始時間及結束時間");
      return false;
    }

    const startTime = new Date(activityFormData.startTime);
    const endTime = new Date(activityFormData.endTime);

    if (
      Number.isNaN(startTime.getTime()) ||
      Number.isNaN(endTime.getTime())
    ) {
      setActivityFormError("開始時間或結束時間格式錯誤");
      return false;
    }

    if (endTime <= startTime) {
      setActivityFormError("開始時間應早於結束時間");
      return false;
    }

    if (!activityFormData.location) {
      setActivityFormError("請選擇活動地點");
      return false;
    }

    return true;
  };

  // ------------------------------------------------------------
  // Add activity
  // ------------------------------------------------------------

  const handleAddSubmit = async (
    e: React.FormEvent<HTMLFormElement>,
  ) => {
    e.preventDefault();

    setActivityFormError("");

    if (!validateActivityForm()) {
      return;
    }

    try {
      setIsSubmitting(true);

      const selectedTrainer = trainers.find(
        (trainer) => trainer.id === activityFormData.trainerId,
      );

      const response = await fetch(withBasePath("/api/activities"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...activityFormData,
          trainerName: selectedTrainer?.username || "",
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setActivityFormError(
          result.message || "添加活動失敗",
        );
        return;
      }

      setSuccessMessage("活動添加成功");

      setIsActivityModalOpen(false);
      setActivityFormData({ ...emptyActivityForm });
      setActivityFormError("");
      setEditingActivity(null);

      await fetchActivities();
    } catch (error) {
      console.error("Add activity error:", error);
      setActivityFormError("Server error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ------------------------------------------------------------
  // Update activity
  // ------------------------------------------------------------

  const handleUpdateSubmit = async (
    e: React.FormEvent<HTMLFormElement>,
  ) => {
    e.preventDefault();

    setActivityFormError("");

    if (!editingActivity?.id) {
      setActivityFormError("找不到活動 ID");
      return;
    }

    if (!validateActivityForm()) {
      return;
    }

    try {
      setIsSubmitting(true);

      const selectedTrainer = trainers.find(
        (trainer) => trainer.id === activityFormData.trainerId,
      );

      const response = await fetch(
        withBasePath(`/api/activities/${editingActivity.id}`),
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...activityFormData,
            trainerName: selectedTrainer?.username || "",
          }),
        },
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        setActivityFormError(
          result.message || "修改活動失敗",
        );
        return;
      }

      setSuccessMessage("活動修改成功");

      setIsActivityModalOpen(false);
      setActivityFormData({ ...emptyActivityForm });
      setActivityFormError("");
      setEditingActivity(null);

      await fetchActivities();

      // Keep the updated activity selected.
      if (result.data) {
        setSelectedActivity(result.data);
      }
    } catch (error) {
      console.error("Update activity error:", error);
      setActivityFormError("Server error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ------------------------------------------------------------
  // Select activity
  // ------------------------------------------------------------

  const handleSelectActivity = (activity: Activity) => {
    setSelectedActivity(activity);
    setError("");
    setSuccessMessage("");
  };

  // ------------------------------------------------------------
  // Format datetime for display
  // ------------------------------------------------------------

  const formatDateTime = (dateString: string) => {
    if (!dateString) {
      return "無時間";
    }

    const date = new Date(dateString);

    return date.toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ------------------------------------------------------------
  // Initial data
  // ------------------------------------------------------------

  useEffect(() => {
    fetchActivities();
    fetchTrainers();
  }, []);

  // ------------------------------------------------------------
  // Clear success message
  // ------------------------------------------------------------

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage("");
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  return (
    <div className="max-w-7xl mx-auto">
      {/* 頁面標題和添加按鈕 */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            活動管理
          </h1>

          <p className="mt-2 text-gray-600">
            管理活動信息、分配教練和查看參與者
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAddModal}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          + 添加活動
        </button>
      </div>

      {/* 錯誤提示 */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* 成功提示 */}
      {successMessage && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
          <p className="text-sm text-green-600">
            {successMessage}
          </p>
        </div>
      )}

      {/* 主要內容區域 */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="flex h-auto min-h-96">
          {/* 左側 - 活動列表 */}
          <div className="w-1/3 border-r border-gray-200">
            <div className="p-4 bg-gray-50 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                活動列表
              </h2>

              <p className="text-sm text-gray-600">
                共 {activities.length} 個活動
              </p>
            </div>

            <div className="overflow-y-auto max-h-96">
              {isLoadingActivities ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                </div>
              ) : activities.length === 0 ? (
                <div className="flex items-center justify-center h-32 text-gray-500">
                  暫無活動
                </div>
              ) : (
                <div className="space-y-1 p-2">
                  {activities.map((activity) => (
                    <div
                      key={activity.id}
                      className={`flex items-stretch rounded-lg transition-colors ${
                        selectedActivity?.id === activity.id
                          ? "bg-blue-50 border border-blue-200"
                          : "hover:bg-gray-50 border border-transparent"
                      }`}
                    >
                      {/* 活動資料 */}
                      <button
                        type="button"
                        onClick={() =>
                          handleSelectActivity(activity)
                        }
                        className={`flex-1 min-w-0 text-left p-3 ${
                          selectedActivity?.id === activity.id
                            ? "text-blue-900"
                            : ""
                        }`}
                      >
                        <div className="font-medium truncate">
                          {activity.activityName}
                        </div>

                        <div className="text-sm text-gray-500 truncate">
                          教練: {activity.trainerName || "未指定"} ·{" "}
                          {label(activity.location)}
                        </div>

                        <div className="text-xs text-gray-400">
                          {formatDateTime(activity.startTime)}
                        </div>
                      </button>

                      {/* 編輯活動 */}
                      {activity.trainerId && (
                        <div className="flex items-center px-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditModal(activity);
                            }}
                            className="px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors whitespace-nowrap"
                          >
                            編輯
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 右側 - 活動詳情 */}
          <div className="flex-1 flex flex-col">
            {!selectedActivity ? (
              <div className="flex items-center justify-center h-96 text-gray-500">
                請從左側選擇一個活動
              </div>
            ) : (
              <>
                {/* 活動基本信息 */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex justify-between items-start mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">
                      {selectedActivity.activityName}
                    </h2>

                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        selectedActivity.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {selectedActivity.isActive
                        ? "進行中"
                        : "已結束"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        負責教練
                      </label>

                      <div className="text-gray-900">
                        {selectedActivity.trainerName}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        活動地點
                      </label>

                      <div className="text-gray-900">
                        {label(selectedActivity.location)}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        開始時間
                      </label>

                      <div className="text-gray-900">
                        {formatDateTime(
                          selectedActivity.startTime,
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        結束時間
                      </label>

                      <div className="text-gray-900">
                        {formatDateTime(selectedActivity.endTime)}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        持續時間
                      </label>

                      <div className="text-gray-900 font-semibold text-blue-600">
                        {selectedActivity.duration}h
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        參與人數
                      </label>

                      <div className="text-gray-900">
                        {selectedActivity.participants.length} 人
                      </div>
                    </div>
                  </div>

                  {selectedActivity.description && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        活動描述
                      </label>

                      <div className="text-gray-900 bg-gray-50 p-3 rounded-md">
                        {selectedActivity.description}
                      </div>
                    </div>
                  )}
                </div>

                {/* 參與者列表 */}
                <div className="flex-1 p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      參與者列表
                    </h3>

                    <span className="text-sm text-gray-600">
                      共 {selectedActivity.participants.length} 位參與者
                    </span>
                  </div>

                  <div className="overflow-y-auto max-h-64">
                    {selectedActivity.participants.length === 0 ? (
                      <div className="flex items-center justify-center h-32 text-gray-500">
                        暫無參與者
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        {selectedActivity.participants.map(
                          (participant, index) => (
                            <div
                              key={index}
                              className="border border-gray-200 rounded-lg p-3"
                            >
                              <div className="font-medium text-gray-900">
                                {participant}
                              </div>

                              <div className="text-sm text-gray-500">
                                參與者 #{index + 1}
                              </div>
                            </div>
                          ),
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 共用活動 Modal */}
      <ActivityModal
        isOpen={isActivityModalOpen}
        mode={activityModalMode}
        formData={activityFormData}
        trainers={trainers}
        locationOptions={locationOptions}
        isSubmitting={isSubmitting}
        error={activityFormError}
        onClose={handleCloseActivityModal}
        onChange={handleActivityFormChange}
        onSubmit={
          activityModalMode === "add"
            ? handleAddSubmit
            : handleUpdateSubmit
        }
      />
    </div>
  );
}