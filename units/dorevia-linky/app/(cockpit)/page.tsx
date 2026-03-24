import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { DashboardWithFilters } from "@/components/DashboardWithFilters";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const LAB_LINKY_HOST = "lab.linky.doreviateam.com";

export default async function CockpitPage({
  searchParams,
}: {
  searchParams: Promise<{ tenant?: string; view?: string }>;
}) {
  const params = await searchParams;

  if (params?.view === "synthese") {
    const qs = params.tenant ? `?tenant=${params.tenant}` : "";
    redirect(`/synthese${qs}`);
  }

  const headersList = await headers();
  const host = headersList.get("host") ?? "";
  const tenantFromUrl = params?.tenant ?? null;
  const initialShowTenantChoice = host === LAB_LINKY_HOST && !tenantFromUrl;

  return (
    <DashboardWithFilters
      initialShowTenantChoice={initialShowTenantChoice}
      initialAppView="pilotage"
    />
  );
}
