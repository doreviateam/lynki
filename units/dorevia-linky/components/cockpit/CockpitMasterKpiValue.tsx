"use client";

import { splitMasterAmountForNoWrapEuro } from "@/app/lib/format";
import {
  COCKPIT_T2_MASTER_VALUE_EURO,
  COCKPIT_T2_MASTER_VALUE_PLAIN,
  COCKPIT_T2_MASTER_VALUE_SCROLL,
} from "@/app/lib/cockpit/cockpit-typography";

const MOBILE_SCROLL =
  "min-w-0 flex-1 overflow-x-auto whitespace-nowrap text-base font-black tabular-nums leading-tight tracking-tight text-[var(--text)] [scrollbar-width:thin]";
const MOBILE_EURO =
  "shrink-0 text-base font-black tabular-nums leading-tight tracking-tight text-[var(--text)]";
const MOBILE_BOLD_SCROLL =
  "min-w-0 flex-1 overflow-x-auto whitespace-nowrap text-base font-bold tabular-nums leading-tight text-[var(--text)] [scrollbar-width:thin]";
const MOBILE_BOLD_EURO =
  "shrink-0 text-base font-bold tabular-nums leading-tight text-[var(--text)]";

export function CockpitMasterKpiValue({
  display,
  variant = "desktop",
  /** Business / Flux net mobile : `bold` pour coller au style existant */
  mobileWeight = "black",
}: {
  display: string;
  variant?: "desktop" | "mobile";
  mobileWeight?: "black" | "bold";
}) {
  const top = variant === "desktop" ? "mt-2" : "mt-1.5";
  const t = display.trim();
  if (t === "" || t === "—") {
    const plain =
      variant === "desktop"
        ? COCKPIT_T2_MASTER_VALUE_PLAIN
        : mobileWeight === "bold"
          ? "text-base font-bold tabular-nums text-[var(--text)]"
          : "text-base font-black tabular-nums text-[var(--text)]";
    return (
      <div className={`${top} ${plain}`}>—</div>
    );
  }

  const { body, euroTail } = splitMasterAmountForNoWrapEuro(display);
  const scrollClass =
    variant === "desktop"
      ? COCKPIT_T2_MASTER_VALUE_SCROLL
      : mobileWeight === "bold"
        ? MOBILE_BOLD_SCROLL
        : MOBILE_SCROLL;
  const euroClass =
    variant === "desktop" ? COCKPIT_T2_MASTER_VALUE_EURO : mobileWeight === "bold" ? MOBILE_BOLD_EURO : MOBILE_EURO;

  if (!euroTail) {
    return (
      <div className={`${top} ${scrollClass} max-w-full`}>{body}</div>
    );
  }

  return (
    <div className={`${top} flex min-w-0 max-w-full items-baseline gap-1`}>
      <span className={scrollClass}>{body}</span>
      <span className={euroClass}>
        {euroTail.startsWith(" ") || euroTail.startsWith("\u00a0") || euroTail.startsWith("\u202f") ? "" : "\u202f"}
        {euroTail.trimStart()}
      </span>
    </div>
  );
}
