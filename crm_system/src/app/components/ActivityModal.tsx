"use client";

import React from "react";
import CustomSelect from "./CustomSelect";

export interface ActivityFormData {
  activityName: string;
  trainerId: string;
  startTime: string;
  endTime: string;
  location: string;
  description: string;
}

interface Trainer {
  id: string;
  username: string;
}

interface SelectOption {
  value: string;
  label: string;
}

interface ActivityModalProps {
  isOpen: boolean;
  mode: "add" | "edit";

  formData: ActivityFormData;

  trainers: Trainer[];
  locationOptions: SelectOption[];

  isSubmitting: boolean;
  error: string;

  onClose: () => void;

  onChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => void;

  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

export default function ActivityModal({
  isOpen,
  mode,
  formData,
  trainers,
  locationOptions,
  isSubmitting,
  error,
  onClose,
  onChange,
  onSubmit,
}: ActivityModalProps) {
  if (!isOpen) {
    return null;
  }

  const isEdit = mode === "edit";

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-20 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-2xl mx-4 max-h-[85vh] overflow-y-auto">

        {/* Header */}
        <div className="flex justify-between items-start mb-4 gap-4">

          <div className="flex items-center gap-3 min-w-0">

            <h2 className="text-xl font-semibold text-gray-900 whitespace-nowrap">
              {isEdit ? "編輯活動" : "添加新活動"}
            </h2>

            {error && (
              <div
                className="flex items-center gap-1.5 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-1.5"
                role="alert"
              >
                <svg
                  className="w-4 h-4 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01M10.29 3.86l-7.82 13.5A2 2 0 004.2 20.36h15.6a2 2 0 001.73-3L13.71 3.86a2 2 0 00-3.42-3z"
                  />
                </svg>

                <span>{error}</span>
              </div>
            )}

          </div>

          {/* Close */}
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 min-w-0"
            disabled={isSubmitting}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

        </div>

        {/* Form */}
        <form onSubmit={onSubmit} className="space-y-4">

          {/* Activity Name + Trainer */}
          <div className="grid grid-cols-2 gap-4">

            {/* Activity Name */}
            <div>
              <label
                htmlFor={`${mode}ActivityName`}
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                活動名稱 <span className="text-red-500">*</span>
              </label>

              <input
                type="text"
                id={`${mode}ActivityName`}
                name="activityName"
                value={formData.activityName}
                onChange={onChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                placeholder="輸入活動名稱"
                required
              />
            </div>

            {/* Trainer */}
            <div>
              <label
                htmlFor={`${mode}TrainerId`}
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                負責教練 <span className="text-red-500">*</span>
              </label>

              <CustomSelect
                value={formData.trainerId}
                onChange={(value) =>
                  onChange({
                    target: {
                      name: "trainerId",
                      value,
                    },
                  } as React.ChangeEvent<HTMLSelectElement>)
                }
                options={[
                  {
                    value: "",
                    label: "選擇教練",
                  },
                  ...trainers.map((trainer) => ({
                    value: trainer.id,
                    label: trainer.username,
                  })),
                ]}
                placeholder="選擇教練"
                required
              />
            </div>

          </div>

          {/* Start / End Time */}
          <div className="grid grid-cols-2 gap-4">

            {/* Start Time */}
            <div>
              <label
                htmlFor={`${mode}StartTime`}
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                開始時間 <span className="text-red-500">*</span>
              </label>

              <input
                type="datetime-local"
                id={`${mode}StartTime`}
                name="startTime"
                value={formData.startTime}
                onChange={onChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md  text-slate-900"
                required
              />
            </div>

            {/* End Time */}
            <div>
              <label
                htmlFor={`${mode}EndTime`}
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                結束時間 <span className="text-red-500">*</span>
              </label>

              <input
                type="datetime-local"
                id={`${mode}EndTime`}
                name="endTime"
                value={formData.endTime}
                onChange={onChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                required
              />
            </div>

          </div>

          {/* Location */}
          <div>
            <label
              htmlFor={`${mode}Location`}
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              活動地點 <span className="text-red-500">*</span>
            </label>

            <CustomSelect
              value={formData.location}
              onChange={(value) =>
                onChange({
                  target: {
                    name: "location",
                    value,
                  },
                } as React.ChangeEvent<HTMLSelectElement>)
              }
              options={locationOptions}
              placeholder="選擇地點"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor={`${mode}Description`}
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              活動描述
            </label>

            <textarea
              id={`${mode}Description`}
              name="description"
              value={formData.description}
              onChange={onChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
              placeholder="輸入活動描述（可選）"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">

            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
              disabled={isSubmitting}
            >
              取消
            </button>

            <button
              type="submit"
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? isEdit
                  ? "修改中..."
                  : "添加中..."
                : isEdit
                  ? "確認修改"
                  : "確認添加"}
            </button>

          </div>

        </form>
      </div>
    </div>
  );
}