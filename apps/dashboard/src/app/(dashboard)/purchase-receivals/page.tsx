import { getPurchaseReceivals } from "@/app/(dashboard)/purchase-receivals/actions";
import { PurchaseReceivalsTable } from "@/components/purchase-receivals/purchase-receivals-table-content";
import { PageHeading } from "@/components/layout/page-heading";

const PurchaseReceivalsPage = async () => {
  const receivals = await getPurchaseReceivals();

  return (
    <div className="space-y-6 p-6">
      <PageHeading
        title="Purchase receivals"
        description="Goods received against purchase order lines"
      />
      <PurchaseReceivalsTable receivals={receivals} />
    </div>
  );
};

export default PurchaseReceivalsPage;
