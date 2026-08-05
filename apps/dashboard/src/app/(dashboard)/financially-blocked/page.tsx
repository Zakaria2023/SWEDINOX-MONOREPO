import { getFinanciallyBlocked } from "@/app/(dashboard)/financially-blocked/actions";
import { FinanciallyBlockedTable } from "@/components/financially-blocked/financially-blocked-table-content";
import { PageHeading } from "@/components/layout/page-heading";

const FinanciallyBlockedPage = async () => {
  const rows = await getFinanciallyBlocked();

  return (
    <div className="space-y-4">
      <PageHeading title="Financially blocked quotes and orders" />
      <FinanciallyBlockedTable rows={rows} />
    </div>
  );
};

export default FinanciallyBlockedPage;
