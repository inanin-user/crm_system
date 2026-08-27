// components/ModifyHistoryModal.tsx
"use client";

import { createPortal } from "react-dom";
import { useEffect, useState } from "react";

export type HistoryEntry = {
  id: number;
  modified_by: string;
  modified_at: string;
  field_name: string;
  previous_value: string;
  updated_value: string;
};

type StaffDiffRow = { staffName: string; quantity: number };
type IncomeDiffRow = { incomeType: string; quantity: number; amount: number };
type DiffRow = StaffDiffRow | IncomeDiffRow;

type DiffPayload = {
  count: number;
  rows: DiffRow[];
};

type ModifyHistoryModalProps = {
  open: boolean;
  onClose: () => void;
  loading: boolean;
  history: HistoryEntry[] | null;
};

const FIELD_LABELS: Record<string, string> = {
  center: "分店",
  docDate: "結算日期",
  docTime: "結算時間",
  grandTotal: "總金額",
  remarks: "備註",
  waterbar: "水吧項目",
  classItems: "教班",
  introductionFee: "介紹費",
  income: "收入明細",
};

function baseFieldOf(fieldName: string) {
  return fieldName.replace(/_added$|_removed$/, "");
}
function fieldLabel(fieldName: string) {
  return FIELD_LABELS[baseFieldOf(fieldName)] || baseFieldOf(fieldName);
}

// Type guard to distinguish income rows from staff rows at runtime
function isIncomeRow(row: DiffRow): row is IncomeDiffRow {
  return "incomeType" in row;
}

function formatRow(baseField: string, row: DiffRow): string {
  if (baseField === "income" && isIncomeRow(row)) {
    return `${row.incomeType} × ${row.quantity} — $ ${row.amount}`;
  }
  if ("staffName" in row) {
    return `${row.staffName} × ${row.quantity}`;
  }
  return "";
}

export default function ModifyHistoryModal({ open, onClose, loading, history }: ModifyHistoryModalProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!open || !mounted) return null;

  const modalContent = (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-800">修改記錄 Modify History</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-xl leading-none font-bold"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-3">
          {loading && <p className="text-slate-400 text-sm text-center py-8">載入中...</p>}

          {!loading && history !== null && history.length === 0 && (
            <p className="text-slate-400 text-sm text-center py-8">
              no modified history for this record
            </p>
          )}

          {!loading &&
            history !== null &&
            history.map((h) => {
              const isAdded = h.field_name.endsWith("_added");
              const isRemoved = h.field_name.endsWith("_removed");
              const baseField = baseFieldOf(h.field_name);

              let addedData: DiffPayload | null = null;
              let removedData: DiffPayload | null = null;
              try {
                if (isAdded) addedData = JSON.parse(h.updated_value) as DiffPayload;
                if (isRemoved) removedData = JSON.parse(h.previous_value) as DiffPayload;
              } catch {
                // fall through to plain rendering below
              }

              return (
                <div key={h.id} className="text-sm bg-slate-50 border border-slate-200 rounded-lg p-3">
                  <p className="font-bold text-slate-600 text-xs mb-2">
                    {fieldLabel(h.field_name)} · 由 {h.modified_by} 於{" "}
                    {new Date(h.modified_at).toLocaleString("zh-HK")}
                  </p>

                  {isAdded && addedData ? (
                    <>
                      <p className="text-green-600 font-bold mb-1">
                        Added {fieldLabel(h.field_name)}: {addedData.count}
                      </p>
                      <div className="space-y-1">
                        {addedData.rows.map((row, i) => (
                          <p key={i} className="text-green-600 bg-white border border-green-200 rounded px-2 py-1">
                            {formatRow(baseField, row)}
                          </p>
                        ))}
                      </div>
                    </>
                  ) : isRemoved && removedData ? (
                    <>
                      <p className="text-red-500 font-bold mb-1">
                        Removed {fieldLabel(h.field_name)}: {removedData.count}
                      </p>
                      <div className="space-y-1">
                        {removedData.rows.map((row, i) => (
                          <p key={i} className="text-red-500 bg-white border border-red-200 rounded px-2 py-1 line-through">
                            {formatRow(baseField, row)}
                          </p>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="flex items-start gap-2">
                      <span className="text-red-500 line-through break-all flex-1">{h.previous_value}</span>
                      <span className="text-slate-300">→</span>
                      <span className="text-green-600 break-all flex-1">{h.updated_value}</span>
                    </div>
                  )}
                </div>
              );
            })}
        </div>

        <div className="px-6 py-4 border-t border-slate-200 text-right">
          <button
            onClick={onClose}
            className="bg-slate-600 hover:bg-slate-700 text-white text-sm font-bold px-4 py-2 rounded-lg transition-all"
          >
            關閉 Close
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}