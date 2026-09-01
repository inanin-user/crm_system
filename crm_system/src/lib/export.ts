// lib/export.ts
import { LocationCode, useLocation } from "@/types/location";

type StaffItem = { staff_name: string; quantity: number };
type IncomeItem = { income_type: string; quantity: number; amount: number };
type LabelFn = (code: string) => string;
export type ExportRecord = {
  username: string;
  submittedAt: string;
  center: LocationCode;
  docDate: string;
  docTime: string;
  grandTotal: number;
  remarks: string | null;
  waterbar: StaffItem[];
  classItems: StaffItem[];
  introductionFee: StaffItem[];
  income: IncomeItem[];
};

type StaffMember = { username: string; center: LocationCode; role: string };

function escapeField(value: unknown): string {
  const str = String(value ?? "");
  return /["\,\n\r]/.test(str) ? '"' + str.replace(/"/g, '""') + '"' : str;
}

function qtyMap(items: StaffItem[]): Record<string, number> {
  const map: Record<string, number> = {};
  items.forEach(({ staff_name, quantity }) => {
    map[staff_name] = (map[staff_name] || 0) + (Number(quantity) || 0);
  });
  return map;
}

function incomeMaps(items: IncomeItem[]) {
  const qty: Record<string, number> = {};
  const amount: Record<string, number> = {};
  items.forEach(({ income_type, quantity, amount: a }) => {
    qty[income_type] = (qty[income_type] || 0) + (Number(quantity) || 0);
    amount[income_type] = (amount[income_type] || 0) + (Number(a) || 0);
  });
  return { qty, amount };
}

function columnsForSection(
  records: ExportRecord[],
  staffList: StaffMember[],
  type: "waterbar" | "classItems" | "introductionFee"
): string[] {
  const baseCols = staffList.filter((s) => s.role !== "admin").map((s) => s.username);
  const cols = [...baseCols];
  const seen = new Set(cols);
  records.forEach((record) => {
    (record[type] || []).forEach((item) => {
      if (!seen.has(item.staff_name)) {
        seen.add(item.staff_name);
        cols.push(item.staff_name);
      }
    });
  });
  return cols;
}

function columnsForIncome(records: ExportRecord[]): string[] {
  const cols = ["試", "單", "卡"];
  const seen = new Set(cols);
  records.forEach((record) => {
    (record.income || []).forEach((item) => {
      if (!seen.has(item.income_type)) {
        seen.add(item.income_type);
        cols.push(item.income_type);
      }
    });
  });
  return cols;
}

function formatSlashDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

export function exportToTXT(records: ExportRecord[], staffList: StaffMember[], currentUsername: string, label: LabelFn) {
  if (records.length === 0) {
    alert("沒有可匯出的資料");
    return;
  }

  const waterbarCols = columnsForSection(records, staffList, "waterbar");
  const classCols = columnsForSection(records, staffList, "classItems");
  const introFeeCols = columnsForSection(records, staffList, "introductionFee");
  const incomeCols = columnsForIncome(records);

  const headerRow1 = [
    "Center", "Date", "Time",
    "水吧項目", ...waterbarCols.slice(1).map(() => ""),
    "教班費(人數)", ...classCols.slice(1).map(() => ""),
    "介紹費", ...introFeeCols.slice(1).map(() => ""),
    "收入$", ...incomeCols.slice(1).map(() => ""), "",
    "每日總數", "Remarks",
  ];
  const headerRow2 = [
    "", "", "",
    ...waterbarCols,
    ...classCols,
    ...introFeeCols,
    "", ...incomeCols,
    "Ail pay", "",
  ];

  const rows: string[][] = [headerRow1, headerRow2];
  let grandTotal = 0;

  records
    .slice()
    .sort((a, b) => `${b.docDate} ${b.docTime}`.localeCompare(`${a.docDate} ${a.docTime}`))
    .forEach((record) => {
      const waterbarMap = qtyMap(record.waterbar || []);
      const classMap = qtyMap(record.classItems || []);
      const introFeeMap = qtyMap(record.introductionFee || []);
      const { qty: incomeQtyMap, amount: incomeAmountMap } = incomeMaps(record.income || []);

      const centerName = label(record.center);
      const dateDisplay = formatSlashDate(record.docDate);

      rows.push([
        centerName, dateDisplay, record.docTime,
        ...waterbarCols.map((col) => String(waterbarMap[col] ?? 0)),
        ...classCols.map((col) => String(classMap[col] ?? 0)),
        ...introFeeCols.map((col) => `$${introFeeMap[col] ?? 0}`),
        "人數", ...incomeCols.map((col) => String(incomeQtyMap[col] ?? "")),
        "",
        record.remarks || "",
      ]);

      rows.push([
        "", "", "",
        ...waterbarCols.map(() => ""),
        ...classCols.map(() => ""),
        ...introFeeCols.map(() => ""),
        "$", ...incomeCols.map((col) => String(incomeAmountMap[col] ?? "")),
        String(record.grandTotal ?? 0), "",
      ]);

      grandTotal += Number(record.grandTotal) || 0;
    });

  rows.push([
    "", "", "",
    ...waterbarCols.map(() => ""),
    ...classCols.map(() => ""),
    ...introFeeCols.map(() => ""),
    "總金額", ...incomeCols.map(() => ""),
    String(grandTotal), "",
  ]);

  const lines = rows.map((cols) => cols.map(escapeField).join(","));
  const bom = "\uFEFF";
  const content = bom + lines.join("\r\n") + "\r\n";

  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const dateStr = new Date().toISOString().split("T")[0];
  link.href = url;
  link.download = `結算報表_${currentUsername}_${dateStr}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function exportToPDF(elementId: string, currentUsername: string) {
  const element = document.getElementById(elementId);
  if (!element || !element.children.length) {
    alert("沒有可匯出的資料");
    return;
  }

  const html2canvas = (await import("html2canvas")).default;
  const { jsPDF } = await import("jspdf");

  const canvas = await html2canvas(element, {
    scale: 2,
    backgroundColor: "#ffffff",
    useCORS: true,
  });

  const pdf = new jsPDF("p", "mm", "a4");
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  const imgData = canvas.toDataURL("image/png");

  let heightLeft = imgHeight;
  let position = 0;

  pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  while (heightLeft > 0) {
    position -= pageHeight;
    pdf.addPage();
    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  const dateStr = new Date().toISOString().split("T")[0];
  pdf.save(`結算報表_${currentUsername}_${dateStr}.pdf`);
}