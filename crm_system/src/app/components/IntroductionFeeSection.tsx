// components/IntroductionFeeSection.tsx
"use client";

import { StaffMember } from "@/components/StaffSection";

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
    value: string | number
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
  return (
    <div className="section-group">
      <div className="label-title">
        <span>{title}</span>
      </div>
      <div className="flex items-center gap-3 px-2 mb-1">
        <div className="w-20" />
        <div className="w-24 text-xs font-bold text-slate-500">收入</div>
        <div className="flex-1 text-xs font-bold text-slate-500">介紹人</div>
        <div className="w-24 text-xs font-bold text-slate-500">介紹費</div>
        <div className="w-8" />
        <div className="w-8" />
      </div>
      <div className="rows-area space-y-2">
        {rows.map((row) => (
          <div key={row.id} className="row-container bg-blue-50/50 flex-wrap">
            <select
              value={row.incomeType}
              onChange={(e) => onChange(row.id, "incomeType", e.target.value)}
              className="input-field w-20"
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
              value={row.amount}
              onChange={(e) => onChange(row.id, "amount", Number(e.target.value))}
              onWheel={(e) => e.currentTarget.blur()}
              className="input-field w-24 money-input no-spinner"
            />
            <select
              value={row.staffName}
              onChange={(e) => onChange(row.id, "staffName", e.target.value)}
              className="input-field flex-1 staff-select"
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
              value={row.quantity}
              onChange={(e) => onChange(row.id, "quantity", Number(e.target.value))}
              onWheel={(e) => e.currentTarget.blur()}
              className="input-field w-24 no-spinner"
            />
            <span className="btn-icon btn-add" onClick={onAdd}>
              ⊕
            </span>
            <span className="btn-icon btn-del" onClick={() => onRemove(row.id)}>
              −
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
