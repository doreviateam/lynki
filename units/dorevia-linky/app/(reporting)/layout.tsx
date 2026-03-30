"use client";

import { Suspense } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";

export default function ReportingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Suspense fallback={<div className="fixed left-0 top-0 z-50 hidden h-full w-72 bg-[var(--sidebar-bg)] lg:block" aria-hidden />}>
        <Sidebar />
      </Suspense>
      <div className="flex min-h-screen flex-col lg:ml-72">
        {children}
      </div>
      <Suspense fallback={null}>
        <BottomNav />
      </Suspense>
    </>
  );
}
