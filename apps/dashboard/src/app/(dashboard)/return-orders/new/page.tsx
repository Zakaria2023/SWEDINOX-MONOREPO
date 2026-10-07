import { getCompaniesForSelect } from "@/app/(dashboard)/companies/actions";
import { DEFAULT_RETURN_ORDER } from "@/app/(dashboard)/return-orders/validation";
import { getTextCategoriesForSelect } from "@/app/(dashboard)/text-categories/actions";
import { ReturnOrderForm } from "@/components/return-orders/return-order-form";
import { SearchParams } from "@/lib/table-query";

type Props = {
  searchParams: Promise<SearchParams>;
};

const NewReturnOrderPage = async ({ searchParams }: Props) => {
  // `?company=&order=` are set by `Par. return` on a sales order: the return
  // starts on that customer and that order.
  const { company, order } = await searchParams;
  const [companies, textCategories] = await Promise.all([
    getCompaniesForSelect(),
    getTextCategoriesForSelect(),
  ]);

  const defaultValues =
    typeof company === "string"
      ? {
          ...DEFAULT_RETURN_ORDER,
          companyUuid: company,
          orderUuid: typeof order === "string" ? order : "",
        }
      : undefined;

  return (
    <div className="space-y-4">
      <ReturnOrderForm
        companies={companies}
        textCategories={textCategories}
        defaultValues={defaultValues}
      />
    </div>
  );
};

export default NewReturnOrderPage;
