// components/StaffSection.tsx
"use client";

import { useHorizontalOverflow } from "@/hooks/useHorizontalOverflow";
import { useState } from "react";

export type StaffRow = { id: number; staffName: string; quantity: number };
export type StaffMember = {
  username: string;
  locations: string[];
  role: string;
};

export function parseLocations(locations: unknown): string[] {
  if (Array.isArray(locations)) return locations.map(String).filter(Boolean);
  if (typeof locations === "string") {
    const raw = locations.trim();
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
    } catch {
      /* treat as a single center code */
    }
    return [raw];
  }
  return [];
}

export function parseAccountList(data: unknown): StaffMember[] {
  const rows = Array.isArray(data) ? data : [];
  return rows
    .filter((row): row is Record<string, unknown> =>
      Boolean(row && typeof row === "object" && (row as any).username),
    )
    .map((row) => ({
      username: String(row.username),
      role: String(row.role || ""),
      locations: parseLocations(row.locations),
    }));
}

type StaffSectionProps = {
  title: string;
  rows: StaffRow[];
  staffList: StaffMember[];
  onAdd: () => void;
  onRemove: (id: number) => void;
  onChange: (
    id: number,
    field: "staffName" | "quantity",
    value: string | number,
  ) => void;
};

export default function StaffSection({
  title,
  rows,
  staffList,
  onAdd,
  onRemove,
  onChange,
}: StaffSectionProps) {
  const [focusedQuantityId, setFocusedQuantityId] = useState<
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
            <div className="flex-1 min-w-[12rem] text-xs font-bold text-slate-500">
              職員
            </div>
            <div className="w-24 shrink-0 text-xs font-bold text-slate-500">
              數量
            </div>
            <div className="w-8 shrink-0" />
            <div className="w-8 shrink-0" />
          </div>

          {/* Rows */}
          <div className="rows-area space-y-2">
            {rows.map((row) => (
              <div key={row.id} className="row-container flex-nowrap">
                <select
                  value={row.staffName}
                  onChange={(e) =>
                    onChange(row.id, "staffName", e.target.value)
                  }
                  className="input-field flex-1"
                >
                  <option value="">請選擇職員</option>
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
                  placeholder="數量"
                  value={
                    focusedQuantityId === row.id
                      ? row.quantity === 0
                        ? ""
                        : row.quantity
                      : row.quantity || 0
                  }
                  onFocus={() => {
                    setFocusedQuantityId(row.id);

                    // If current value is 0, show an empty input
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
