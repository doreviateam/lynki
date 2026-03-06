import { DashboardWithFilters } from "@/components/DashboardWithFilters";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function HomePage() {
  return <DashboardWithFilters />;
}
