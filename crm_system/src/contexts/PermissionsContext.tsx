'use client';

import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { withBasePath } from '@/lib/basePath';
import { ModuleKey, getModuleForPath, isOpenPath } from '@/lib/permissions';

interface Ctx {
  ready: boolean;
  can: (m: ModuleKey) => boolean;
  isListed: (m: ModuleKey) => boolean;
  canPath: (pathname: string) => boolean;
  refresh: () => Promise<void>;
}

const PermissionsContext = createContext<Ctx | undefined>(undefined);

export function PermissionsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [modules, setModules] = useState<ModuleKey[]>([]);
  const [listed, setListed] = useState<ModuleKey[]>([]);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) { setModules([]); setListed([]); setReady(false); return; }
    try {
      const res = await fetch(withBasePath('/api/permissions/me'), { cache: 'no-store' });
      const data = await res.json();
      if (data.success) { setModules(data.data.modules); setListed(data.data.listed); }
    } catch (e) {
      console.error('載入權限失敗:', e);
    } finally {
      setReady(true);
    }
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  const can = (m: ModuleKey) => modules.includes(m);
  const isListed = (m: ModuleKey) => listed.includes(m);
  const canPath = (pathname: string) => {
    if (isOpenPath(pathname)) return true;
    const m = getModuleForPath(pathname);
    return m ? can(m) : user?.role === 'admin';
  };

  return (
    <PermissionsContext.Provider value={{ ready, can, isListed, canPath, refresh }}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions() {
  const ctx = useContext(PermissionsContext);
  if (!ctx) throw new Error('usePermissions must be used within PermissionsProvider');
  return ctx;
}