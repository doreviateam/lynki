"use client";

import { createContext, useContext, useState, useCallback } from "react";

const STORAGE_KEY = "linky-chart-expanded-active";

interface ChartExpandedContextValue {
  activeKey: string | null;
  setActiveKey: (key: string | null) => void;
}

const ChartExpandedContext = createContext<ChartExpandedContextValue | null>(null);

const DEFAULT_EXPANDED_KEY = "linky-treasury-chart-expanded";

export function ChartExpandedProvider({ children }: { children: React.ReactNode }) {
  // Trésorerie validée (Répartition) dépliée par défaut ; autres repliées (SPEC §5.2)
  const [activeKey, setActiveKeyState] = useState<string | null>(DEFAULT_EXPANDED_KEY);

  const setActiveKey = useCallback((key: string | null) => {
    setActiveKeyState(key);
    try {
      if (key) sessionStorage.setItem(STORAGE_KEY, key);
      else sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <ChartExpandedContext.Provider value={{ activeKey, setActiveKey }}>
      {children}
    </ChartExpandedContext.Provider>
  );
}

export function useChartExpanded() {
  const ctx = useContext(ChartExpandedContext);
  return ctx;
}
