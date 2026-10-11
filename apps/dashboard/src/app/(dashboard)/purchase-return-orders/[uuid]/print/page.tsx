import { notFound } from "next/navigation";
import { getYardDeliveryAddress } from "@/app/(dashboard)/purchase-orders/actions";
import { getPurchaseReturnOrderDetail } from "@/app/(dashboard)/purchase-return-orders/actions";
import { getSettings } from "@/app/(dashboard)/settings/actions";
import { PurchaseReturnOrderDocument } from "@/components/purchase-return-orders/purchase-return-order-document";
import { getClerkUsersForSelect } from "@/lib/server/clerk";

type Props = {
  params: Promise<{ uuid: string }>;
};

/**
 * The INKOOPRETOUR document the reference opens in its print preview when a
 * return is made final — the same page `Print…` prints and `Send…` attaches.
 */
const PurchaseReturnOrderPrintPage = async ({ params }: Props) => {
  const { uuid } = await params;

  // Sequential rather than concurrent: this database caps connections.
  const returnOrder = await getPurchaseReturnOrderDetail(uuid);
  if (!returnOrder) {
    notFound();
  }
  const yardAddress = await getYardDeliveryAddress();
  const settings = await getSettings();
  const clerkUsers = returnOrder.purchaser ? await getClerkUsersForSelect() : [];
  const purchaserName =
    clerkUsers.find((user) => user.value === returnOrder.purchaser)?.label ??
    returnOrder.purchaser;

  return (
    <PurchaseReturnOrderDocument
      returnOrder={returnOrder}
      yardAddress={yardAddress}
      affiliateName={settings.affiliateName}
      purchaserName={purchaserName}
    />
  );
};

export default PurchaseReturnOrderPrintPage;
