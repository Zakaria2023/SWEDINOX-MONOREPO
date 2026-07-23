import { getBatches } from "@/app/(dashboard)/batches/actions";
import { BatchFilter } from "@/components/batches/batch-filter";
import { BatchesTable } from "@/components/batches/batches-table-content";
import { GenerateBatchesButton } from "@/components/batches/generate-batches-button";
import { PageHeading } from "@/components/layout/page-heading";

type Props = {
  searchParams: Promise<{
    receiptFrom?: string;
    receiptUntil?: string;
    companyCode?: string;
    productCode?: string;
  }>;
};

const BatchesPage = async ({ searchParams }: Props) => {
  const { receiptFrom, receiptUntil, companyCode, productCode } =
    await searchParams;
  const rows = await getBatches({
    receiptFrom,
    receiptUntil,
    companyCode: companyCode ? Number(companyCode) : undefined,
    productCode,
  });

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeading
          title="Batches"
          description="Received material traced by mill charge and internal charge number"
        />
        <GenerateBatchesButton />
      </div>
      <BatchFilter
        receiptFrom={receiptFrom}
        receiptUntil={receiptUntil}
        companyCode={companyCode}
        productCode={productCode}
      />
      <BatchesTable rows={rows} />
    </div>
  );
};

export default BatchesPage;
