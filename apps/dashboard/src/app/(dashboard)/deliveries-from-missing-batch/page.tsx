import { DeliveriesCertificateTable } from "@/components/deliveries-certificates/deliveries-certificate-table";
import { getDeliveryCertificateRows } from "../sending-certificates/actions";

const DeliveriesFromMissingBatchPage = async () => {
  const rows = await getDeliveryCertificateRows("missing-batch");

  return (
    <div className="space-y-4">
      <DeliveriesCertificateTable
        rows={rows}
        emptyMessage="No deliveries with a missing batch."
      />
    </div>
  );
};

export default DeliveriesFromMissingBatchPage;
