const DESKTOP_ITEMS = [
  "Marge",
  "Trésorerie",
  "BFR",
  "Encours clients",
  "Retards",
  "Concentrations",
];

const MOBILE_ITEMS = ["Marge", "Trésorerie", "BFR", "Risque client"];

export const ReassuranceStrip = () => {
  return (
    <section
      className="border-y border-border/50 bg-muted/30 py-11 md:py-14"
      aria-label="Points de réassurance"
    >
      <div className="container">
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-4 text-[#1e3a5f] md:gap-x-6">
          {/* Version mobile : 4 items */}
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 md:hidden">
            {MOBILE_ITEMS.map((label, i) => (
              <span key={label} className="text-sm font-semibold tracking-tight">
                {i > 0 && <span className="mx-1.5 text-muted-foreground">·</span>}
                {label}
              </span>
            ))}
          </div>
          {/* Version desktop : 6 items */}
          <div className="hidden flex-wrap items-center justify-center gap-x-2 md:flex">
            {DESKTOP_ITEMS.map((label, i) => (
              <span key={label} className="text-sm font-semibold tracking-tight md:text-base">
                {i > 0 && <span className="mx-1.5 text-muted-foreground">·</span>}
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
