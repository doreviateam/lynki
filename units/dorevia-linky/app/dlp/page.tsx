"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Redirection /dlp → /admin/dlp-config (SPEC_DLP_UX_v0.1)
 * Compatibilité liens existants.
 */
export default function DlpRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/admin/dlp-config");
  }, [router]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg)]">
      <p className="text-sm text-[var(--text-secondary)]">Redirection…</p>
    </div>
  );
}
