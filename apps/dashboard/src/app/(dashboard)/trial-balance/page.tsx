import { getTrialBalance } from "@/app/(dashboard)/trial-balance/actions";
import { PageHeading } from "@/components/layout/page-heading";
import { TrialBalanceTable } from "@/components/trial-balance/trial-balance-table-content";

const TrialBalancePage = async () => {
  const trialBalance = await getTrialBalance();

  return (
    <div className="space-y-4">
      <PageHeading title="Trial balance" />
      <TrialBalanceTable trialBalance={trialBalance} />
    </div>
  );
};

export default TrialBalancePage;
