import { getPurchaseReceivals } from "@/app/(dashboard)/purchase-receivals/actions";
import { PurchaseReceivalsTable } from "@/components/purchase-receivals/purchase-receivals-table-content";
import { PageHeading } from "@/components/layout/page-heading";

const PurchaseReceivalsPage = async () => {
  const receivals = await getPurchaseReceivals();

  return (
    <div className="space-y-4">
      <PageHeading title="Purchase receivals" />
      <PurchaseReceivalsTable receivals={receivals} />
    </div>
  );
};

export default PurchaseReceivalsPage;
