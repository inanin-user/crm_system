'use client';

import { useEffect, useMemo, useState } from 'react';
import { withBasePath } from '@/lib/basePath';
import { usePermissions } from '@/contexts/PermissionsContext';
import { EDITABLE_ROLES, MODULES, ROLE_LABELS, Role } from '@/lib/permissions';

type Matrix = Record<string, Role[]>;

export default function PermissionsPage() {
  const { refresh } = usePermissions();
  const [matrix, setMatrix] = useState<Matrix>({});
  const [saved, setSaved] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(withBasePath('/api/security/permissions'), { cache: 'no-store' });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setMatrix(data.data.matrix);
      setSaved(JSON.stringify(data.data.matrix));
    } catch (e) {
      setError(e instanceof Error ? e.message : '載入失敗');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const dirty = useMemo(() => JSON.stringify(matrix) !== saved, [matrix, saved]);

  const toggle = (module: string, role: Role) =>
    setMatrix((prev) => {
      const list = prev[module] ?? [];
      return { ...prev, [module]: list.includes(role) ? list.filter((r) => r !== role) : [...list, role] };
    });

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await fetch(withBasePath('/api/security/permissions'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matrix }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setSaved(JSON.stringify(matrix));
      await refresh(); // update the menu for this admin as well
      alert('權限已儲存');
    } catch (e) {
      setError(e instanceof Error ? e.message : '儲存失敗');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">權限管理</h1>
          <p className="mt-1 text-sm text-gray-600">設定各角色可以使用的功能模組（管理員固定擁有全部權限）</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={load}
            disabled={loading || saving || !dirty}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            還原
          </button>
          <button
            onClick={save}
            disabled={loading || saving || !dirty}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {saving ? '儲存中...' : '儲存變更'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-600">{error}</div>
      )}

      <div className="bg-white shadow rounded-lg overflow-x-auto">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">功能模組</th>
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-400 whitespace-nowrap">
                  {ROLE_LABELS.admin}
                </th>
                {EDITABLE_ROLES.map((r) => (
                  <th key={r} className="px-3 py-3 text-center text-xs font-medium text-gray-500 whitespace-nowrap">
                    {ROLE_LABELS[r]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {MODULES.map((m) => (
                <tr key={m.key} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900 min-w-[16rem]">{m.label}</td>
                  <td className="px-3 py-3 text-center">
                    <input type="checkbox" checked disabled className="h-4 w-4 opacity-40" />
                  </td>
                  {EDITABLE_ROLES.map((r) => (
                    <td key={r} className="px-3 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={matrix[m.key]?.includes(r) ?? false}
                        onChange={() => toggle(m.key, r)}
                        className="h-4 w-4 accent-blue-600 cursor-pointer"
                        aria-label={`${ROLE_LABELS[r]} - ${m.label}`}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p className="mt-3 text-xs text-gray-500">
        修改後，其他用戶最多在重新整理頁面後生效；伺服器端 API 會立即套用新權限。
      </p>
    </div>
  );
}