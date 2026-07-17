import { getReceipts } from "@/app/(dashboard)/receipts/actions";
import { ReceiptsTable } from "@/components/receipts/receipts-table-content";
import { PageHeading } from "@/components/layout/page-heading";

const ReceiptsPage = async () => {
  const rows = await getReceipts();

  return (
    <div className="space-y-6 p-6">
      <PageHeading
        title="Receipts"
        description="Goods received per day, per supplier and product"
      />
      <ReceiptsTable rows={rows} />
    </div>
  );
};

export default ReceiptsPage;
