import { getTransportStatusAdjustments } from "@/app/(dashboard)/transport-status-adjustments/actions";
import { TransportStatusAdjustmentsTable } from "@/components/transport-status-adjustments/transport-status-adjustments-table-content";
import { PageHeading } from "@/components/layout/page-heading";

const TransportStatusAdjustmentsPage = async () => {
  const adjustments = await getTransportStatusAdjustments();

  return (
    <div className="space-y-4">
      <PageHeading title="Transport Status Adjustments" />
      <TransportStatusAdjustmentsTable adjustments={adjustments} />
    </div>
  );
};

export default TransportStatusAdjustmentsPage;
