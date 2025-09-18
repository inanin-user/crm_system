'use client'

import { ReactNode, memo, useMemo } from 'react';
import { useMobileDetection } from '@/hooks/useMobileDetection';

interface MobileTableProps<T = Record<string, unknown>> {
  data: T[];
  columns: {
    key: string;
    header: string;
    render?: (item: T) => ReactNode;
    mobileLabel?: string; // 移動端顯示的標籤
    hideOnMobile?: boolean; // 在移動端隱藏此列
  }[];
  onRowClick?: (item: T) => void;
  className?: string;
}

const MobileTable = memo(function MobileTable<T = Record<string, unknown>>({
  data,
  columns,
  onRowClick,
  className = ''
}: MobileTableProps<T>) {
  const { isMobile } = useMobileDetection();

  // 預計算過濾的列以避免重複計算
  const filteredColumns = useMemo(() => {
    return columns.filter(column => !column.hideOnMobile);
  }, [columns]);

  if (!isMobile) {
    // 桌面端使用原始表格
    return (
      <div className={`overflow-x-auto ${className}`}>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((item, index) => (
              <tr
                key={index}
                onClick={() => onRowClick?.(item)}
                className={onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''}
              >
                {columns.map((column) => (
                  <td key={column.key} className="px-6 py-4 whitespace-nowrap">
                    {column.render ? column.render(item) : (item as Record<string, unknown>)[column.key] as ReactNode}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // 移動端使用卡片式布局
  return (
    <div className={`space-y-3 ${className}`}>
      {data.map((item, index) => (
        <div
          key={index}
          onClick={() => onRowClick?.(item)}
          className={`bg-white rounded-lg border border-gray-200 p-4 ${
            onRowClick ? 'cursor-pointer active:bg-gray-50' : ''
          }`}
        >
          {filteredColumns.map((column) => {
              const value = column.render ? column.render(item) : (item as Record<string, unknown>)[column.key] as ReactNode;
              const label = column.mobileLabel || column.header;
              
              return (
                <div key={column.key} className="flex justify-between items-start mb-2 last:mb-0">
                  <span className="text-sm font-medium text-gray-600 min-w-0 flex-1">
                    {label}:
                  </span>
                  <span className="text-sm text-gray-900 ml-2 text-right min-w-0 flex-1">
                    {value}
                  </span>
                </div>
              );
            })}
        </div>
      ))}
      
      {data.length === 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <p className="text-gray-500">暫無資料</p>
        </div>
      )}
    </div>
  );
});

export default MobileTable;