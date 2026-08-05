import { getDebtorAgeing } from "@/app/(dashboard)/debtor-ageing/actions";
import { PageHeading } from "@/components/layout/page-heading";
import { DebtorAgeingTable } from "@/components/debtor-ageing/debtor-ageing-table-content";

const DebtorAgeingPage = async () => {
  const ageing = await getDebtorAgeing();

  return (
    <div className="space-y-6 p-6">
      <PageHeading title="Debtor ageing" />
      <DebtorAgeingTable ageing={ageing} />
    </div>
  );
};

export default DebtorAgeingPage;
