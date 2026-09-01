// components/ExportFab.tsx
"use client";

import { createPortal } from "react-dom";
import { useEffect, useState } from "react";

type ExportFabProps = {
  onClick: () => void;
};

export default function ExportFab({ onClick }: ExportFabProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  const fab = (
    <button
      id="export-fab"
      onClick={onClick}
      className="fixed bottom-6 right-6 z-40 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full shadow-lg p-4 transition-all active:scale-95 flex items-center justify-center"
    // className="fixed bottom-6 right-6 z-40 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full shadow-lg p-4 active:scale-95 flex items-center justify-center"
      aria-label="匯出報表"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
    </button>
  );

  return createPortal(fab, document.body);
}