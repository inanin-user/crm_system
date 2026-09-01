// app/view-data/page.tsx
"use client";

import { useEffect, useState } from "react";
import ExportMenu from "@/app/components/ExportMenu";
import { exportToTXT, exportToPDF } from "@/lib/export";
import { withDailySettlementPath } from "@/lib/basePath";
import { LocationCode, useLocation } from "@/types/location";
import ExportFab from "@/app/components/ExportFab";
import { useSidebar } from "@/contexts/SidebarContext";


const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

type Record = {
  username: string;
  submittedAt: string;
  center: LocationCode;
  docDate: string;
  docTime: string;
  grandTotal: number;
  remarks: string | null;
  waterbar: { staff_name: string; quantity: number }[];
  classItems: { staff_name: string; quantity: number }[];
  introductionFee: { staff_name: string; quantity: number }[];
  income: { income_type: string; quantity: number; amount: number }[];
};

const todayStr = () => new Date().toISOString().slice(0, 10);
const twoMonthsAgoStr = () => {
  const d = new Date();
  d.setMonth(d.getMonth() - 2);
  return d.toISOString().slice(0, 10);
};

export default function ViewDataPage() {
  const { setDisableGPULayer } = useSidebar();

  const [username, setUsername] = useState("");
  const [role, setRole] = useState("");

  const [dateFrom, setDateFrom] = useState(twoMonthsAgoStr());
  const [dateTo, setDateTo] = useState(todayStr());

  const [records, setRecords] = useState<Record[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [staffList, setStaffList] = useState<{ username: string; center: LocationCode; role: string }[]>([]);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [exporting, setExporting] = useState(false);
  const { label } = useLocation();
  useEffect(() => {
    setDisableGPULayer(true);
    return () => setDisableGPULayer(false);
  }, [setDisableGPULayer]);

  useEffect(() => {
    fetch(withDailySettlementPath("/api/staff"))
      .then((res) => res.json())
      .then((data) => setStaffList(data.staff || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch(withDailySettlementPath("/api/session"))
      .then((res) => {
        if (!res.ok) throw new Error("session fetch failed");
        return res.json();
      })
      .then((data) => {
        setUsername(data.username || "");
        setRole(data.role || "");
      })
      .catch(() => {
        window.location.href = `${BASE_PATH}/login`;
      });
  }, []);

  // const handleExportPDF = async () => {
  //   setExporting(true);
  //   try {
  //     await exportToPDF("view-records-list", username);
  //   } catch (err) {
  //     console.error("PDF export failed:", err);
  //     alert("匯出 PDF 失敗，請稍後再試");
  //   } finally {
  //     setExporting(false);
  //   }
  // };

  const handleExportTXT = () => {
    exportToTXT(records, staffList, username, label);
  };

  const fetchRecords = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ dateFrom, dateTo });
      const res = await fetch(withDailySettlementPath(`/api/view-data?${params}`));
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "查詢失敗");
        setRecords([]);
        return;
      }
      setRecords(data.records || []);
    } catch (err) {
      console.error("fetch records error:", err);
      setError("伺服器錯誤，請稍後再試");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (username) fetchRecords();
  }, [username]);

  const handleReset = () => {
    setDateFrom(twoMonthsAgoStr());
    setDateTo(todayStr());
  };


  return (
    <div id="view-screen" className="">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-200">
        <div className="relative bg-slate-800 p-6 text-white">
          <div className="flex items-center justify-between">
            {/* <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-slate-300">{username}</p>
              {role === "admin" && (
                <button
                  onClick={() => (window.location.href = withDailySettlementPath(`/home`))}
                  className="bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-all"
                >
                  更新資料
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

        {/* Filters */}
        <div className="px-6 py-4 bg-slate-50">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[130px]">
              <label className="block text-xs font-bold text-slate-500 mb-1">開始日期 From</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="input-field w-full"
              />
            </div>

            <div className="flex-1 min-w-[130px]">
              <label className="block text-xs font-bold text-slate-500 mb-1">結束日期 To</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="input-field w-full"
              />
            </div>

            <button
              onClick={fetchRecords}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-4 py-2.5 rounded-lg transition-all disabled:opacity-50"
            >
              {loading ? "查詢中..." : "篩選 Filter"}
            </button>

            <button
              onClick={handleReset}
              className="bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-bold px-4 py-2.5 rounded-lg transition-all"
            >
              重置 Reset
            </button>
          </div>

          <p className="text-xs text-slate-400 mt-2">最長篩選範圍為 2 個月</p>
          {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>

        <div className="border-t border-slate-200"></div>

        <div id="view-records-list" className="p-6 space-y-6">
          {!loading && records.length === 0 && (
            <p className="text-center text-slate-400 py-8">沒有找到符合條件的記錄</p>
          )}

          {records.map((rec) => (
            <div
              key={`${rec.username}-${rec.submittedAt}`}
              className="border border-slate-200 rounded-xl p-5 bg-slate-50"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="font-bold text-slate-800">{rec.docDate} {rec.docTime}</p>
                  <p className="text-xs text-slate-400">
                    分店 {label(rec.center)} · 提交人 {rec.username}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-black text-blue-600">$ {rec.grandTotal}</span>
                  {(
                    <button
                      onClick={() =>
                      (window.location.href = withDailySettlementPath(`/edit?username=${encodeURIComponent(
                        rec.username
                      )}&submittedAt=${encodeURIComponent(rec.submittedAt)}`))
                      }
                      className="bg-slate-700 hover:bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-all"
                    >
                      編輯 Edit
                    </button>
                  )}
                </div>
              </div>

              {rec.waterbar.length > 0 && (
                <RecordSection title="水吧" rows={rec.waterbar} />
              )}
              {rec.classItems.length > 0 && (
                <RecordSection title="教班" rows={rec.classItems} />
              )}
              

              {rec.income.length > 0 && (
                <div className="mb-2">
                  <p className="text-xs font-bold text-slate-500 mb-1">收入明細</p>
                  <div className="flex flex-wrap gap-2">
                    {rec.income.map((inc, i) => (
                      <span
                        key={i}
                        className="text-xs text-slate-900 bg-white border border-slate-200 rounded px-2 py-1"
                      >
                        {inc.income_type} × {inc.quantity} — $ {inc.amount}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {rec.introductionFee.length > 0 && (
                <RecordSection title="介紹費" rows={rec.introductionFee} />
              )}

              {rec.income.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs font-bold text-slate-500 mb-1">每日總金額</p>

                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs font-bold  text-slate-900 bg-white border border-slate-200 rounded px-2 py-1">
                      $ {rec.income.reduce((sum, inc) => sum + inc.quantity * inc.amount, 0)}
                    </span>
                  </div>
                </div>
              )}

              {rec.remarks && (
                <p className="text-xs text-slate-500 mt-3 italic">備註：{rec.remarks}</p>
              )}
            </div>
          ))}

        </div>
      </div>
          <ExportMenu
            open={showExportMenu}
            onClose={() => setShowExportMenu(false)}
            // onExportPDF={handleExportPDF}
            onExportTXT={handleExportTXT}
            exporting={exporting}
          />

          <ExportFab onClick={() => setShowExportMenu(true)} />
    </div>
  );
}

function RecordSection({
  title,
  rows,
}: {
  title: string;
  rows: { staff_name: string; quantity: number }[];
}) {
  return (
    <div className="mb-2">
      <p className="text-xs font-bold text-slate-500 mb-1">{title}</p>
      <div className="flex flex-wrap gap-2">
        {rows.map((r, i) => (
          <span key={i} className="text-xs text-slate-900 bg-white border border-slate-200 rounded px-2 py-1">
            {r.staff_name} × {r.quantity}
          </span>
        ))}
      </div>
    </div>
  );
}