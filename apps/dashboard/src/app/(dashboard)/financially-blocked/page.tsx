import { getFinanciallyBlocked } from "@/app/(dashboard)/financially-blocked/actions";
import { FinanciallyBlockedTable } from "@/components/financially-blocked/financially-blocked-table-content";
import { currentUserHasRole, FINANCIAL_RELEASE_ROLES } from "@/lib/auth";

const FinanciallyBlockedPage = async () => {
  const [rows, canRelease] = await Promise.all([
    getFinanciallyBlocked(),
    currentUserHasRole(FINANCIAL_RELEASE_ROLES),
  ]);

  return (
    <div className="space-y-4">
      <FinanciallyBlockedTable rows={rows} canRelease={canRelease} />
    </div>
  );
};

export default FinanciallyBlockedPage;
