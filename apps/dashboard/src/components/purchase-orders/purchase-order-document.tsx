import { AddressOption } from "@/app/(dashboard)/addresses/actions";
import {
  PurchaseOrderDetail,
  YardDeliveryAddress,
} from "@/app/(dashboard)/purchase-orders/actions";
import {
  formatDateValue,
  formatMoney,
  formatNumber,
  runningMeters,
} from "@/lib/helpers";
import {
  DELIVERY_TERM_LABELS,
  INVOICE_PAYMENT_TERM_LABELS,
  ORDER_SOURCE_TYPE_LABELS,
} from "@/lib/labels";

type Props = {
  purchaseOrder: PurchaseOrderDetail;
  supplierAddress: AddressOption | null;
  yardAddress: YardDeliveryAddress | null;
  affiliateName: string | null;
};

/**
 * The INKOOPORDER as the reference prints it (404355, 9-10-2026): our
 * letterhead, the number, order date and buyer, the supplier's address block
 * with the contact, the two references, the delivery box (date, terms, who
 * arranges transport, delivery address), the lines grouped under their
 * product group, the totals, the payment terms, the standard text and the
 * buyer's signature.
 */
export const PurchaseOrderDocument = ({
  purchaseOrder,
  supplierAddress,
  yardAddress,
  affiliateName,
}: Props) => {
  const contactName = [
    purchaseOrder.contactFirstName,
    purchaseOrder.contactLastName,
  ]
    .filter(Boolean)
    .join(" ");
  const totalKg = purchaseOrder.items.reduce(
    (sum, item) => sum + Number(item.kgActual ?? item.kgPurchased ?? 0),
    0,
  );
  const totalAmount = purchaseOrder.items.reduce(
    (sum, item) => sum + Number(item.amount ?? 0),
    0,
  );

  return (
    <main className="mx-auto max-w-3xl bg-background p-10 text-sm text-foreground print:p-0">
      <header className="flex items-start justify-between border-b pb-6">
        <p className="text-3xl font-semibold tracking-tight">
          {affiliateName ?? "Swedinox"}
        </p>
        <address className="text-right text-xs not-italic text-muted-foreground">
          {yardAddress?.label ?? ""}
        </address>
      </header>

      <section className="mt-8 grid grid-cols-2 gap-8">
        <div className="space-y-4">
          <p className="text-lg font-semibold">
            PURCHASE ORDER{" "}
            <span className="ml-8 tabular-nums">{purchaseOrder.id}</span>
          </p>
          <dl className="grid grid-cols-[8rem_1fr] gap-y-1">
            <dt>Order date:</dt>
            <dd>{formatDateValue(purchaseOrder.orderDate)}</dd>
            <dt>Purchaser:</dt>
            <dd>{purchaseOrder.purchaserInitials ?? purchaseOrder.purchaser ?? "—"}</dd>
          </dl>
        </div>
        <div className="space-y-4">
          <address className="text-base font-semibold not-italic">
            {purchaseOrder.supplierName}
            {contactName && (
              <>
                <br />
                attn. {contactName}
              </>
            )}
            {supplierAddress && (
              <>
                <br />
                {supplierAddress.streetAndNo}
                <br />
                {[supplierAddress.postalCode, supplierAddress.city]
                  .filter(Boolean)
                  .join(" ")}
              </>
            )}
          </address>
          <dl className="grid grid-cols-[8rem_1fr] gap-y-1">
            <dt>Your reference:</dt>
            <dd>{purchaseOrder.reference ?? ""}</dd>
            <dt>Our reference:</dt>
            <dd>{purchaseOrder.ourReference ?? ""}</dd>
          </dl>
        </div>
      </section>

      <section className="mt-6 grid grid-cols-2 gap-8 border p-3">
        <dl className="grid grid-cols-[9rem_1fr] gap-y-1">
          <dt>Delivery date:</dt>
          <dd className="font-semibold">
            {formatDateValue(purchaseOrder.deliveryDate)}
          </dd>
          <dt>Delivery terms:</dt>
          <dd className="font-semibold">
            {purchaseOrder.deliveryTerms
              ? DELIVERY_TERM_LABELS[purchaseOrder.deliveryTerms]
              : "—"}
          </dd>
          <dd className="col-span-2">
            {purchaseOrder.arrangeTransport
              ? "Transport is arranged by us"
              : "Transport is arranged by you"}
          </dd>
        </dl>
        <dl className="grid grid-cols-[9rem_1fr] gap-y-1">
          <dt>Delivery address:</dt>
          <dd className="font-semibold">
            {affiliateName ?? "Swedinox"}
            <br />
            {yardAddress?.label ?? ""}
          </dd>
        </dl>
      </section>

      <table className="mt-6 w-full border-collapse text-xs">
        <thead>
          <tr className="border-b">
            <th className="py-1 text-left">Del. date</th>
            <th className="py-1 text-right">Line</th>
            <th className="py-1 text-right">Qty</th>
            <th className="py-1 text-left">Description</th>
            <th className="py-1 text-left">Type</th>
            <th className="py-1 text-right">Quantity</th>
            <th className="py-1 text-right">Price</th>
            <th className="py-1 text-left">Per</th>
            <th className="py-1 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {purchaseOrder.items.map((item) => (
            <tr key={item.uuid} className="border-b">
              <td className="py-1">{formatDateValue(item.receiptDate)}</td>
              <td className="py-1 text-right tabular-nums">
                {(item.lineNumber ?? 0) * 10}
              </td>
              <td className="py-1 text-right tabular-nums">
                {formatNumber(Number(item.orderedQuantity))}{" "}
                {item.unit?.toUpperCase() ?? ""}
              </td>
              <td className="py-1">
                {item.productName}
                {item.lengthMm || item.widthMm || item.thicknessMm
                  ? ` ${[item.lengthMm, item.widthMm, item.thicknessMm]
                      .filter((value) => value !== null && Number(value) > 0)
                      .map((value) => String(Number(value)))
                      .join("x")}mm`
                  : ""}
                {item.qualityCode ? ` ${item.qualityCode}` : ""}
              </td>
              <td className="py-1">{ORDER_SOURCE_TYPE_LABELS[item.sourceType]}</td>
              <td className="py-1 text-right tabular-nums">
                {formatNumber(Number(item.kgActual ?? item.kgPurchased ?? 0))} KG
              </td>
              <td className="py-1 text-right tabular-nums">
                {purchaseOrder.doNotPrintPrices
                  ? ""
                  : formatMoney(Number(item.netPrice ?? 0))}
              </td>
              <td className="py-1">{item.priceUnit ?? ""}</td>
              <td className="py-1 text-right tabular-nums">
                {purchaseOrder.doNotPrintPrices
                  ? ""
                  : formatMoney(Number(item.amount ?? 0))}
              </td>
            </tr>
          ))}
          <tr className="font-semibold">
            <td className="py-1" colSpan={3} />
            <td className="py-1">Total</td>
            <td className="py-1" />
            <td className="py-1 text-right tabular-nums">
              {formatNumber(totalKg)} KG
            </td>
            <td className="py-1" colSpan={2} />
            <td className="py-1 text-right tabular-nums">
              {purchaseOrder.doNotPrintPrices ? "" : formatMoney(totalAmount)}
            </td>
          </tr>
        </tbody>
      </table>
      {/* Running metres never print on the reference's document; kept out. */}
      <p className="sr-only">
        {formatNumber(
          purchaseOrder.items.reduce(
            (sum, item) =>
              sum +
              runningMeters({
                quantity: Number(item.orderedQuantity ?? 0),
                unit: item.unit,
                lengthMm: item.lengthMm,
              }),
            0,
          ),
        )}
      </p>

      <p className="mt-6">
        Payment terms:{" "}
        {purchaseOrder.paymentTerms
          ? INVOICE_PAYMENT_TERM_LABELS[purchaseOrder.paymentTerms]
          : "—"}
      </p>

      <p className="mt-4 text-xs">
        The materials you deliver are checked against our purchase order. Only
        the weighed weight is accepted by us as the basis for invoicing, unless
        piece or metre prices have been agreed. Any deviations, insofar as
        outside the DIN/NEN standard, are reported to you in writing as soon as
        possible after they are found.
      </p>

      {purchaseOrder.remarks && (
        <p className="mt-4 whitespace-pre-line text-xs">{purchaseOrder.remarks}</p>
      )}

      <p className="mt-6">Kind regards,</p>
      <p className="mt-4">
        {purchaseOrder.purchaserInitials ?? purchaseOrder.purchaser ?? ""}
      </p>
    </main>
  );
};
