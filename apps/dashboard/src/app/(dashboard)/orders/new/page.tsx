import { getCompaniesForSelect } from "@/app/(dashboard)/companies/actions";
import { getTextCategoriesForSelect } from "@/app/(dashboard)/text-categories/actions";
import { getClerkUsersForSelect } from "@/lib/server/clerk";
import { requireAuth } from "@/lib/auth";
import { OrderForm } from "@/components/orders/order-form";

const NewOrderPage = async () => {
  const currentUserId = await requireAuth();
  const [companies, clerkUsers, textCategories] = await Promise.all([
    getCompaniesForSelect(),
    getClerkUsersForSelect(),
    getTextCategoriesForSelect(),
  ]);

  return (
    <div className="space-y-4">
      <OrderForm
        companies={companies}
        clerkUsers={clerkUsers}
        textCategories={textCategories}
        currentUserId={currentUserId}
      />
    </div>
  );
};

export default NewOrderPage;
