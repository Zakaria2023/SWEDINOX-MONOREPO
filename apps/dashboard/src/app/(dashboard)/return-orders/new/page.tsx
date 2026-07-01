import { getCompaniesForSelect } from "@/app/(dashboard)/companies/actions";
import { ReturnOrderForm } from "@/components/return-orders/return-order-form";
import { PageHeading } from "@/components/layout/page-heading";

const NewReturnOrderPage = async () => {
  const companies = await getCompaniesForSelect();

  return (
    <div className="max-w-4xl space-y-6 p-6">
      <PageHeading
        title="New Return Order"
        description="Create a new customer return order"
      />
      <ReturnOrderForm companies={companies} />
    </div>
  );
};

export default NewReturnOrderPage;
