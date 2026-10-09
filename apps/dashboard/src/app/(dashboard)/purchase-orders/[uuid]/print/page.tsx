import { notFound } from "next/navigation";
import { getAddressesForCompany } from "@/app/(dashboard)/addresses/actions";
import {
  getPurchaseOrderDetail,
  getYardDeliveryAddress,
} from "@/app/(dashboard)/purchase-orders/actions";
import { getSettings } from "@/app/(dashboard)/settings/actions";
import { PurchaseOrderDocument } from "@/components/purchase-orders/purchase-order-document";

type Props = {
  params: Promise<{ uuid: string }>;
};

/**
 * The INKOOPORDER document the reference opens in its print preview when an
 * order is made final — the same page `Print…` prints and `Send…` attaches.
 */
const PurchaseOrderPrintPage = async ({ params }: Props) => {
  const { uuid } = await params;

  // Sequential rather than concurrent: this database caps connections.
  const purchaseOrder = await getPurchaseOrderDetail(uuid);
  if (!purchaseOrder) {
    notFound();
  }
  const supplierAddresses = purchaseOrder.supplierUuid
    ? await getAddressesForCompany(purchaseOrder.supplierUuid)
    : [];
  const yardAddress = await getYardDeliveryAddress();
  const settings = await getSettings();

  return (
    <PurchaseOrderDocument
      purchaseOrder={purchaseOrder}
      supplierAddress={supplierAddresses[0] ?? null}
      yardAddress={yardAddress}
      affiliateName={settings.affiliateName}
    />
  );
};

export default PurchaseOrderPrintPage;
