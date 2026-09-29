// components/IntroductionFeeSection.tsx
"use client";

import { StaffMember } from "@/app/components/StaffSection";
import { useHorizontalOverflow } from "@/hooks/useHorizontalOverflow";
import { useState } from "react";

export const INCOME_TYPES = ["試", "單", "卡"] as const;
export const DEFAULT_INCOME_TYPE = INCOME_TYPES[0];

export type IntroductionFeeRow = {
  id: number;
  incomeType: string;
  amount: number;
  staffName: string;
  quantity: number;
};

type IntroductionFeeSectionProps = {
  title: string;
  rows: IntroductionFeeRow[];
  staffList: StaffMember[];
  onAdd: () => void;
  onRemove: (id: number) => void;
  onChange: (
    id: number,
    field: keyof IntroductionFeeRow,
    value: string | number,
  ) => void;
};

export function emptyIntroductionFeeRow(id: number): IntroductionFeeRow {
  return {
    id,
    incomeType: DEFAULT_INCOME_TYPE,
    amount: 0,
    staffName: "",
    quantity: 0,
  };
}

export function incomeRowTotal(row: { amount?: number }) {
  return Number(row.amount) || 0;
}

export default function IntroductionFeeSection({
  title,
  rows,
  staffList,
  onAdd,
  onRemove,
  onChange,
}: IntroductionFeeSectionProps) {
  const [focusedQuantityId, setFocusedQuantityId] = useState<
    string | null | number
  >(null);
  const [focusedAmountId, setFocusedAmountId] = useState<
    string | null | number
  >(null);
  const { containerRef, isOverflowing } =
    useHorizontalOverflow<HTMLDivElement>();
  return (
    <div className="section-group">
      <div className="label-title">
        <span>{title}</span>
      </div>

      <div
        ref={containerRef}
        className={`w-full min-w-0 ${
          isOverflowing ? "overflow-x-auto" : "overflow-x-visible"
        }`}
      >
        <div className="min-w-max">
          {/* Header */}
          <div className="flex items-center gap-3 px-2 mb-1">
            <div className="w-20 shrink-0" />
            <div className="w-24 shrink-0 text-xs font-bold text-slate-500">
              收入
            </div>
            <div className="w-48 shrink-0 text-xs font-bold text-slate-500">
              介紹人
            </div>
            <div className="w-24 shrink-0 text-xs font-bold text-slate-500">
              介紹費
            </div>
            <div className="w-8 shrink-0" />
            <div className="w-8 shrink-0" />
          </div>

          {/* Rows */}
          <div className="rows-area space-y-2">
            {rows.map((row) => (
              <div
                key={row.id}
                className="row-container bg-blue-50/50 flex-nowrap"
              >
                <select
                  value={row.incomeType}
                  onChange={(e) =>
                    onChange(row.id, "incomeType", e.target.value)
                  }
                  className="input-field w-20 shrink-0"
                >
                  {INCOME_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  min="0"
                  inputMode="numeric"
                  placeholder="收入"
                  value={
                    focusedAmountId === row.id
                      ? row.amount === 0
                        ? ""
                        : row.amount
                      : row.amount || 0
                  }
                  onFocus={() => {
                    setFocusedAmountId(row.id);

                    if (row.amount === 0) {
                      onChange(row.id, "amount", 0);
                    }
                  }}
                  onChange={(e) => {
                    const value = e.target.value;

                    if (value === "") {
                      onChange(row.id, "amount", 0);
                      return;
                    }

                    onChange(row.id, "amount", Number(value));
                  }}
                  onBlur={() => {
                    setFocusedAmountId(null);
                  }}
                  className="input-field w-24 shrink-0 money-input no-spinner"
                />

                <select
                  value={row.staffName}
                  onChange={(e) =>
                    onChange(row.id, "staffName", e.target.value)
                  }
                  className="input-field flex-1"
                >
                  <option value="">請選擇介紹人</option>

                  {staffList.map((s) => (
                    <option key={s.username} value={s.username}>
                      {s.username}
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  min="0"
                  inputMode="numeric"
                  placeholder="介紹費"
                  value={
                    focusedQuantityId === row.id
                      ? row.quantity === 0
                        ? ""
                        : row.quantity
                      : row.quantity || 0
                  }
                  onFocus={() => {
                    setFocusedQuantityId(row.id);

                    if (row.quantity === 0) {
                      onChange(row.id, "quantity", 0);
                    }
                  }}
                  onChange={(e) => {
                    const value = e.target.value;

                    if (value === "") {
                      onChange(row.id, "quantity", 0);
                      return;
                    }

                    onChange(row.id, "quantity", Number(value));
                  }}
                  onBlur={() => {
                    setFocusedQuantityId(null);
                  }}
                  className="input-field w-24 shrink-0 no-spinner"
                />

                <span className="btn-icon btn-add shrink-0" onClick={onAdd}>
                  ⊕
                </span>

                <span
                  className="btn-icon btn-del shrink-0"
                  onClick={() => onRemove(row.id)}
                >
                  −
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
