import { getReceipts } from "@/app/(dashboard)/receipts/actions";
import { ReceiptsTable } from "@/components/receipts/receipts-table-content";

const ReceiptsPage = async () => {
  const rows = await getReceipts();

  return (
    <div className="space-y-4">
      <ReceiptsTable rows={rows} />
    </div>
  );
};

export default ReceiptsPage;
