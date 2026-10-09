import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getCompaniesForSelect } from "@/app/(dashboard)/companies/actions";
import {
  getPurchaseOrderDetail,
  getYardDeliveryAddress,
} from "@/app/(dashboard)/purchase-orders/actions";
import { requireAuth } from "@/lib/auth";
import { getClerkUsersForSelect } from "@/lib/server/clerk";
import { PurchaseOrderDetailView } from "@/components/purchase-orders/purchase-order-detail";

type Props = {
  params: Promise<{ uuid: string }>;
};

/**
 * One screen, as the reference has it: the toolbar, the header as the form it
 * was typed on, then the work orders, the lines and every panel.
 */
const PurchaseOrderDetailPage = async ({ params }: Props) => {
  const { uuid } = await params;
  const currentUserId = await requireAuth();

  // Sequential rather than concurrent: this database caps connections.
  const purchaseOrder = await getPurchaseOrderDetail(uuid);

  if (!purchaseOrder) {
    notFound();
  }

  const companies = await getCompaniesForSelect();
  const yardAddress = await getYardDeliveryAddress();
  const clerkUsers = await getClerkUsersForSelect();

  return (
    <div className="space-y-4">
      <div>
        <Link
          href="/purchase-orders"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Purchase Orders
        </Link>
      </div>
      <PurchaseOrderDetailView
        purchaseOrder={purchaseOrder}
        companies={companies}
        clerkUsers={clerkUsers}
        currentUserId={currentUserId}
        yardAddress={yardAddress}
      />
    </div>
  );
};

export default PurchaseOrderDetailPage;
