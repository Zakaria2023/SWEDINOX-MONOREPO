import { getCompaniesForSelect } from "@/app/(dashboard)/companies/actions";
import { getClerkUsersForSelect } from "@/lib/server/clerk";
import { OrderForm } from "@/components/orders/order-form";
import { PageHeading } from "@/components/layout/page-heading";

const NewOrderPage = async () => {
  const [companies, clerkUsers] = await Promise.all([
    getCompaniesForSelect(),
    getClerkUsersForSelect(),
  ]);

  return (
    <div className="max-w-4xl space-y-6 p-6">
      <PageHeading
        title="New Order"
        description="Create a new customer order"
      />
      <OrderForm companies={companies} clerkUsers={clerkUsers} />
    </div>
  );
};

export default NewOrderPage;
