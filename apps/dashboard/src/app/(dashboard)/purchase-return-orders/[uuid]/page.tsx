import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCompaniesForSelect } from "@/app/(dashboard)/companies/actions";
import { getPurchaseSupplierDefaults } from "@/app/(dashboard)/purchase-orders/actions";
import { getPurchaseReturnOrderDetail } from "@/app/(dashboard)/purchase-return-orders/actions";
import { getTextCategoriesForSelect } from "@/app/(dashboard)/text-categories/actions";
import { PurchaseReturnOrderForm } from "@/components/purchase-return-orders/purchase-return-order-form";
import { requireAuth } from "@/lib/auth";
import { getClerkUsersForSelect } from "@/lib/server/clerk";

type Props = {
  params: Promise<{ uuid: string }>;
};

/**
 * One screen, as the reference has it: a saved return is the form it was
 * typed on — the toolbar, the header, then the lines and every panel.
 */
const PurchaseReturnOrderDetailPage = async ({ params }: Props) => {
  const { uuid } = await params;
  const currentUserId = await requireAuth();

  // Sequential rather than concurrent: this database caps connections.
  const returnOrder = await getPurchaseReturnOrderDetail(uuid);

  if (!returnOrder) {
    notFound();
  }

  const companies = await getCompaniesForSelect();
  const clerkUsers = await getClerkUsersForSelect();
  const textCategories = await getTextCategoriesForSelect();
  const supplierDefaults = await getPurchaseSupplierDefaults(
    returnOrder.supplierUuid,
  );

  return (
    <div className="space-y-4">
      <div>
        <Link
          href="/purchase-return-orders"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Purchase return orders
        </Link>
      </div>
      <PurchaseReturnOrderForm
        companies={companies}
        clerkUsers={clerkUsers}
        textCategories={textCategories}
        currentUserId={currentUserId}
        existing={returnOrder}
        supplierDefaults={supplierDefaults}
      />
    </div>
  );
};

export default PurchaseReturnOrderDetailPage;
