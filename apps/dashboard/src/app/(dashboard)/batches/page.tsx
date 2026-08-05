import { getBatches } from "@/app/(dashboard)/batches/actions";
import { BatchesTable } from "@/components/batches/batches-table-content";
import { GenerateBatchesButton } from "@/components/batches/generate-batches-button";
import { PageHeading } from "@/components/layout/page-heading";

const BatchesPage = async () => {
  const rows = await getBatches();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeading title="Batches" />
        <GenerateBatchesButton />
      </div>
      <BatchesTable rows={rows} />
    </div>
  );
};

export default BatchesPage;
