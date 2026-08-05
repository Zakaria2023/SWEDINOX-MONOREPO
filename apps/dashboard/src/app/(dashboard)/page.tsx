import { getDashboardOverview } from "@/app/(dashboard)/actions";
import { DashboardOverview } from "@/components/dashboard/dashboard-overview";
import { PageHeading } from "@/components/layout/page-heading";

const DashboardPage = async () => {
  const overview = await getDashboardOverview();

  return (
    <div className="space-y-6">
      <PageHeading
        title="Dashboard"
        titleClassName="text-2xl font-semibold tracking-tight"
      />
      <DashboardOverview overview={overview} />
    </div>
  );
};

export default DashboardPage;
