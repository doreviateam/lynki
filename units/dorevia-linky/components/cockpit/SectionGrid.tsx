"use client";

interface SectionGridProps {
  children: React.ReactNode;
  className?: string;
}

export function SectionGrid({ children, className = "" }: SectionGridProps) {
  return (
    <section
      className={`grid grid-cols-1 tablet:grid-cols-2 gap-4 mb-8 pb-6 border-b border-linky-border last:border-b-0 last:pb-0 last:mb-0 ${className}`}
    >
      {children}
    </section>
  );
}
