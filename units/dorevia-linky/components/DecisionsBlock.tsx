"use client";

/**
 * Bloc Décisions actives + Nouvelle décision — SPEC_DLP_UX_v0.1
 * Intégré après DivaFlashBlock dans le cockpit.
 */
import { useEffect, useState, useCallback } from "react";

interface Decision {
  id: string;
  title: string;
  intention: string;
  status: string;
}

interface DecisionsBlockProps {
  tenantId: string;
}

const MAX_DECISION_CHARS = 140;

export function DecisionsBlock({ tenantId }: DecisionsBlockProps) {
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [decisionsExpanded, setDecisionsExpanded] = useState(false); // Replié par défaut

  const fetchDecisions = useCallback(() => {
    fetch(`/api/dlp/dlps?tenant=${encodeURIComponent(tenantId)}&status=active`)
      .then((r) => r.json())
      .then((d) => setDecisions(Array.isArray(d) ? d : []))
      .catch(() => setDecisions([]))
      .finally(() => setLoading(false));
  }, [tenantId]);

  useEffect(() => {
    fetchDecisions();
  }, [fetchDecisions]);

  const msgLen = message.trim().length;
  const isOverLimit = msgLen > MAX_DECISION_CHARS;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const msg = message.trim();
    if (!msg || submitting || isOverLimit) return;

    setSubmitting(true);
    setFeedback(null);
    try {
      const r = await fetch("/api/dlp/decisions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, tenant_id: tenantId }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d?.error ?? "Erreur");
      setMessage("");
      fetchDecisions();
      setFeedback("Décision enregistrée.");
      setTimeout(() => setFeedback(null), 3000);
    } catch (e) {
      setFeedback(String(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-8 w-full max-w-2xl space-y-6 rounded-lg border border-[var(--border)] bg-[var(--card)] p-5">
      <button
        type="button"
        onClick={() => setDecisionsExpanded(!decisionsExpanded)}
        className="flex w-full items-center justify-between text-left text-base font-semibold text-[var(--text)] hover:opacity-80"
      >
        <span>🧠 Décisions actives</span>
        <span className="text-sm font-normal text-[var(--text-secondary)]">
          {loading ? "…" : decisions.length}
        </span>
        <svg
          className={`h-5 w-5 transition-transform ${decisionsExpanded ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {decisionsExpanded && (
        <>
          {loading ? (
            <p className="text-sm text-[var(--text-secondary)]">Chargement…</p>
          ) : decisions.length === 0 ? (
            <p className="text-sm text-[var(--text-secondary)]">Aucune décision enregistrée. Saisissez une nouvelle décision ci-dessous.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {decisions.map((d) => (
                <li key={d.id} className="rounded border border-[var(--border)] bg-[var(--bg)]/50 px-3 py-2 text-[var(--text)]">
                  {d.intention || d.title}
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      <div className="border-t border-[var(--border)] pt-5">
        <h4 className="mb-2 text-sm font-medium text-[var(--text)]">Nouvelle décision</h4>
        <form onSubmit={handleSubmit} className="space-y-2">
          <div className="relative">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ex. : On réduit notre dépendance au diesel"
              rows={2}
              disabled={submitting}
              className="w-full rounded border border-[var(--border)] bg-[var(--bg)] px-3 py-2 pr-16 text-sm text-[var(--text)] placeholder:text-[var(--text-secondary)] disabled:opacity-50"
            />
            <span className="absolute bottom-2 right-2 text-xs tabular-nums text-[var(--text-secondary)]">
              {msgLen} / {MAX_DECISION_CHARS}
            </span>
          </div>
          {isOverLimit && (
            <p className="text-xs text-[var(--text-secondary)]">
              La décision doit tenir en 140 caractères maximum.
            </p>
          )}
          <p className="text-xs text-[var(--text-secondary)]">
            Cette décision sera automatiquement suivie à partir des projets validés.
          </p>
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={!message.trim() || submitting || isOverLimit}
              className={`rounded px-4 py-2 text-sm font-semibold transition-colors ${
                message.trim() && !isOverLimit
                  ? "bg-[var(--accent)] text-white shadow-md hover:bg-[var(--accent)]/90 hover:shadow-lg"
                  : "bg-[var(--border)]/50 text-[var(--text-secondary)] opacity-60"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {submitting ? "Enregistrement…" : "Enregistrer"}
            </button>
            {feedback && (
              <span className={`text-sm ${feedback.includes("Contactez") ? "text-[var(--negative)]" : "text-[var(--positive)]"}`}>
                {feedback}
              </span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
