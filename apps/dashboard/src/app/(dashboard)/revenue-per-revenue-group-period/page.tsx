import { getRevenuePerRevenueGroupPeriod } from "@/app/(dashboard)/revenue-per-revenue-group-period/actions";
import { RevenuePerRevenueGroupPeriodTable } from "@/components/revenue-per-revenue-group-period/revenue-per-revenue-group-period-table-content";

const RevenuePerRevenueGroupPeriodPage = async () => {
  const rows = await getRevenuePerRevenueGroupPeriod();

  return (
    <div className="space-y-4">
      <RevenuePerRevenueGroupPeriodTable rows={rows} />
    </div>
  );
};

export default RevenuePerRevenueGroupPeriodPage;
