import type { Metadata } from "next";
import { Suspense } from "react";
import { GeneralLedgerPageClient } from "./GeneralLedgerPageClient";

interface Props {
  params: { account_code: string };
  searchParams: {
    date_debut?: string;
    date_fin?: string;
    tenant?: string;
    company_id?: string;
    account_name?: string;
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: `Grand livre · ${decodeURIComponent(params.account_code)} — Lynki` };
}

export default function GeneralLedgerPage({ params, searchParams }: Props) {
  const accountCode = decodeURIComponent(params.account_code);
  const accountName = searchParams.account_name ? decodeURIComponent(searchParams.account_name) : accountCode;
  const tenant = searchParams.tenant || process.env.TENANT_ID || "core";
  const dateDebut = searchParams.date_debut || "";
  const dateFin = searchParams.date_fin || "";
  const companyId = searchParams.company_id || null;

  return (
    <Suspense fallback={<div className="p-8 text-sm text-[var(--text-muted)]">Chargement…</div>}>
      <GeneralLedgerPageClient
        accountCode={accountCode}
        accountName={accountName}
        tenant={tenant}
        dateDebut={dateDebut}
        dateFin={dateFin}
        companyId={companyId}
      />
    </Suspense>
  );
}
