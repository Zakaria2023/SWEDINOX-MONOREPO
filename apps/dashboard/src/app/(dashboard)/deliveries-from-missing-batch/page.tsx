import { getDeliveriesFromMissingBatch } from "@/app/(dashboard)/deliveries-from-missing-batch/actions";
import { DeliveriesCertificateTable } from "@/components/deliveries-certificates/deliveries-certificate-table";
import { PageHeading } from "@/components/layout/page-heading";

const DeliveriesFromMissingBatchPage = async () => {
  const rows = await getDeliveriesFromMissingBatch();

  return (
    <div className="space-y-6 p-6">
      <PageHeading
        title="Deliveries from the Missing Batch"
        description="Delivered sales lines whose stock has no linked batch — the batch and its certificate are missing"
      />
      <DeliveriesCertificateTable
        rows={rows}
        emptyMessage="No deliveries with a missing batch."
      />
    </div>
  );
};

export default DeliveriesFromMissingBatchPage;
