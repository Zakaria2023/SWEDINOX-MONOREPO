import { getCdDeliveriesInProgress } from "@/app/(dashboard)/cd-deliveries-in-progress/actions";
import { CdDeliveriesInProgressTable } from "@/components/cd-deliveries-in-progress/cd-deliveries-in-progress-table-content";
import { PageHeading } from "@/components/layout/page-heading";

const CdDeliveriesInProgressPage = async () => {
  const rows = await getCdDeliveriesInProgress();

  return (
    <div className="space-y-6 p-6">
      <PageHeading title="CD-deliveries in Progress" />
      <CdDeliveriesInProgressTable rows={rows} />
    </div>
  );
};

export default CdDeliveriesInProgressPage;
