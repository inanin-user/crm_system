// components/ExportMenu.tsx
"use client";

import { createPortal } from "react-dom";
import { useEffect, useState } from "react";

type ExportMenuProps = {
  open: boolean;
  onClose: () => void;
  // onExportPDF: () => void;
  onExportTXT: () => void;
  exporting: boolean;
};

export default function ExportMenu({ open, onClose, onExportTXT, exporting }: ExportMenuProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!open || !mounted) return null;

  const menuContent = (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-5"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-xs space-y-3"
      >
        <h3 className="text-center font-bold text-slate-700 mb-2">匯出報表 Export</h3>

        {/* <button
          onClick={() => { onExportPDF(); onClose(); }}
          disabled={exporting}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl shadow transition-all disabled:opacity-50"
        >
          {exporting ? "匯出中..." : "匯出 PDF"}
        </button> */}

        <button
          onClick={() => { onExportTXT(); onClose(); }}
          disabled={exporting}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl shadow transition-all disabled:opacity-50"
        >
          匯出 Excel
        </button>

        <button onClick={onClose} className="w-full text-slate-500 text-sm font-semibold py-2">
          取消 Cancel
        </button>
      </div>
    </div>
  );

  return createPortal(menuContent, document.body);
}