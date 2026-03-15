"use client";

interface CockpitLayoutProps {
  children: React.ReactNode;
}

export function CockpitLayout({ children }: CockpitLayoutProps) {
  return (
    <main
      id="main"
      className="max-w-[1200px] mx-auto px-4 py-4 tablet:px-6 tablet:py-6 bg-linky-bg min-h-screen text-linky-text"
      role="main"
      tabIndex={-1}
    >
      {children}
    </main>
  );
}
