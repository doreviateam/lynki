"use client";

import React from "react";
import { DEFAULT_PRODUCT_NAME } from "@/app/lib/tenant-config-defaults";

/**
 * Error boundary autour du contenu dashboard : si un composant enfant lance une erreur
 * au premier rendu après sélection d’un espace, on affiche un écran « Réessayer » au lieu
 * de l’erreur globale, et le retry re-monte le sous-arbre (config tenant alors prête).
 */
interface State {
  hasError: boolean;
  error: Error | null;
}

export class DashboardErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[Linky] DashboardErrorBoundary:", error?.message, error?.stack, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--bg)] px-4 py-12">
          <div className="w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm text-center">
            <h1 className="text-lg font-semibold text-[var(--text)]">
              {DEFAULT_PRODUCT_NAME}
            </h1>
            <p className="mt-4 text-sm text-[var(--text-secondary)]">
              Un problème est survenu au chargement de l’espace.
            </p>
            <button
              type="button"
              onClick={() => this.setState({ hasError: false, error: null })}
              className="mt-6 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            >
              Réessayer
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
