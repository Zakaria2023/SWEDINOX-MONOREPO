import { getDashboardOverview } from "@/app/(dashboard)/actions";
import { DashboardOverview } from "@/components/dashboard/dashboard-overview";
import { PageHeading } from "@/components/layout/page-heading";
import { formatDateValue } from "@/lib/helpers";

const DashboardPage = async () => {
  const overview = await getDashboardOverview();

  return (
    <div className="space-y-6">
      <PageHeading
        title="Dashboard"
        description={`Sales, purchasing, stock and receivables as at ${formatDateValue(
          overview.asOf,
          "—",
        )}.`}
        titleClassName="text-2xl font-semibold tracking-tight"
        descriptionClassName="mt-2 text-sm text-muted-foreground"
      />
      <DashboardOverview overview={overview} />
    </div>
  );
};

export default DashboardPage;
