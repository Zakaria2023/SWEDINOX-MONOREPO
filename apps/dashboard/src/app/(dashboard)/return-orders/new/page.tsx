import { ChevronLeft } from "lucide-react";
import Link from "next/link";
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
  // Sequential rather than concurrent: this database caps connections.
  const companies = await getCompaniesForSelect();
  const textCategories = await getTextCategoriesForSelect();

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
      <div>
        <Link
          href="/return-orders"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Return orders
        </Link>
      </div>
      <ReturnOrderForm
        companies={companies}
        textCategories={textCategories}
        defaultValues={defaultValues}
      />
    </div>
  );
};

export default NewReturnOrderPage;
