import { getCompaniesForSelect } from "@/app/(dashboard)/companies/actions";
import { getTextCategoriesForSelect } from "@/app/(dashboard)/text-categories/actions";
import { ReturnOrderForm } from "@/components/return-orders/return-order-form";
import { PageHeading } from "@/components/layout/page-heading";

const NewReturnOrderPage = async () => {
  const [companies, textCategories] = await Promise.all([
    getCompaniesForSelect(),
    getTextCategoriesForSelect(),
  ]);

  return (
    <div className="max-w-4xl space-y-6 p-6">
      <PageHeading title="New Return Order" />
      <ReturnOrderForm companies={companies} textCategories={textCategories} />
    </div>
  );
};

export default NewReturnOrderPage;
