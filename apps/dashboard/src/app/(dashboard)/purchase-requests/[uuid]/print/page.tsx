import { notFound } from "next/navigation";
import { getAddressesForCompany } from "@/app/(dashboard)/addresses/actions";
import { getYardDeliveryAddress } from "@/app/(dashboard)/purchase-orders/actions";
import { getPurchaseRequestDetail } from "@/app/(dashboard)/purchase-requests/actions";
import { getSettings } from "@/app/(dashboard)/settings/actions";
import { PurchaseRequestDocument } from "@/components/purchase-requests/purchase-request-document";
import { getClerkUsers, getClerkUsersForSelect } from "@/lib/server/clerk";

type Props = {
  params: Promise<{ uuid: string }>;
};

/**
 * The INKOOPAANVRAAG document the reference opens in its print preview when a
 * request is made final — the same page `Print…` prints and `Send…` attaches.
 */
const PurchaseRequestPrintPage = async ({ params }: Props) => {
  const { uuid } = await params;

  // Sequential rather than concurrent: this database caps connections.
  const request = await getPurchaseRequestDetail(uuid);
  if (!request) {
    notFound();
  }
  // The request's own supplier address when one is chosen, else the
  // supplier's first address, as the purchase order's document prints it.
  const companyAddresses =
    !request.supplierStreetAndNo && request.companyUuid
      ? await getAddressesForCompany(request.companyUuid)
      : [];
  const firstAddress = companyAddresses[0];
  const supplierAddress = request.supplierStreetAndNo
    ? {
        streetAndNo: request.supplierStreetAndNo,
        postalCode: request.supplierPostalCode,
        city: request.supplierCity,
        country: request.supplierCountry,
      }
    : firstAddress
      ? {
          streetAndNo: firstAddress.streetAndNo,
          postalCode: firstAddress.postalCode,
          city: firstAddress.city,
          country: null,
        }
      : null;
  const yardAddress = await getYardDeliveryAddress();
  const settings = await getSettings();

  const purchaserId = request.purchaser;
  const purchaserName = purchaserId
    ? ((await getClerkUsersForSelect()).find(
        (user) => user.value === purchaserId,
      )?.label ?? purchaserId)
    : null;
  const purchaserEmail = purchaserId
    ? ((await getClerkUsers()).find((user) => user.id === purchaserId)
        ?.email ?? null)
    : null;

  return (
    <PurchaseRequestDocument
      request={request}
      supplierAddress={supplierAddress}
      yardAddress={yardAddress}
      affiliateName={settings.affiliateName}
      purchaserName={purchaserName}
      purchaserEmail={purchaserEmail}
    />
  );
};

export default PurchaseRequestPrintPage;
