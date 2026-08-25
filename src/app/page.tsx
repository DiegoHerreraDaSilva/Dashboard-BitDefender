import { AgentVersionBreakdown } from "@/components/dashboard/AgentVersionBreakdown";
import { CompanyRiskCard } from "@/components/dashboard/CompanyRiskCard";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { FleetHealthBlock } from "@/components/dashboard/FleetHealthBlock";
import { IncidentActivityList } from "@/components/dashboard/IncidentActivityList";
import { LatestIncidentCard } from "@/components/dashboard/LatestIncidentCard";
import { LicenseUsageTile } from "@/components/dashboard/LicenseUsageTile";
import { RiskGaugeCard } from "@/components/dashboard/RiskGaugeCard";
import { TotalEndpointsCard } from "@/components/dashboard/TotalEndpointsCard";
import { companyCache } from "@/lib/gravityzone/company";
import { fleetCache } from "@/lib/gravityzone/network";
import { incidentsCache } from "@/lib/gravityzone/incidents";
import { licenseCache } from "@/lib/gravityzone/licensing";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [fleet, incidents, license, company] = await Promise.all([
    fleetCache.get(),
    incidentsCache.get(),
    licenseCache.get(),
    companyCache.get(),
  ]);

  const renderedAt = new Date();

  return (
    <main className="h-screen overflow-hidden flex flex-col gap-4 p-10">
      <DashboardHeader renderedAt={renderedAt} syncStates={[fleet, incidents, license, company]} />
      <div className="flex flex-col gap-6 flex-1 min-h-0">
        <div className="flex gap-6 flex-1 min-h-0">
          <TotalEndpointsCard state={fleet} className="flex-1 min-w-0 min-h-0" />
          <RiskGaugeCard state={fleet} className="flex-1 min-w-0 min-h-0" />
          <CompanyRiskCard state={company} className="flex-1 min-w-0 min-h-0 overflow-hidden" />
        </div>
        <div className="flex gap-6 flex-1 min-h-0">
          <FleetHealthBlock state={fleet} className="flex-1 min-w-0 min-h-0 overflow-hidden" />
          <LicenseUsageTile state={license} now={renderedAt} className="flex-1 min-w-0 min-h-0" />
          <AgentVersionBreakdown state={fleet} className="flex-1 min-w-0 min-h-0 overflow-hidden" />
        </div>
        <div className="flex gap-6 flex-1 min-h-0">
          <IncidentActivityList state={incidents} className="flex-[2] min-w-0 min-h-0 overflow-hidden" />
          <LatestIncidentCard state={incidents} className="flex-1 min-w-0 min-h-0 overflow-hidden" />
        </div>
      </div>
    </main>
  );
}
