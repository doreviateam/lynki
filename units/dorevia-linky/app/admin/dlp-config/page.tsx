"use client";

/**
 * Page Paramétrage DLP — Admin uniquement (SPEC_DLP_UX_v0.1).
 * Sociétés, Périmètres, Mapping projet → périmètre. Pas de création DLP.
 */
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

const DEFAULT_TENANT = "core";

interface Company {
  id: string;
  external_id: string;
  name: string;
}

interface Perimeter {
  id: string;
  name: string;
  company_id: string;
  company_name?: string;
}

interface ProjectPerimeterMap {
  id: string;
  project_external_id: string;
  business_perimeter_id: string;
  business_perimeter_name?: string;
}

export default function DlpConfigPage() {
  const [tenantId, setTenantId] = useState(DEFAULT_TENANT);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [perimeters, setPerimeters] = useState<Perimeter[]>([]);
  const [mappings, setMappings] = useState<ProjectPerimeterMap[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(() => {
    setLoading(true);
    setError(null);
    const t = tenantId;
    Promise.all([
      fetch(`/api/dlp/companies?tenant=${encodeURIComponent(t)}`).then((r) => r.json()),
      fetch(`/api/dlp/perimeters?tenant=${encodeURIComponent(t)}`).then((r) => r.json()),
      fetch(`/api/dlp/project-perimeter-map?tenant=${encodeURIComponent(t)}`).then((r) => r.json()),
    ])
      .then(([companiesRes, perimetersRes, mappingsRes]) => {
        setCompanies(Array.isArray(companiesRes) ? companiesRes : []);
        setPerimeters(Array.isArray(perimetersRes) ? perimetersRes : []);
        setMappings(Array.isArray(mappingsRes) ? mappingsRes : []);
      })
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, [tenantId]);

  useEffect(() => {
    fetch("/api/tenant")
      .then((r) => r.json())
      .then((d) => setTenantId(d?.tenant_id ?? DEFAULT_TENANT))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (tenantId) fetchAll();
  }, [tenantId, fetchAll]);

  if (loading && companies.length === 0) {
    return (
      <div className="min-h-screen bg-[var(--bg)] p-6">
        <p className="text-[var(--text-secondary)]">Chargement…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <header className="border-b border-[var(--border)] bg-[var(--card)] px-4 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Link href="/" className="text-sm font-medium text-[var(--accent)] hover:underline">
            ← Retour au cockpit
          </Link>
          <h1 className="text-lg font-semibold text-[var(--text)]">Paramétrage des décisions</h1>
        </div>
      </header>
      <main className="mx-auto max-w-4xl p-6">
        {error && (
          <div className="mb-4 rounded border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}
        <DlpConfigContent
          tenantId={tenantId}
          companies={companies}
          perimeters={perimeters}
          mappings={mappings}
          onRefresh={fetchAll}
        />
      </main>
    </div>
  );
}

function DlpConfigContent({
  tenantId,
  companies,
  perimeters,
  mappings,
  onRefresh,
}: {
  tenantId: string;
  companies: Company[];
  perimeters: Perimeter[];
  mappings: ProjectPerimeterMap[];
  onRefresh: () => void;
}) {
  const [showCreateCompany, setShowCreateCompany] = useState(false);
  const [showCreatePerimeter, setShowCreatePerimeter] = useState(false);
  const [showCreateMapping, setShowCreateMapping] = useState(false);

  return (
    <div className="space-y-8">
      <section className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
        <h2 className="mb-3 text-base font-semibold text-[var(--text)]">Sociétés</h2>
        <p className="mb-3 text-xs text-[var(--text-secondary)]">
          Sociétés du tenant. Synchronisez depuis la configuration ou ajoutez manuellement.
        </p>
        <ul className="mb-3 space-y-1 text-sm">
          {companies.map((c) => (
            <li key={c.id} className="flex justify-between">
              <span className="text-[var(--text)]">{c.name}</span>
              <span className="text-[var(--text-secondary)]">{c.external_id}</span>
            </li>
          ))}
        </ul>
        {showCreateCompany ? (
          <CreateCompanyForm
            tenantId={tenantId}
            onSuccess={() => {
              setShowCreateCompany(false);
              onRefresh();
            }}
            onCancel={() => setShowCreateCompany(false)}
          />
        ) : (
          <div className="flex flex-wrap gap-2">
            <SyncCompaniesButton tenantId={tenantId} onSuccess={onRefresh} />
            <button
              type="button"
              onClick={() => setShowCreateCompany(true)}
              className="rounded border border-[var(--border)] bg-[var(--bg)] px-3 py-1.5 text-sm text-[var(--text)] hover:bg-[var(--border)]"
            >
              + Ajouter une société
            </button>
          </div>
        )}
      </section>

      <section className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
        <h2 className="mb-3 text-base font-semibold text-[var(--text)]">Périmètres métier</h2>
        <p className="mb-3 text-xs text-[var(--text-secondary)]">
          Périmètres rattachés aux sociétés (ex: Retail, Export, Structuration).
        </p>
        <ul className="mb-3 space-y-1 text-sm">
          {perimeters.map((p) => (
            <li key={p.id} className="flex justify-between">
              <span className="text-[var(--text)]">{p.name}</span>
              <span className="text-[var(--text-secondary)]">{p.company_name ?? p.company_id}</span>
            </li>
          ))}
        </ul>
        {showCreatePerimeter ? (
          <CreatePerimeterForm
            tenantId={tenantId}
            companies={companies}
            onSuccess={() => {
              setShowCreatePerimeter(false);
              onRefresh();
            }}
            onCancel={() => setShowCreatePerimeter(false)}
          />
        ) : (
          <button
            type="button"
            onClick={() => setShowCreatePerimeter(true)}
            disabled={companies.length === 0}
            className="rounded border border-[var(--border)] bg-[var(--bg)] px-3 py-1.5 text-sm text-[var(--text)] hover:bg-[var(--border)] disabled:opacity-50"
          >
            + Ajouter un périmètre
          </button>
        )}
      </section>

      <section className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
        <h2 className="mb-3 text-base font-semibold text-[var(--text)]">Mapping projet Odoo → périmètre</h2>
        <p className="mb-3 text-xs text-[var(--text-secondary)]">
          Associez chaque projet Odoo (project_id) à un périmètre métier pour que les validations timesheet génèrent des hits.
        </p>
        <ul className="mb-3 space-y-1 text-sm">
          {mappings.map((m) => (
            <li key={m.id} className="flex justify-between">
              <span className="text-[var(--text)]">Projet {m.project_external_id}</span>
              <span className="text-[var(--text-secondary)]">
                → {perimeters.find((p) => p.id === m.business_perimeter_id)?.name ?? m.business_perimeter_id}
              </span>
            </li>
          ))}
        </ul>
        {showCreateMapping ? (
          <CreateMappingForm
            tenantId={tenantId}
            perimeters={perimeters}
            onSuccess={() => {
              setShowCreateMapping(false);
              onRefresh();
            }}
            onCancel={() => setShowCreateMapping(false)}
          />
        ) : (
          <button
            type="button"
            onClick={() => setShowCreateMapping(true)}
            disabled={perimeters.length === 0}
            className="rounded border border-[var(--border)] bg-[var(--bg)] px-3 py-1.5 text-sm text-[var(--text)] hover:bg-[var(--border)] disabled:opacity-50"
          >
            + Ajouter un mapping
          </button>
        )}
      </section>
    </div>
  );
}

function SyncCompaniesButton({ tenantId, onSuccess }: { tenantId: string; onSuccess: () => void }) {
  const [syncing, setSyncing] = useState(false);
  const handleSync = async () => {
    setSyncing(true);
    try {
      const r = await fetch(`/api/dlp/sync-companies?tenant=${encodeURIComponent(tenantId)}`, { method: "POST" });
      const d = await r.json();
      if (!r.ok) throw new Error(d?.error ?? "Erreur");
      if (d.created > 0 || d.skipped > 0) onSuccess();
      if (d.errors?.length) alert(d.message + "\n" + d.errors.join("\n"));
    } catch (e) {
      alert(String(e));
    } finally {
      setSyncing(false);
    }
  };
  return (
    <button
      type="button"
      onClick={handleSync}
      disabled={syncing}
      className="rounded border border-[var(--accent)] bg-[var(--accent)]/10 px-3 py-1.5 text-sm text-[var(--accent)] hover:bg-[var(--accent)]/20 disabled:opacity-50"
    >
      {syncing ? "Synchronisation…" : "Synchroniser depuis la config"}
    </button>
  );
}

function CreateCompanyForm({
  tenantId,
  onSuccess,
  onCancel,
}: {
  tenantId: string;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [externalId, setExternalId] = useState("");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!externalId.trim() || !name.trim()) return;
    setSubmitting(true);
    try {
      const r = await fetch("/api/dlp/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenant_id: tenantId, external_id: externalId.trim(), name: name.trim() }),
      });
      if (!r.ok) throw new Error((await r.json()).error ?? "Erreur");
      onSuccess();
    } catch (e) {
      alert(String(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="space-y-2">
      <input
        type="text"
        placeholder="external_id (ex: odoo:1)"
        value={externalId}
        onChange={(e) => setExternalId(e.target.value)}
        className="w-full rounded border border-[var(--border)] bg-[var(--bg)] px-2 py-1.5 text-sm text-[var(--text)]"
      />
      <input
        type="text"
        placeholder="Nom"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full rounded border border-[var(--border)] bg-[var(--bg)] px-2 py-1.5 text-sm text-[var(--text)]"
      />
      <div className="flex gap-2">
        <button type="submit" disabled={submitting} className="rounded bg-[var(--accent)] px-3 py-1.5 text-sm text-white">Créer</button>
        <button type="button" onClick={onCancel} className="rounded border border-[var(--border)] px-3 py-1.5 text-sm">Annuler</button>
      </div>
    </form>
  );
}

function CreatePerimeterForm({
  tenantId,
  companies,
  onSuccess,
  onCancel,
}: {
  tenantId: string;
  companies: Company[];
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [companyId, setCompanyId] = useState("");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!companyId || !name.trim()) return;
    setSubmitting(true);
    try {
      const r = await fetch("/api/dlp/perimeters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenant_id: tenantId, company_id: companyId, name: name.trim() }),
      });
      if (!r.ok) throw new Error((await r.json()).error ?? "Erreur");
      onSuccess();
    } catch (e) {
      alert(String(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="space-y-2">
      <select
        value={companyId}
        onChange={(e) => setCompanyId(e.target.value)}
        className="w-full rounded border border-[var(--border)] bg-[var(--bg)] px-2 py-1.5 text-sm text-[var(--text)]"
      >
        <option value="">— Société —</option>
        {companies.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
      <input
        type="text"
        placeholder="Nom du périmètre"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full rounded border border-[var(--border)] bg-[var(--bg)] px-2 py-1.5 text-sm text-[var(--text)]"
      />
      <div className="flex gap-2">
        <button type="submit" disabled={submitting} className="rounded bg-[var(--accent)] px-3 py-1.5 text-sm text-white">Créer</button>
        <button type="button" onClick={onCancel} className="rounded border border-[var(--border)] px-3 py-1.5 text-sm">Annuler</button>
      </div>
    </form>
  );
}

function CreateMappingForm({
  tenantId,
  perimeters,
  onSuccess,
  onCancel,
}: {
  tenantId: string;
  perimeters: Perimeter[];
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [projectId, setProjectId] = useState("");
  const [perimeterId, setPerimeterId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!projectId.trim() || !perimeterId) return;
    setSubmitting(true);
    try {
      const r = await fetch("/api/dlp/project-perimeter-map", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_id: tenantId,
          source_system: "odoo",
          project_external_id: projectId.trim(),
          business_perimeter_id: perimeterId,
        }),
      });
      if (!r.ok) throw new Error((await r.json()).error ?? "Erreur");
      onSuccess();
    } catch (e) {
      alert(String(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="space-y-2">
      <input
        type="text"
        placeholder="ID projet Odoo (project.project.id)"
        value={projectId}
        onChange={(e) => setProjectId(e.target.value)}
        className="w-full rounded border border-[var(--border)] bg-[var(--bg)] px-2 py-1.5 text-sm text-[var(--text)]"
      />
      <select
        value={perimeterId}
        onChange={(e) => setPerimeterId(e.target.value)}
        className="w-full rounded border border-[var(--border)] bg-[var(--bg)] px-2 py-1.5 text-sm text-[var(--text)]"
      >
        <option value="">— Périmètre —</option>
        {perimeters.map((p) => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </select>
      <div className="flex gap-2">
        <button type="submit" disabled={submitting} className="rounded bg-[var(--accent)] px-3 py-1.5 text-sm text-white">Ajouter</button>
        <button type="button" onClick={onCancel} className="rounded border border-[var(--border)] px-3 py-1.5 text-sm">Annuler</button>
      </div>
    </form>
  );
}
