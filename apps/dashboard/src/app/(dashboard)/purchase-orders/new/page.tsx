import { getCompaniesForSelect } from "@/app/(dashboard)/companies/actions";
import { getClerkUsersForSelect } from "@/lib/server/clerk";
import { PurchaseOrderForm } from "@/components/purchase-orders/purchase-order-form";
import { PageHeading } from "@/components/layout/page-heading";

const NewPurchaseOrderPage = async () => {
  const [companies, clerkUsers] = await Promise.all([
    getCompaniesForSelect(),
    getClerkUsersForSelect(),
  ]);

  return (
    <div className="max-w-4xl space-y-4">
      <PageHeading title="New Purchase Order" />
      <PurchaseOrderForm companies={companies} clerkUsers={clerkUsers} />
    </div>
  );
};

export default NewPurchaseOrderPage;
