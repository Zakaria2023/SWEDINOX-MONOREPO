import { getCompaniesForSelect } from "@/app/(dashboard)/companies/actions";
import { getYardDeliveryAddress } from "@/app/(dashboard)/purchase-orders/actions";
import { requireAuth } from "@/lib/auth";
import { getClerkUsersForSelect } from "@/lib/server/clerk";
import { PurchaseOrderForm } from "@/components/purchase-orders/purchase-order-form";

const NewPurchaseOrderPage = async () => {
  const currentUserId = await requireAuth();
  // Sequential rather than concurrent: this database caps connections.
  const companies = await getCompaniesForSelect();
  const yardAddress = await getYardDeliveryAddress();
  const clerkUsers = await getClerkUsersForSelect();

  return (
    <div className="space-y-4">
      <PurchaseOrderForm
        companies={companies}
        clerkUsers={clerkUsers}
        currentUserId={currentUserId}
        yardAddress={yardAddress}
      />
    </div>
  );
};

export default NewPurchaseOrderPage;
