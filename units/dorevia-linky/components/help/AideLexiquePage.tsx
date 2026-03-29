import { lexiquePilotageRows } from "@/app/lib/cockpit/lexique-pilotage";

export function AideLexiquePage() {
  const rows = lexiquePilotageRows();

  return (
    <main className="mx-auto max-w-3xl px-6 py-8 text-[var(--text)]">
      <h1 className="text-2xl font-extrabold tracking-tight">Aide</h1>
      <p className="mt-2 text-sm text-[var(--text-secondary)]">
        Ressources de lecture du cockpit <strong className="text-[var(--text)]">Pilotage</strong>. Le lexique ci-dessous
        reprend les libellés visibles à l’écran ; la référence normative détaillée reste la doctrine produit Web60.
      </p>

      <section id="lexique" className="mt-10 scroll-mt-24">
        <h2 className="text-lg font-bold tracking-tight">Lexique Pilotage</h2>
        <p className="mt-1 text-xs text-[var(--muted)]">
          États et qualificateurs les plus fréquents sur les cartes et badges.
        </p>
        <dl className="mt-6 space-y-4 border-t border-[var(--border)] pt-6">
          {rows.map(({ key, label, hint }) => (
            <div key={key} className="grid gap-1 sm:grid-cols-[minmax(0,11rem)_1fr] sm:items-baseline">
              <dt className="font-semibold text-[var(--text)]">{label}</dt>
              <dd className="text-sm text-[var(--text-secondary)]">{hint}</dd>
            </div>
          ))}
        </dl>
      </section>
    </main>
  );
}
