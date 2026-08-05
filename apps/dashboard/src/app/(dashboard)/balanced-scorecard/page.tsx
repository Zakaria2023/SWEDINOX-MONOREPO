import { BalancedScorecardTable } from "@/components/balanced-scorecard/balanced-scorecard-table-content";
import { PageHeading } from "@/components/layout/page-heading";
import { getBalancedScorecard } from "@/app/(dashboard)/balanced-scorecard/balanced-scorecard";

const BalancedScorecardPage = async () => {
  const rows = await getBalancedScorecard();

  return (
    <div className="space-y-6 p-6">
      <PageHeading title="Balanced Scorecard" />
      <BalancedScorecardTable rows={rows} />
    </div>
  );
};

export default BalancedScorecardPage;
