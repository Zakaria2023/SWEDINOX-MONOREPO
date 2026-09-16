import { getDashboardOverview } from "@/app/(dashboard)/actions";
import { DashboardOverview } from "@/components/dashboard/dashboard-overview";

const DashboardPage = async () => {
  const overview = await getDashboardOverview();

  return (
    <div className="space-y-6">
      <DashboardOverview overview={overview} />
    </div>
  );
};

export default DashboardPage;
