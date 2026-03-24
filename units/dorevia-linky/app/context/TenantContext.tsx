"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
  useMemo,
} from "react";
import { fetchTenantConfig } from "@/app/lib/tenant-config-client";
import type {
  TenantConfigResponse,
  TenantConfigError,
  TenantPermissions,
  TenantOption,
} from "@/app/lib/tenant-types";

export type { TenantConfigError, TenantPermissions, TenantOption };

export interface TenantContextValue {
  requestedTenant: string | null;
  resolvedTenant: string | null;
  hasResolvedOnce: boolean;
  tenantConfig: TenantConfigResponse | null;
  permissions: TenantPermissions | null;
  availableTenants: TenantOption[];
  isLoading: boolean;
  error: TenantConfigError | null;
  setTenant: (id: string) => void;
}

const TenantContext = createContext<TenantContextValue | null>(null);

export function useTenantContext(): TenantContextValue {
  const ctx = useContext(TenantContext);
  if (!ctx) {
    throw new Error("useTenantContext must be used within TenantProvider");
  }
  return ctx;
}

export function useTenantContextOptional(): TenantContextValue | null {
  return useContext(TenantContext);
}

interface TenantProviderProps {
  children: React.ReactNode;
  /** Valeur initiale de requestedTenant (ex. déduite du host ou de l’URL). */
  requestedTenant: string | null;
  /** Optionnel : appelé quand setTenant(id) est invoqué (ex. pour mettre à jour l’URL). */
  onSetTenantNavigate?: (id: string) => void;
  /** Optionnel : appelé quand resolvedTenant change (rules of switch §5.2, §5.3). */
  onResolvedTenantChange?: (tenantId: string, config: TenantConfigResponse) => void;
}

/**
 * TenantContext provider (spec §8, backlog Phase 2).
 * Résolution requestedTenant → resolvedTenant avec anti-race et hasResolvedOnce.
 */
export function TenantProvider({ children, requestedTenant, onSetTenantNavigate, onResolvedTenantChange }: TenantProviderProps) {
  const [resolvedTenant, setResolvedTenant] = useState<string | null>(null);
  const [hasResolvedOnce, setHasResolvedOnce] = useState(false);
  const [tenantConfig, setTenantConfig] = useState<TenantConfigResponse | null>(null);
  const [permissions, setPermissions] = useState<TenantPermissions | null>(null);
  const [availableTenants, setAvailableTenants] = useState<TenantOption[]>([]);
  const [internalRequestedTenant, setInternalRequestedTenant] = useState<string | null>(requestedTenant);
  const effectiveRequestedTenant = requestedTenant ?? internalRequestedTenant;
  const [isLoading, setIsLoading] = useState(() => !!effectiveRequestedTenant);
  const [error, setError] = useState<TenantConfigError | null>(null);

  const requestIdRef = useRef(0);
  const mountedRef = useRef(true);
  const hasResolvedOnceRef = useRef(hasResolvedOnce);
  hasResolvedOnceRef.current = hasResolvedOnce;

  const setTenant = useCallback(
    (id: string) => {
      onSetTenantNavigate?.(id);
      setInternalRequestedTenant(id);
    },
    [onSetTenantNavigate]
  );

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!effectiveRequestedTenant) {
      setIsLoading(false);
      if (!hasResolvedOnce) {
        setResolvedTenant(null);
        setTenantConfig(null);
        setPermissions(null);
        setAvailableTenants([]);
        setError(null);
      }
      return;
    }

    const id = ++requestIdRef.current;
    setIsLoading(true);
    setError(null);

    fetchTenantConfig(effectiveRequestedTenant).then((result) => {
      if (!mountedRef.current) return;
      if (id !== requestIdRef.current) return;

      setIsLoading(false);

      if (result.ok) {
        setResolvedTenant(effectiveRequestedTenant);
        setTenantConfig(result.data);
        setPermissions(result.data.permissions ?? null);
        setAvailableTenants(result.data.availableTenants ?? []);
        setHasResolvedOnce(true);
        setError(null);
        onResolvedTenantChange?.(effectiveRequestedTenant, result.data);
      } else {
        if (hasResolvedOnceRef.current) {
          setError(result.error);
        } else {
          setResolvedTenant(null);
          setTenantConfig(null);
          setPermissions(null);
          setAvailableTenants([]);
          setError(result.error);
        }
      }
    });
  }, [effectiveRequestedTenant]);

  const value = useMemo<TenantContextValue>(
    () => ({
      requestedTenant: effectiveRequestedTenant,
      resolvedTenant,
      hasResolvedOnce,
      tenantConfig,
      permissions,
      availableTenants,
      isLoading,
      error,
      setTenant,
    }),
    [
      effectiveRequestedTenant,
      resolvedTenant,
      hasResolvedOnce,
      tenantConfig,
      permissions,
      availableTenants,
      isLoading,
      error,
      setTenant,
    ]
  );

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  );
}
