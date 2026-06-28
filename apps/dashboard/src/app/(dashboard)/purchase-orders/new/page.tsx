import { getCompaniesForSelect } from "@/app/(dashboard)/companies/actions";
import { PurchaseOrderForm } from "@/components/purchase-orders/purchase-order-form";
import { PageHeading } from "@/components/layout/page-heading";

const NewPurchaseOrderPage = async () => {
  const companies = await getCompaniesForSelect();

  return (
    <div className="max-w-4xl space-y-6 p-6">
      <PageHeading
        title="New Purchase Order"
        description="Create a new supplier purchase order"
      />
      <PurchaseOrderForm companies={companies} />
    </div>
  );
};

export default NewPurchaseOrderPage;
