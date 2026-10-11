import { Fragment } from "react";
import { QuoteDetail } from "@/app/(dashboard)/quotes/actions";
import {
  formatDateValue,
  formatMoney,
  formatNumber,
  fullName,
} from "@/lib/helpers";
import {
  DELIVERY_TERM_LABELS,
  INVOICE_PAYMENT_TERM_LABELS,
} from "@/lib/labels";

type Props = {
  quote: QuoteDetail;
  affiliateName: string | null;
  /** The seller's name, resolved from the Clerk id the quote stores. */
  sellerName: string | null;
};

/**
 * The quote as it goes to the customer: our letterhead, the number, the quote
 * date and how long it stands, the customer and contact, the lines grouped
 * under their product, the totals with VAT, the terms and the seller.
 */
export const QuoteDocument = ({ quote, affiliateName, sellerName }: Props) => {
  const contactName = [quote.contactFirstName, quote.contactLastName]
    .filter(Boolean)
    .join(" ");
  const showPrices = !quote.doNotShowTotalAmount;

  return (
    <main className="mx-auto max-w-3xl bg-background p-10 text-sm text-foreground print:p-0">
      <header className="flex items-start justify-between border-b pb-6">
        <p className="text-3xl font-semibold tracking-tight">
          {affiliateName ?? "Swedinox"}
        </p>
      </header>

      <section className="mt-8 grid grid-cols-2 gap-8">
        <div className="space-y-4">
          <p className="text-lg font-semibold">
            QUOTE <span className="ml-8 tabular-nums">{quote.id}</span>
          </p>
          <dl className="grid grid-cols-[9rem_1fr] gap-y-1">
            <dt>Date:</dt>
            <dd>{formatDateValue(quote.quoteDate ?? quote.createdAt)}</dd>
            <dt>Valid until:</dt>
            <dd>{formatDateValue(quote.validUntil)}</dd>
            <dt>Your reference:</dt>
            <dd>{quote.customerRef ?? ""}</dd>
            <dt>Our reference:</dt>
            <dd>{quote.ourReference ?? ""}</dd>
          </dl>
        </div>
        <address className="text-base font-semibold not-italic">
          {quote.companyName}
          {contactName && (
            <>
              <br />
              attn. {fullName(quote.contactFirstName, quote.contactLastName)}
            </>
          )}
        </address>
      </section>

      <p className="mt-8">We are pleased to offer you the following:</p>

      <table className="mt-2 w-full border-collapse text-xs">
        <thead>
          <tr className="border-b">
            <th className="py-1 text-left">Del. date</th>
            <th className="py-1 text-right">Line</th>
            <th className="py-1 text-right">Qty</th>
            <th className="py-1 text-left">Dim. (mm)</th>
            <th className="py-1 text-right">Weight</th>
            <th className="py-1 text-right">Price</th>
            <th className="py-1 text-left">Per</th>
            <th className="py-1 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {quote.items.map((item, index) => {
            const dimensions = [item.lengthMm, item.widthMm, item.thicknessMm]
              .filter((value) => value !== null && Number(value) > 0)
              .map((value) => String(Number(value)))
              .join("x");
            return (
              <Fragment key={item.uuid}>
                <tr>
                  <td className="pt-2 font-semibold" colSpan={8}>
                    {item.description ?? item.productName ?? item.productCode}
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="py-1">
                    {formatDateValue(item.deliveryDate ?? quote.deliveryDate)}
                  </td>
                  <td className="py-1 text-right tabular-nums">
                    {(item.lineNumber ?? index + 1) * 10}
                  </td>
                  <td className="py-1 text-right tabular-nums">
                    {formatNumber(Number(item.quantity ?? 0))}{" "}
                    {item.unit?.toUpperCase() ?? ""}
                  </td>
                  <td className="py-1">{dimensions}</td>
                  <td className="py-1 text-right tabular-nums">
                    {formatNumber(Number(item.weightKg ?? 0))} KG
                  </td>
                  <td className="py-1 text-right tabular-nums">
                    {showPrices ? formatMoney(Number(item.netPrice ?? 0)) : ""}
                  </td>
                  <td className="py-1">{item.priceUnit?.toUpperCase() ?? ""}</td>
                  <td className="py-1 text-right tabular-nums">
                    {showPrices ? formatMoney(Number(item.amount ?? 0)) : ""}
                  </td>
                </tr>
              </Fragment>
            );
          })}
        </tbody>
      </table>

      {showPrices && (
        <dl className="mt-4 ml-auto grid w-72 grid-cols-[1fr_auto] gap-y-1">
          <dt>Surcharges</dt>
          <dd className="text-right tabular-nums">
            {formatMoney(Number(quote.surchargesRevenue ?? 0))}
          </dd>
          <dt>Total excl. VAT</dt>
          <dd className="text-right tabular-nums">
            {formatMoney(Number(quote.totalExclVat ?? 0))}
          </dd>
          <dt>VAT</dt>
          <dd className="text-right tabular-nums">
            {formatMoney(Number(quote.vatAmount ?? 0))}
          </dd>
          <dt className="font-semibold">Total incl. VAT</dt>
          <dd className="text-right font-semibold tabular-nums">
            {formatMoney(Number(quote.totalInclVat ?? 0))}
          </dd>
          <dt>Total weight</dt>
          <dd className="text-right tabular-nums">
            {formatNumber(Number(quote.totalWeightKg ?? 0))} KG
          </dd>
        </dl>
      )}

      <dl className="mt-6 grid grid-cols-[9rem_1fr] gap-y-1">
        <dt>Delivery terms:</dt>
        <dd>
          {quote.isPickup
            ? "Pick-up"
            : quote.deliveryTerms
              ? DELIVERY_TERM_LABELS[quote.deliveryTerms]
              : ""}
        </dd>
        <dt>Payment terms:</dt>
        <dd>
          {quote.paymentTerms
            ? INVOICE_PAYMENT_TERM_LABELS[quote.paymentTerms]
            : ""}
        </dd>
      </dl>

      {quote.remarks && (
        <p className="mt-4 text-xs whitespace-pre-line">{quote.remarks}</p>
      )}

      <p className="mt-6">Kind regards,</p>
      <p className="mt-4">{sellerName ?? ""}</p>

      <footer className="mt-10 flex justify-between border-t pt-2 text-xs text-muted-foreground">
        <span>{affiliateName ?? "Swedinox"}</span>
        <span>Quote {quote.id} 1/1</span>
      </footer>
    </main>
  );
};
