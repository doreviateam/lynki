"use client";

export function BottomNav() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-20 flex border-t border-[var(--border)] bg-white/95 shadow-[0 -2px 10px rgba(15,23,42,0.04)] backdrop-blur-md pb-[env(safe-area-inset-bottom)]"
      aria-label="Navigation principale"
    >
      <div className="flex flex-1">
        <div className="flex flex-1 items-center justify-center py-4 text-sm font-bold text-[var(--accent)]">
          Board
        </div>
        <div className="flex flex-1 items-center justify-center py-4 text-sm font-semibold text-[var(--muted)]">
          Performance
        </div>
      </div>
    </nav>
  );
}
