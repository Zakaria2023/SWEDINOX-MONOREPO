import { getPurchaseLines } from "@/app/(dashboard)/purchase-lines/actions";
import { PurchaseLinesTable } from "@/components/purchase-lines/purchase-lines-table-content";
import { PageHeading } from "@/components/layout/page-heading";

const PurchaseLinesPage = async () => {
  const lines = await getPurchaseLines();

  return (
    <div className="space-y-6 p-6">
      <PageHeading
        title="Purchase lines"
        description="Purchase order lines with their supplier, quantities and receipt date"
      />
      <PurchaseLinesTable lines={lines} />
    </div>
  );
};

export default PurchaseLinesPage;
