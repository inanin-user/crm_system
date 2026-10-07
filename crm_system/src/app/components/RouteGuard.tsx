"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "../../contexts/PermissionsContext";

export default function RouteGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const pathname = usePathname(); // already excludes basePath
  const router = useRouter();

  const isPublic = pathname === "/login" || pathname === "/unauthorized";
  const { ready, canPath } = usePermissions();
  const allowed = isPublic || (!!user && ready && canPath(pathname));

  useEffect(() => {
    if (isPublic || isLoading || !user || !ready) return;
    if (!canPath(pathname)) router.replace("/unauthorized");
  }, [pathname, isPublic, isLoading, user, ready, canPath, router]);

  if (!isPublic && (isLoading || !ready || !allowed)) return null;
  return <>{children}</>;
}
