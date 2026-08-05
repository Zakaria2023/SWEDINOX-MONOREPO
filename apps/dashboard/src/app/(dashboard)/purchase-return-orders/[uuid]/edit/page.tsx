import { getCompaniesForSelect } from "@/app/(dashboard)/companies/actions";
import { getPurchaseReturnOrderDetail } from "@/app/(dashboard)/purchase-return-orders/actions";
import { purchaseReturnOrderToFormValues } from "@/app/(dashboard)/purchase-return-orders/mappers";
import { getTextCategoriesForSelect } from "@/app/(dashboard)/text-categories/actions";
import { PageHeading } from "@/components/layout/page-heading";
import { PurchaseReturnOrderForm } from "@/components/purchase-return-orders/purchase-return-order-form";
import { isPurchaseReturnOrderEditable } from "@/lib/helpers";
import { getClerkUsersForSelect } from "@/lib/server/clerk";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ uuid: string }>;
};

const EditPurchaseReturnOrderPage = async ({ params }: Props) => {
  const { uuid } = await params;

  const [returnOrder, companies, clerkUsers, textCategories] =
    await Promise.all([
      getPurchaseReturnOrderDetail(uuid),
      getCompaniesForSelect(),
      getClerkUsersForSelect(),
      getTextCategoriesForSelect(),
    ]);

  if (!returnOrder) {
    notFound();
  }

  return (
    <div className="space-y-4">
      <div>
        <Link
          href={`/purchase-return-orders/${uuid}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Back to return order
        </Link>
      </div>
      <PageHeading title={`Edit Purchase Return Order #${returnOrder.id}`} />

      {isPurchaseReturnOrderEditable(returnOrder.status) ? (
        <PurchaseReturnOrderForm
          companies={companies}
          clerkUsers={clerkUsers}
          textCategories={textCategories}
          purchaseReturnOrderUuid={uuid}
          defaultValues={purchaseReturnOrderToFormValues(returnOrder)}
        />
      ) : (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          {returnOrder.status === "cancelled"
            ? "This return order is cancelled."
            : "These goods have already gone back to the supplier, and the stock and valuation moved with them. The return can no longer be changed."}
        </div>
      )}

      <p className="text-sm text-muted-foreground">
        The returned lines are not editable here. Each one names the exact lot
        the goods came out of and the price they were received at, which is what
        dispatching reverses — re-picking them means raising a new return.
      </p>
    </div>
  );
};

export default EditPurchaseReturnOrderPage;
