import { DeliveriesCertificateTable } from "@/components/deliveries-certificates/deliveries-certificate-table";
import { PageHeading } from "@/components/layout/page-heading";
import { getDeliveryCertificateRows } from "../sending-certificates/actions";

const DeliveriesFromMissingBatchPage = async () => {
  const rows = await getDeliveryCertificateRows("missing-batch");

  return (
    <div className="space-y-6 p-6">
      <PageHeading title="Deliveries from the Missing Batch" />
      <DeliveriesCertificateTable
        rows={rows}
        emptyMessage="No deliveries with a missing batch."
      />
    </div>
  );
};

export default DeliveriesFromMissingBatchPage;
