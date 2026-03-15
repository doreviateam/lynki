"use client";

export type BadgeVariant = "success" | "warning" | "danger" | "info";

interface BadgeProps {
  variant: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  success: "bg-[rgba(34,197,94,0.15)] text-linky-success",
  warning: "bg-[rgba(245,158,11,0.15)] text-linky-warning",
  danger: "bg-[rgba(239,68,68,0.15)] text-linky-danger",
  info: "bg-[rgba(59,130,246,0.15)] text-linky-info",
};

export function Badge({ variant, children, className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded-linky-badge text-linky-label font-semibold ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
