// app/edit/page.tsx
"use client";
import ModifyHistoryModal, { HistoryEntry } from "@/app/components/ModifyHistoryModal";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { parseAccountList, StaffMember } from "@/app/components/StaffSection";
import { withBasePath, withDailySettlementPath } from "@/lib/basePath";
import { LocationCode, useLocation } from "@/types/location";
import IntroductionFeeSection, {
    IntroductionFeeRow,
    emptyIntroductionFeeRow,
    incomeRowTotal,
} from "@/app/components/IntroductionFeeSection";
import { useSidebar } from "@/contexts/SidebarContext";


type StaffRow = { id: number; staffName: string; quantity: number };

let rowIdCounter = 0;
const nextId = () => ++rowIdCounter;

const toStaffRows = (rows: { staffName: string; quantity: number }[]): StaffRow[] =>
    rows.length
        ? rows.map((r) => ({ id: nextId(), ...r }))
        : [{ id: nextId(), staffName: "", quantity: 0 }];

const toIncomeRows = (
    rows: { staffName?: string; quantity: number; incomeType?: string; amount?: number }[]
): IntroductionFeeRow[] =>
    rows.length
        ? rows.map((r) => ({
            id: nextId(),
            incomeType: r.incomeType || "試",
            amount: Number(r.amount) || 0,
            staffName: r.staffName || "",
            quantity: Number(r.quantity) || 0,
        }))
        : [emptyIntroductionFeeRow(nextId())];

function EditPageInner() {

    const { setDisableGPULayer } = useSidebar();
    
    const searchParams = useSearchParams();
    const recordUsername = searchParams.get("username") || "";
    const recordSubmittedAt = searchParams.get("submittedAt") || "";

    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [staffList, setStaffList] = useState<StaffMember[]>([]);

    const [center, setCenter] = useState("");
    const [docDate, setDocDate] = useState("");
    const [docTime, setDocTime] = useState("");
    const [waterbar, setWaterbar] = useState<StaffRow[]>([]);
    const [classItems, setClassItems] = useState<StaffRow[]>([]);
    const [income, setIncome] = useState<IntroductionFeeRow[]>([]);
    const [remarks, setRemarks] = useState("");

    const [submitting, setSubmitting] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [history, setHistory] = useState<HistoryEntry[] | null>(null);
    const [historyLoading, setHistoryLoading] = useState(false);
    const { label } = useLocation();

    useEffect(() => {
        setDisableGPULayer(true);
        return () => setDisableGPULayer(false);
    }, [setDisableGPULayer]);

    useEffect(() => {
        if (!recordUsername || !recordSubmittedAt) {
            setNotFound(true);
            setLoading(false);
            return;
        }
        fetch(
            withDailySettlementPath(
                `/api/settlement?username=${encodeURIComponent(
                    recordUsername
                )}&submittedAt=${encodeURIComponent(recordSubmittedAt)}`
            )
        )
            .then((res) => {
                if (!res.ok) throw new Error("fetch failed");
                return res.json();
            })
            .then((data) => {
                setCenter(data.center);
                setDocDate(data.docDate);
                setDocTime(data.docTime.slice(0, 5)); // HH:MM for <input type="time">
                setWaterbar(toStaffRows(data.waterbar));
                setClassItems(toStaffRows(data.classItems));
                setIncome(toIncomeRows(data.income?.length ? data.income : (data.introductionFee || [])));
                setRemarks(data.remarks || "");
            })
            .catch(() => setNotFound(true))
            .finally(() => setLoading(false));

        fetch(withBasePath("/api/accounts"))
            .then((res) => res.json())
            .then((data) => setStaffList(parseAccountList(data.data)))
            .catch(() => { });
    }, [recordUsername, recordSubmittedAt]);

    const grandTotal = useMemo(
        () => income.reduce((sum, row) => sum + incomeRowTotal(row), 0),
        [income]
    );

    const addRow = (setter: React.Dispatch<React.SetStateAction<StaffRow[]>>) =>
        setter((rows) => [...rows, { id: nextId(), staffName: "", quantity: 0 }]);
    const removeRow = (setter: React.Dispatch<React.SetStateAction<StaffRow[]>>, id: number) =>
        setter((rows) => (rows.length > 1 ? rows.filter((r) => r.id !== id) : rows));
    const updateRow = (
        setter: React.Dispatch<React.SetStateAction<StaffRow[]>>,
        id: number,
        field: "staffName" | "quantity",
        value: string | number
    ) => setter((rows) => rows.map((r) => (r.id === id ? { ...r, [field]: value } : r)));


    const addIncomeRow = () =>
        setIncome((rows) => [...rows, emptyIntroductionFeeRow(nextId())]);
    const removeIncomeRow = (id: number) =>
        setIncome((rows) => (rows.length > 1 ? rows.filter((r) => r.id !== id) : rows));
    const updateIncomeRow = (id: number, field: keyof IntroductionFeeRow, value: string | number) =>
        setIncome((rows) => rows.map((r) => (r.id === id ? { ...r, [field]: value } : r)));

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            const res = await fetch(withDailySettlementPath("/api/update-data"), {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    username: recordUsername,
                    submittedAt: recordSubmittedAt,
                    center,
                    docDate,
                    docTime,
                    grandTotal,
                    remarks,
                    waterbar: waterbar.filter((r) => r.staffName),
                    classItems: classItems.filter((r) => r.staffName),
                    income: income.filter((r) => r.staffName || r.amount || r.quantity),
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                alert(data.error || "更新失敗");
                return;
            }
            if (!data.changed) {
                alert("沒有任何變更");
                return;
            }
            alert("更新成功");
            window.location.href = `${withDailySettlementPath("/view-data")}`;
        } catch (err) {
            console.error("Update error:", err);
            alert("伺服器錯誤，請稍後再試");
        } finally {
            setSubmitting(false);
        }
    };

    const loadHistory = async () => {
        setShowHistory((v) => !v);
        if (history !== null) return; // already loaded
        setHistoryLoading(true);
        try {
            const res = await fetch(
                withDailySettlementPath(
                    `/api/modifiedHistory?username=${encodeURIComponent(
                        recordUsername
                    )}&submittedAt=${encodeURIComponent(recordSubmittedAt)}`
                )
            );
            const data = await res.json();
            setHistory(data.history || []);
        } catch (err) {
            console.error("history fetch error:", err);
            setHistory([]);
        } finally {
            setHistoryLoading(false);
        }
    };

    if (loading) return <div className="p-10 text-center text-slate-400">載入中...</div>;
    if (notFound) return <div className="p-10 text-center text-red-500">找不到此記錄</div>;

    return (
        <div id="edit-screen">
            <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-200">
                <div className="relative bg-slate-800 p-6 text-white">
                    <button
                        onClick={() => (window.location.href = `${withDailySettlementPath("/view-data")}`)}
                        className="absolute left-6 top-6 flex items-center gap-1 text-slate-300 bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl shadow-lg text-sm transition-all"
                    >
                        返回
                    </button>

                    <div className="text-center">
                        <h1 className="text-2xl font-black tracking-tight">編輯結算記錄</h1>
                        <p className="text-slate-400 text-sm mt-1">
                            {recordUsername} · {recordSubmittedAt.replace("T", " ").slice(0, 19)}
                        </p>
                    </div>
                </div>
                <div className="p-6 space-y-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">結算日期</label>
                            <input
                                type="date"
                                value={docDate}
                                disabled
                                className="input-field w-full bg-slate-100 text-slate-500 cursor-not-allowed"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">結算時間</label>
                            <input
                                type="time"
                                value={docTime}
                                disabled
                                className="input-field w-full bg-slate-100 text-slate-500 cursor-not-allowed"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">分店</label>
                        <select value={center} onChange={(e) => setCenter(e.target.value)} className="input-field w-full">
                            {Object.values(LocationCode).map((code) => (
                                <option key={code} value={code}>
                                    {label(code)}
                                </option>
                            ))}
                        </select>
                    </div>

                    <StaffSection title="1. 水吧項目" rows={waterbar} staffList={staffList}
                        onAdd={() => addRow(setWaterbar)} onRemove={(id) => removeRow(setWaterbar, id)}
                        onChange={(id, f, v) => updateRow(setWaterbar, id, f, v)} />
                    <StaffSection title="2. 教班 (人數)" rows={classItems} staffList={staffList}
                        onAdd={() => addRow(setClassItems)} onRemove={(id) => removeRow(setClassItems, id)}
                        onChange={(id, f, v) => updateRow(setClassItems, id, f, v)} />
                    

                    <hr className="border-slate-200" />

                    {/* <div className="section-group">
                        <div className="label-title">
                            <span>3. 每日收入明細</span>
                        </div>
                        <div className="rows-area space-y-2">
                            {income.map((row) => (
                                <div key={row.id} className="row-container bg-blue-50/50">
                                    <select value={row.incomeType} onChange={(e) => updateIncomeRow(row.id, "incomeType", e.target.value)} className="input-field w-28">
                                        <option value="試">試</option>
                                        <option value="單">單</option>
                                        <option value="卡">卡</option>
                                    </select>
                                    <input type="number" min="0" placeholder="數量" value={row.quantity}
                                        onChange={(e) => updateIncomeRow(row.id, "quantity", Number(e.target.value))}
                                        className="input-field w-20 number" />
                                    <input type="number" min="0" placeholder="$ 金額" value={row.amount}
                                        onChange={(e) => updateIncomeRow(row.id, "amount", Number(e.target.value))}
                                        className="input-field flex-1 min-w-0" />
                                    <span className="btn-icon btn-add" onClick={addIncomeRow}>⊕</span>
                                    <span className="btn-icon btn-del" onClick={() => removeIncomeRow(row.id)}>−</span>
                                </div>
                            ))}
                        </div>
                    </div>
*/}

                    <IntroductionFeeSection title="3. 每日收入明細" rows={income} staffList={staffList}
                        onAdd={addIncomeRow} onRemove={removeIncomeRow}
                        onChange={updateIncomeRow} />


                    <div className="bg-slate-900 rounded-xl p-6 text-white flex justify-between items-center shadow-inner">
                        <span className="text-lg font-bold text-slate-400">每日總金額 TOTAL</span>
                        <span className="text-4xl font-black text-yellow-400">$ {grandTotal}</span>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">備註 Remarks</label>
                        <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} className="input-field w-full h-24 resize-none p-2" />
                    </div>

                    <button onClick={handleSubmit} disabled={submitting}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg active:scale-[0.98] transition-all text-lg disabled:opacity-50">
                        {submitting ? "提交中..." : "確認並提交變更"}
                    </button>

                    <button onClick={loadHistory}
                        className="w-full bg-slate-600 hover:bg-slate-700 text-white font-bold py-3 rounded-xl shadow transition-all">
                        顯示修改記錄
                    </button>

                </div>
            </div>
            <ModifyHistoryModal
                open={showHistory}
                onClose={() => setShowHistory(false)}
                loading={historyLoading}
                history={history}
            />
        </div>
    );
}

function StaffSection({
    title, rows, staffList, onAdd, onRemove, onChange,
}: {
    title: string;
    rows: StaffRow[];
    staffList: StaffMember[];
    onAdd: () => void;
    onRemove: (id: number) => void;
    onChange: (id: number, field: "staffName" | "quantity", value: string | number) => void;
}) {
    return (
        <div className="section-group">
            <div className="label-title">
                <span>{title}</span>
                {/* <span className="text-xs font-normal text-slate-400">{rows.length} 筆</span> */}
            </div>
            <div className="rows-area space-y-2">
                {rows.map((row) => (
                    <div key={row.id} className="row-container">
                        <select value={row.staffName} onChange={(e) => onChange(row.id, "staffName", e.target.value)} className="input-field flex-1 staff-select">
                            <option value="">請選擇職員</option>
                            {staffList.map((s) => (
                                <option key={s.username} value={s.username}>{s.username}</option>
                            ))}
                        </select>
                        <input type="number" min="0" placeholder="數量" value={row.quantity}
                            onChange={(e) => onChange(row.id, "quantity", Number(e.target.value))} className="input-field w-24" />
                        <span className="btn-icon btn-add" onClick={onAdd}>⊕</span>
                        <span className="btn-icon btn-del" onClick={() => onRemove(row.id)}>−</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function EditPage() {
    return (
        <Suspense fallback={<div className="p-10 text-center text-slate-400">載入中...</div>}>
            <EditPageInner />
        </Suspense>
    );
}