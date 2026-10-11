import { Fragment } from "react";
import { PurchaseReturnOrderDetail } from "@/app/(dashboard)/purchase-return-orders/actions";
import { YardDeliveryAddress } from "@/app/(dashboard)/purchase-orders/actions";
import {
  formatDateValue,
  formatMoney,
  formatNumber,
  onWorkingDay,
  toDateString,
} from "@/lib/helpers";

type Props = {
  returnOrder: PurchaseReturnOrderDetail;
  yardAddress: YardDeliveryAddress | null;
  affiliateName: string | null;
  /** The purchaser's name, resolved from the Clerk id the return stores. */
  purchaserName: string | null;
};

/**
 * The INKOOPRETOUR as the reference prints it when a return is made final
 * (950034, 11-10-2026): our letterhead, the number, the date and our purchase
 * order, the supplier's address block with the contact, the `** RETURN **`
 * banner, the box with the return date, who arranges transport and where the
 * goods are picked up, then the lines grouped under their product, the total
 * and the purchaser's signature. Laid out as the purchase order's document is.
 */
export const PurchaseReturnOrderDocument = ({
  returnOrder,
  yardAddress,
  affiliateName,
  purchaserName,
}: Props) => {
  const contactName = [returnOrder.contactFirstName, returnOrder.contactLastName]
    .filter(Boolean)
    .join(" ");
  const returnDate = returnOrder.returnDate
    ? toDateString(new Date(returnOrder.returnDate))
    : null;
  const totalKg = returnOrder.items.reduce(
    (sum, item) => sum + Number(item.weightKg ?? 0),
    0,
  );
  const totalAmount = returnOrder.items.reduce(
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
            PURCHASE RETURN{" "}
            <span className="ml-8 tabular-nums">{returnOrder.id}</span>
          </p>
          <dl className="grid grid-cols-[10rem_1fr] gap-y-1">
            <dt>Date:</dt>
            <dd>{formatDateValue(returnDate)}</dd>
            <dt>Our purchase order:</dt>
            <dd>
              {returnOrder.originalPurchaseOrderId ??
                returnOrder.purchaseOrderReference ??
                ""}
            </dd>
            {/* The return carries no reference of its own yet. */}
            <dt>Our reference:</dt>
            <dd />

          </dl>
        </div>
        <address className="text-base font-semibold not-italic">
          {returnOrder.supplierName}
          {contactName && (
            <>
              <br />
              attn. {contactName}
            </>
          )}
          {returnOrder.deliveryStreetAndNo && (
            <>
              <br />
              {returnOrder.deliveryStreetAndNo}
            </>
          )}
          {(returnOrder.deliveryPostalCode || returnOrder.deliveryCity) && (
            <>
              <br />
              {[returnOrder.deliveryPostalCode, returnOrder.deliveryCity]
                .filter(Boolean)
                .join(" ")}
            </>
          )}
          {returnOrder.deliveryCountry && (
            <>
              <br />
              {returnOrder.deliveryCountry}
            </>
          )}
        </address>
      </section>

      <p className="mt-8 text-center text-lg font-semibold tracking-wide">
        ** RETURN ** RETURN ** RETURN ** RETURN **
      </p>

      <section className="mt-6 grid grid-cols-2 gap-8 border p-3">
        <dl className="grid grid-cols-[9rem_1fr] gap-y-1">
          <dt>Return date:</dt>
          <dd className="font-semibold">
            {formatDateValue(returnDate ? onWorkingDay(returnDate) : null)}
          </dd>
          <dd className="col-span-2">
            {returnOrder.isDropOff
              ? "Transport is arranged by us"
              : "Transport is arranged by you"}
          </dd>
        </dl>
        <dl className="grid grid-cols-[9rem_1fr] gap-y-1">
          <dt>Pick-up address:</dt>
          <dd className="font-semibold">
            {affiliateName ?? "Swedinox"}
            <br />
            {returnOrder.pickupAddress ?? yardAddress?.label ?? ""}
          </dd>
        </dl>
      </section>

      <p className="mt-6">We hereby return the following items:</p>

      <table className="mt-2 w-full border-collapse text-xs">
        <thead>
          <tr className="border-b">
            <th className="py-1 text-left">Del. date</th>
            <th className="py-1 text-right">Line</th>
            <th className="py-1 text-right">Qty</th>
            <th className="py-1 text-left">Description</th>
            <th className="py-1 text-left">Dim. (mm)</th>
            <th className="py-1 text-right">Quantity</th>
            <th className="py-1 text-right">Price</th>
            <th className="py-1 text-right">Discount</th>
            <th className="py-1 text-left">Per</th>
            <th className="py-1 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {returnOrder.items.map((item, index) => {
            const isPriced = Number(item.netPrice ?? 0) > 0;
            const discount = Number(item.lineDiscountPercent ?? 0);
            // `2000x1000x2mm` on 950034: the line's own size, else its lot's.
            const dimensions = [
              item.lengthMm ?? item.lotLengthMm,
              item.widthMm ?? item.lotWidthMm,
              item.thicknessMm ?? item.lotThicknessMm,
            ]
              .filter((value) => value !== null && Number(value) > 0)
              .map((value) => String(Number(value)))
              .join("x");
            return (
              <Fragment key={item.uuid}>
                <tr>
                  <td className="pt-2 font-semibold" colSpan={10}>
                    {item.productName ?? item.productCode ?? ""}
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="py-1">
                    {formatDateValue(
                      item.returnDate ? onWorkingDay(item.returnDate) : null,
                    )}
                  </td>
                  <td className="py-1 text-right tabular-nums">
                    {(item.lineNumber ?? index + 1) * 10}
                  </td>
                  <td className="py-1 text-right tabular-nums">
                    {formatNumber(Number(item.returnQty ?? 0))}{" "}
                    {item.unit?.toUpperCase() ?? ""}
                  </td>
                  <td className="py-1">
                    {dimensions ? `${dimensions}mm` : ""}
                    {item.qualityCode ? ` ${item.qualityCode}` : ""}
                  </td>
                  <td className="py-1" />
                  <td className="py-1 text-right tabular-nums">
                    {formatNumber(Number(item.weightKg ?? 0))} KG
                  </td>
                  <td className="py-1 text-right tabular-nums">
                    {isPriced ? formatMoney(Number(item.netPrice ?? 0)) : ""}
                  </td>
                  <td className="py-1 text-right tabular-nums">
                    {isPriced && discount > 0 ? `${discount.toFixed(2)} %` : ""}
                  </td>
                  <td className="py-1">{item.priceUnit ?? ""}</td>
                  <td className="py-1 text-right tabular-nums">
                    {formatMoney(Number(item.amount ?? 0))}
                  </td>
                </tr>
              </Fragment>
            );
          })}
          <tr className="font-semibold">
            <td className="py-1" colSpan={3} />
            <td className="py-1">Total</td>
            <td className="py-1" />
            <td className="py-1 text-right tabular-nums">
              {formatNumber(totalKg)} KG
            </td>
            <td className="py-1" colSpan={3} />
            <td className="py-1 text-right tabular-nums">
              {formatMoney(totalAmount)}
            </td>
          </tr>
        </tbody>
      </table>

      {returnOrder.remarks && (
        <p className="mt-4 whitespace-pre-line text-xs">{returnOrder.remarks}</p>
      )}

      <p className="mt-6">Kind regards,</p>
      <p className="mt-4">{purchaserName ?? ""}</p>

      <footer className="mt-10 flex justify-between border-t pt-2 text-xs text-muted-foreground">
        <span>{affiliateName ?? "Swedinox"}</span>
        <span>Purchase return {returnOrder.id} 1/1</span>
      </footer>
    </main>
  );
};
