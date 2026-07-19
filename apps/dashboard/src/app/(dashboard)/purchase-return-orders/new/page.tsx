import { getCompaniesForSelect } from "@/app/(dashboard)/companies/actions";
import { getTextCategoriesForSelect } from "@/app/(dashboard)/text-categories/actions";
import { getClerkUsersForSelect } from "@/lib/server/clerk";
import { PurchaseReturnOrderForm } from "@/components/purchase-return-orders/purchase-return-order-form";
import { PageHeading } from "@/components/layout/page-heading";

const NewPurchaseReturnOrderPage = async () => {
  const [companies, clerkUsers, textCategories] = await Promise.all([
    getCompaniesForSelect(),
    getClerkUsersForSelect(),
    getTextCategoriesForSelect(),
  ]);

  return (
    <div className="max-w-4xl space-y-6 p-6">
      <PageHeading
        title="New Purchase Return Order"
        description="Create a new supplier purchase return order"
      />
      <PurchaseReturnOrderForm
        companies={companies}
        clerkUsers={clerkUsers}
        textCategories={textCategories}
      />
    </div>
  );
};

export default NewPurchaseReturnOrderPage;
