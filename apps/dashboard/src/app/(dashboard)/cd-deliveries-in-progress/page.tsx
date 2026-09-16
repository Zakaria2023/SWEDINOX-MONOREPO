import { getCdDeliveriesInProgress } from "@/app/(dashboard)/cd-deliveries-in-progress/actions";
import { CdDeliveriesInProgressTable } from "@/components/cd-deliveries-in-progress/cd-deliveries-in-progress-table-content";

const CdDeliveriesInProgressPage = async () => {
  const rows = await getCdDeliveriesInProgress();

  return (
    <div className="space-y-4">
      <CdDeliveriesInProgressTable rows={rows} />
    </div>
  );
};

export default CdDeliveriesInProgressPage;
