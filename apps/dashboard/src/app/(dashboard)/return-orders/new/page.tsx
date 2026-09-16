import { getCompaniesForSelect } from "@/app/(dashboard)/companies/actions";
import { getTextCategoriesForSelect } from "@/app/(dashboard)/text-categories/actions";
import { ReturnOrderForm } from "@/components/return-orders/return-order-form";

const NewReturnOrderPage = async () => {
  const [companies, textCategories] = await Promise.all([
    getCompaniesForSelect(),
    getTextCategoriesForSelect(),
  ]);

  return (
    <div className="space-y-4">
      <ReturnOrderForm companies={companies} textCategories={textCategories} />
    </div>
  );
};

export default NewReturnOrderPage;
