import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getCompaniesForSelect } from "@/app/(dashboard)/companies/actions";
import { getTextCategoriesForSelect } from "@/app/(dashboard)/text-categories/actions";
import { getProductsForSelect } from "@/app/(dashboard)/products/actions";
import { getProductGroupsForSelect } from "@/app/(dashboard)/product-groups/actions";
import { CounterOrderForm } from "@/components/counter-orders/counter-order-form";

const AddCounterOrderPage = async () => {
  const [companies, textCategories, products, productGroups] =
    await Promise.all([
      getCompaniesForSelect(),
      getTextCategoriesForSelect(),
      getProductsForSelect(),
      getProductGroupsForSelect(),
    ]);

  return (
    <div className="space-y-4">
      <div>
        <Link
          href="/counter-orders"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Counter Orders
        </Link>
      </div>
      <CounterOrderForm
        companies={companies}
        textCategories={textCategories}
        products={products}
        productGroups={productGroups}
      />
    </div>
  );
};

export default AddCounterOrderPage;
