import { getRevenuePerRevenueGroupPeriod } from "@/app/(dashboard)/revenue-per-revenue-group-period/actions";
import { PageHeading } from "@/components/layout/page-heading";
import { RevenuePerRevenueGroupPeriodTable } from "@/components/revenue-per-revenue-group-period/revenue-per-revenue-group-period-table-content";

const RevenuePerRevenueGroupPeriodPage = async () => {
  const rows = await getRevenuePerRevenueGroupPeriod();

  return (
    <div className="space-y-6 p-6">
      <PageHeading
        title="Revenue per revenue group (period)"
        description="Invoiced sales, profit and margin per period and order type"
      />
      <RevenuePerRevenueGroupPeriodTable rows={rows} />
    </div>
  );
};

export default RevenuePerRevenueGroupPeriodPage;
