import { getRevenuePerRevenueGroup } from "@/app/(dashboard)/revenue-per-revenue-group/actions";
import { RevenuePerRevenueGroupTable } from "@/components/revenue-per-revenue-group/revenue-per-revenue-group-table-content";

const RevenuePerRevenueGroupPage = async () => {
  const rows = await getRevenuePerRevenueGroup();

  return (
    <div className="space-y-4">
      <RevenuePerRevenueGroupTable rows={rows} />
    </div>
  );
};

export default RevenuePerRevenueGroupPage;
