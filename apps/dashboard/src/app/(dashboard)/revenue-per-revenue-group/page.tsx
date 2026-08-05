import { getRevenuePerRevenueGroup } from "@/app/(dashboard)/revenue-per-revenue-group/actions";
import { RevenuePerRevenueGroupTable } from "@/components/revenue-per-revenue-group/revenue-per-revenue-group-table-content";
import { PageHeading } from "@/components/layout/page-heading";

const RevenuePerRevenueGroupPage = async () => {
  const rows = await getRevenuePerRevenueGroup();

  return (
    <div className="space-y-4">
      <PageHeading title="Revenue per revenue group" />
      <RevenuePerRevenueGroupTable rows={rows} />
    </div>
  );
};

export default RevenuePerRevenueGroupPage;
