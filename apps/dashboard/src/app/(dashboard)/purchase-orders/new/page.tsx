import { getCompaniesForSelect } from "@/app/(dashboard)/companies/actions";
import { getClerkUsersForSelect } from "@/lib/server/clerk";
import { PurchaseOrderForm } from "@/components/purchase-orders/purchase-order-form";

const NewPurchaseOrderPage = async () => {
  const [companies, clerkUsers] = await Promise.all([
    getCompaniesForSelect(),
    getClerkUsersForSelect(),
  ]);

  return (
    <div className="space-y-4">
      <PurchaseOrderForm companies={companies} clerkUsers={clerkUsers} />
    </div>
  );
};

export default NewPurchaseOrderPage;
