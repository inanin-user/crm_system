// app/daily_settlement/home/page.tsx
"use client";
import { CENTER_CODES, CENTER_LABELS } from "@/types/center";
import StaffSection, { StaffRow, StaffMember } from "@/app/components/StaffSection";
import { useEffect, useMemo, useState } from "react";
import { withDailySettlementPath } from "@/lib/basePath";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

type IncomeRow = { id: number; incomeType: string; quantity: number; amount: number };

let rowIdCounter = 0;
const nextId = () => ++rowIdCounter;

export default function HomeScreen() {
  const [username, setUsername] = useState("");
  const [center, setCenter] = useState('');
  const [role, setRole] = useState("");
  // Add inside the component, alongside your other useState calls:
  // Update the type — was string[], now objects

  const [staffList, setStaffList] = useState<StaffMember[]>([]);

  const [docDate, setDocDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [docTime, setDocTime] = useState(() => new Date().toTimeString().slice(0, 5));

  const [waterbar, setWaterbar] = useState<StaffRow[]>([{ id: nextId(), staffName: "", quantity: 0 }]);
  const [classItems, setClassItems] = useState<StaffRow[]>([{ id: nextId(), staffName: "", quantity: 0 }]);
  const [introductionFee, setIntroductionFee] = useState<StaffRow[]>([{ id: nextId(), staffName: "", quantity: 0 }]);
  const [income, setIncome] = useState<IncomeRow[]>([{ id: nextId(), incomeType: "試", quantity: 0, amount: 0 }]);

  const [remarks, setRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(withDailySettlementPath("/api/staff"))
      .then((res) => {
        if (!res.ok) throw new Error("staff fetch failed");
        return res.json();
      })
      .then((data) => {
        const list: StaffMember[] = data.staff || [];
        setStaffList(list);

        // Initialize center from the current logged-in user's own staff record,
        // but only for non-admins — admins pick a center manually via the selector.
        if (username && role !== "admin") {
          const self = list.find((s) => s.username === username);
          if (self) setCenter(self.center);
        }
      })
      .catch((err) => {
        console.error("Failed to load staff list:", err);
      });
  }, [username, role]); // re-run once session (username/role) has loaded

  // Load session info (username/role/center) for display
  useEffect(() => {
    fetch(withDailySettlementPath("/api/session"))
      .then((res) => {
        if (!res.ok) throw new Error("session fetch failed");
        return res.json();
      })
      .then((data) => {
        setUsername(data.username || "");
        setRole(data.role || "");
        setCenter(data.center || "");
      })
      .catch(() => {
        // session invalid/expired — middleware will already redirect on next protected nav,
        // but bounce immediately for a snappier UX
        window.location.href = `${BASE_PATH}/login`;
      });
  }, []);

  useEffect(() => {
    fetch(withDailySettlementPath("/api/staff"))
      .then((res) => {
        if (!res.ok) throw new Error("staff fetch failed");
        return res.json();
      })
      .then((data) => {
        setStaffList(data.staff || []);
      })
      .catch((err) => {
        console.error("Failed to load staff list:", err);
        // non-fatal — dropdown just stays empty; don't redirect
      });
  }, []);

  const grandTotal = useMemo(
    () => income.reduce((sum, row) => sum + (Number(row.amount * row.quantity) || 0), 0),
    [income]
  );

  const addRow = (setter: React.Dispatch<React.SetStateAction<StaffRow[]>>) => {
    setter((rows) => [...rows, { id: nextId(), staffName: "", quantity: 0 }]);
  };
  const removeRow = (setter: React.Dispatch<React.SetStateAction<StaffRow[]>>, id: number) => {
    setter((rows) => (rows.length > 1 ? rows.filter((r) => r.id !== id) : rows));
  };
  const updateRow = (
    setter: React.Dispatch<React.SetStateAction<StaffRow[]>>,
    id: number,
    field: "staffName" | "quantity",
    value: string | number
  ) => {
    setter((rows) => rows.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  const addIncomeRow = () => {
    setIncome((rows) => [...rows, { id: nextId(), incomeType: "試", quantity: 0, amount: 0 }]);
  };
  const removeIncomeRow = (id: number) => {
    setIncome((rows) => (rows.length > 1 ? rows.filter((r) => r.id !== id) : rows));
  };
  const updateIncomeRow = (id: number, field: keyof IncomeRow, value: number | string) => {
    setIncome((rows) => rows.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  const handleSubmit = async () => {
    if (!center) {
      setCenter('WC');
      // return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${BASE_PATH}/api/update-data`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          center,
          docDate,
          docTime,
          grandTotal,
          remarks,
          waterbar: waterbar.filter((r) => r.staffName),
          classItems: classItems.filter((r) => r.staffName),
          introductionFee: introductionFee.filter((r) => r.staffName),
          income: income.filter((r) => r.incomeType),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "提交失敗");
        return;
      }
      alert("提交成功");
      resetForm();
    } catch (err) {
      console.error("Submit error:", err);
      alert("伺服器錯誤，請稍後再試");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    const now = new Date();
    setDocDate(now.toISOString().slice(0, 10));
    setDocTime(now.toTimeString().slice(0, 5));

    setWaterbar([{ id: nextId(), staffName: "", quantity: 0 }]);
    setClassItems([{ id: nextId(), staffName: "", quantity: 0 }]);
    setIntroductionFee([{ id: nextId(), staffName: "", quantity: 0 }]);
    setIncome([{ id: nextId(), incomeType: "試", quantity: 0, amount: 0 }]);

    setRemarks("");
  };

  const handleLogout = async () => {
    try {
      await fetch(`${BASE_PATH}/api/logout`, { method: "POST" });
    } finally {
      window.location.href = `${BASE_PATH}/login`;
    }
  };

  return (
    <div id="home-screen">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="relative bg-slate-800 p-6 text-white">
          <div className="flex items-center justify-between">
            {/* <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-slate-300">{username}</p>
              {role === "admin" && (
                <button
                  onClick={() => (window.location.href = withDailySettlementPath(`/view-data`))}
                  className="bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-all"
                >
                  查看資料
                </button>
              )}
            </div> */}

            <div className="text-center flex-1">
              <h1 className="text-2xl font-black tracking-tight">每日結算系統</h1>
              <p className="text-slate-400 text-sm mt-1">{new Date().toLocaleString("zh-HK")}</p>
            </div>

            {/* <button
              onClick={handleLogout}
              className="bg-blue-500 hover:bg-blue-600 text-white text-sm font-bold px-4 py-2 rounded-lg transition-all"
            >
              Logout
            </button> */}
          </div>
        </div>


        {/* Center Selector */}
        <div className="bg-slate-700 px-6 py-3 flex items-center justify-center gap-3 border-b border-slate-600">
          {role === "admin" ? (
            <select
              value={center}
              onChange={(e) => setCenter(e.target.value)}
              className="bg-slate-600 hover:bg-slate-500 text-white text-sm font-bold px-3 py-1.5 rounded-lg border border-slate-500 transition-all"
            >
              <option value="">請選擇分店</option>
              {CENTER_CODES.map((code) => (
                <option key={code} value={code}>
                  {CENTER_LABELS[code]}
                </option>
              ))}
            </select>
          ) : (
            <div className="text-center text-white font-bold text-lg tracking-wide">
              {CENTER_LABELS[center as keyof typeof CENTER_LABELS] || center}
            </div>
          )}
        </div>

        {/* Main Form */}
        <div className="p-6 space-y-8">
          {/* Date + Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">結算日期</label>
              <input
                type="date"
                value={docDate}
                onChange={(e) => setDocDate(e.target.value)}
                className="input-field w-full"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">結算時間</label>
              <input
                type="time"
                value={docTime}
                onChange={(e) => setDocTime(e.target.value)}
                className="input-field w-full"
              />
            </div>
          </div>

          <StaffSection
            title="1. 水吧項目"
            rows={waterbar}
            staffList={staffList}
            onAdd={() => addRow(setWaterbar)}
            onRemove={(id) => removeRow(setWaterbar, id)}
            onChange={(id, field, value) => updateRow(setWaterbar, id, field, value)}
          />

          <StaffSection
            title="2. 教班 (人數)"
            rows={classItems}
            staffList={staffList}
            onAdd={() => addRow(setClassItems)}
            onRemove={(id) => removeRow(setClassItems, id)}
            onChange={(id, field, value) => updateRow(setClassItems, id, field, value)}
          />

          <StaffSection
            title="3. 介紹費"
            rows={introductionFee}
            staffList={staffList}
            onAdd={() => addRow(setIntroductionFee)}
            onRemove={(id) => removeRow(setIntroductionFee, id)}
            onChange={(id, field, value) => updateRow(setIntroductionFee, id, field, value)}
          />

          <hr className="border-slate-200" />

          {/* Income */}
          <div className="section-group">
            <div className="label-title">
              <span>4. 每日收入明細</span>
              <span className="text-xs font-normal text-slate-400">{income.length} 筆</span>
            </div>
            <div className="rows-area space-y-2">
              {income.map((row) => (
                <div key={row.id} className="row-container bg-blue-50/50">
                  <select
                    value={row.incomeType}
                    onChange={(e) => updateIncomeRow(row.id, "incomeType", e.target.value)}
                    className="input-field w-28"
                  >
                    <option value="試">試</option>
                    <option value="單">單</option>
                    <option value="卡">卡</option>
                  </select>
                  <input
                    type="number"
                    min="0"
                    placeholder="數量"
                    value={row.quantity}
                    onChange={(e) => updateIncomeRow(row.id, "quantity", Number(e.target.value))}
                    className="input-field w-20 number"
                  />
                  <input
                    type="number"
                    min="0"
                    placeholder="$ 金額"
                    value={row.amount}
                    onChange={(e) => updateIncomeRow(row.id, "amount", Number(e.target.value))}
                    className="input-field flex-1 money-input"
                  />
                  <span className="btn-icon btn-add" onClick={addIncomeRow}>⊕</span>
                  <span className="btn-icon btn-del" onClick={() => removeIncomeRow(row.id)}>−</span>
                </div>
              ))}
            </div>
          </div>

          {/* Total */}
          <div className="bg-slate-900 rounded-xl p-6 text-white flex justify-between items-center shadow-inner">
            <span className="text-lg font-bold text-slate-400">每日總金額 TOTAL</span>
            <span className="text-4xl font-black text-yellow-400">$ {grandTotal}</span>
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">備註 Remarks</label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="input-field w-full h-24 resize-none p-2"
              placeholder="輸入當日特殊情況..."
            />
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg active:scale-[0.98] transition-all text-lg disabled:opacity-50"
          >
            {submitting ? "提交中..." : "確認並提交報表"}
          </button>
        </div>
      </div>
    </div>
  );
}