import { getFinanciallyBlocked } from "@/app/(dashboard)/financially-blocked/actions";
import { FinanciallyBlockedTable } from "@/components/financially-blocked/financially-blocked-table-content";
import { PageHeading } from "@/components/layout/page-heading";

const FinanciallyBlockedPage = async () => {
  const rows = await getFinanciallyBlocked();

  return (
    <div className="space-y-6 p-6">
      <PageHeading
        title="Financially blocked quotes and orders"
        description="Quotes and orders on a financial block, with the debtor's open receivables, credit limit and remaining credit space"
      />
      <FinanciallyBlockedTable rows={rows} />
    </div>
  );
};

export default FinanciallyBlockedPage;
