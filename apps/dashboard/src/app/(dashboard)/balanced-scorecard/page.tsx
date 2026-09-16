import { BalancedScorecardTable } from "@/components/balanced-scorecard/balanced-scorecard-table-content";
import { getBalancedScorecard } from "@/app/(dashboard)/balanced-scorecard/balanced-scorecard";

const BalancedScorecardPage = async () => {
  const rows = await getBalancedScorecard();

  return (
    <div className="space-y-4">
      <BalancedScorecardTable rows={rows} />
    </div>
  );
};

export default BalancedScorecardPage;
