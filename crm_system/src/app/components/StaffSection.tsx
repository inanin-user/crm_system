// components/StaffSection.tsx
"use client";

export type StaffRow = { id: number; staffName: string; quantity: number };
export type StaffMember = { username: string; locations: string[]; role: string };

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
    .filter((row): row is Record<string, unknown> => Boolean(row && typeof row === "object" && (row as any).username))
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
  onChange: (id: number, field: "staffName" | "quantity", value: string | number) => void;
};

export default function StaffSection({
  title,
  rows,
  staffList,
  onAdd,
  onRemove,
  onChange,
}: StaffSectionProps) {
  return (
    <div className="section-group">
      <div className="label-title">
        <span>{title}</span>
        {/* <span className="text-xs font-normal text-slate-400">{rows.length} 筆</span> */}
      </div>
      <div className="rows-area space-y-2">
        {rows.map((row) => (
          <div key={row.id} className="row-container">
            <select
              value={row.staffName}
              onChange={(e) => onChange(row.id, "staffName", e.target.value)}
              className="input-field flex-1 staff-select"
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
              placeholder="數量"
              value={row.quantity}
              onChange={(e) => onChange(row.id, "quantity", Number(e.target.value))}
              className="input-field w-24"
            />
            <span className="btn-icon btn-add" onClick={onAdd}>⊕</span>
            <span className="btn-icon btn-del" onClick={() => onRemove(row.id)}>−</span>
          </div>
        ))}
      </div>
    </div>
  );
}