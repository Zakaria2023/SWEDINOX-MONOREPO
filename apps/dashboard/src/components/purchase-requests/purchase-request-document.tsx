import { Fragment } from "react";
import { YardDeliveryAddress } from "@/app/(dashboard)/purchase-orders/actions";
import { PurchaseRequestDetail } from "@/app/(dashboard)/purchase-requests/actions";
import { SelectCompanyAddresses } from "@/db/schema/company-addresses";
import { formatDateValue, formatNumber } from "@/lib/helpers";

type PrintedAddress = Pick<
  SelectCompanyAddresses,
  "streetAndNo" | "postalCode" | "city"
> & {
  country: SelectCompanyAddresses["country"] | null;
};

type Props = {
  request: PurchaseRequestDetail;
  /** The supplier's address block: the request's own, else the company's first. */
  supplierAddress: PrintedAddress | null;
  yardAddress: YardDeliveryAddress | null;
  affiliateName: string | null;
  /** The purchaser's name and e-mail, resolved from the Clerk id the request stores. */
  purchaserName: string | null;
  purchaserEmail: string | null;
};

/**
 * The INKOOPAANVRAAG as the reference prints it when a request is made final
 * (800010, 12-10-2026): our letterhead, the number and the date the request
 * was raised, the supplier's address block with the contact and the two
 * references, the box with the requested delivery date, who arranges
 * transport and where the goods go, then the lines grouped under their
 * product — quantity and weight, with the price left blank because the price
 * is what is being asked — the total weight and the purchaser's signature.
 * Laid out as the purchase return's document is.
 */
export const PurchaseRequestDocument = ({
  request,
  supplierAddress,
  yardAddress,
  affiliateName,
  purchaserName,
  purchaserEmail,
}: Props) => {
  const contactName = [request.contactFirstName, request.contactLastName]
    .filter(Boolean)
    .join(" ");
  const totalKg = request.items.reduce(
    (sum, item) => sum + Number(item.kg ?? 0),
    0,
  );
  // `13-10-2026` on 800010: the planned date, or the week when a week was
  // planned instead.
  const requestedDelivery =
    request.deliveryType === "week" && request.deliveryWeek
      ? `Week ${request.deliveryWeek}${request.deliveryYear ? ` ${request.deliveryYear}` : ""}`
      : formatDateValue(request.deliveryDate, "");
  const deliveryLines = request.deliveryStreetAndNo
    ? [
        request.deliveryStreetAndNo,
        [request.deliveryPostalCode, request.deliveryCity]
          .filter(Boolean)
          .join(" "),
        request.deliveryCountry,
      ].filter(Boolean)
    : [yardAddress?.label ?? ""];
  const supplierLines = supplierAddress
    ? [
        supplierAddress.streetAndNo,
        [supplierAddress.postalCode, supplierAddress.city]
          .filter(Boolean)
          .join(" "),
        supplierAddress.country,
      ].filter(Boolean)
    : [];

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
            PURCHASE REQUEST{" "}
            <span className="ml-8 tabular-nums">{request.id}</span>
          </p>
          <dl className="grid grid-cols-2 gap-y-1">
            <dt>Request date:</dt>
            <dd>{formatDateValue(request.createdAt)}</dd>
          </dl>
        </div>
        <div className="space-y-4">
          <address className="text-base font-semibold not-italic">
            {request.companyName}
            {contactName && (
              <>
                <br />
                attn. {contactName}
              </>
            )}
            {supplierLines.map((line) => (
              <Fragment key={line}>
                <br />
                {line}
              </Fragment>
            ))}
          </address>
          <dl className="grid grid-cols-2 gap-y-1">
            <dt>Your reference:</dt>
            <dd>{request.reference ?? ""}</dd>
            <dt>Our reference:</dt>
            <dd>{request.ourReference ?? ""}</dd>
          </dl>
        </div>
      </section>

      <section className="mt-6 grid grid-cols-2 gap-8 border p-3">
        <dl className="grid grid-cols-2 gap-y-1">
          <dt>Requested delivery date:</dt>
          <dd className="font-semibold">{requestedDelivery}</dd>
          <dd className="col-span-2">
            {request.arrangeTransport
              ? "Transport is arranged by us"
              : "Transport is arranged by you"}
          </dd>
        </dl>
        <dl className="grid grid-cols-2 gap-y-1">
          <dt>Delivery address:</dt>
          <dd className="font-semibold">
            {affiliateName ?? "Swedinox"}
            {deliveryLines.map((line) => (
              <Fragment key={line}>
                <br />
                {line}
              </Fragment>
            ))}
          </dd>
        </dl>
      </section>

      <p className="mt-6">
        Please send us your price and delivery time by return for the
        materials below:
      </p>

      <table className="mt-2 w-full border-collapse text-xs">
        <thead>
          <tr className="border-b">
            <th className="py-1 text-right">Line</th>
            <th className="py-1 text-right">Qty</th>
            <th className="py-1 text-left">Description</th>
            <th className="py-1 text-left">Dimensions</th>
            <th className="py-1 text-right">Quantity</th>
            <th className="py-1 text-right">Price</th>
            <th className="py-1 text-left">Per</th>
          </tr>
        </thead>
        <tbody>
          {request.items.map((item, index) => {
            const heading =
              item.productName ?? item.description ?? item.productCode ?? "";
            const previous = index > 0 ? request.items[index - 1] : null;
            const previousHeading = previous
              ? (previous.productName ??
                previous.description ??
                previous.productCode ??
                "")
              : null;
            // `2000x1000x2mm EN 1.4307` on 800010: the line's size and quality.
            const dimensions = [item.lengthMm, item.widthMm, item.thicknessMm]
              .filter((value) => value !== null && Number(value) > 0)
              .map((value) => String(Number(value)))
              .join("x");
            const description = [
              dimensions ? `${dimensions}mm` : null,
              item.qualityCode,
            ]
              .filter(Boolean)
              .join(" ");
            return (
              <Fragment key={item.uuid}>
                {/* The product heads its lines once, as the reference groups
                    them. */}
                {heading !== previousHeading && (
                  <tr>
                    <td className="pt-2 font-semibold" colSpan={7}>
                      {heading}
                    </td>
                  </tr>
                )}
                <tr className="border-b">
                  <td className="py-1 text-right tabular-nums">
                    {(item.lineNumber ?? index + 1) * 10}
                  </td>
                  <td className="py-1 text-right tabular-nums">
                    {formatNumber(Number(item.quantity ?? 0))}{" "}
                    {item.unit?.toUpperCase() ?? ""}
                  </td>
                  <td className="py-1">
                    {description}
                  </td>
                  <td className="py-1" />
                  <td className="py-1 text-right tabular-nums">
                    {formatNumber(Number(item.kg ?? 0))} KG
                  </td>
                  {/* Blank: the price is the question this request asks. */}
                  <td className="py-1" />
                  <td className="py-1" />
                </tr>
              </Fragment>
            );
          })}
          <tr className="font-semibold">
            <td className="py-1" colSpan={2} />
            <td className="py-1">Total</td>
            <td className="py-1" />
            <td className="py-1 text-right tabular-nums">
              {formatNumber(totalKg)} KG
            </td>
            <td className="py-1" colSpan={2} />
          </tr>
        </tbody>
      </table>

      {request.deliveryRemark && (
        <p className="mt-4 whitespace-pre-line text-xs">
          {request.deliveryRemark}
        </p>
      )}

      <p className="mt-6">Awaiting your offer, we remain,</p>
      <p className="mt-2">Kind regards,</p>
      <p className="mt-4">{purchaserName ?? ""}</p>
      {/* No telephone is kept for a user, so `Tel:` prints bare. */}
      <p className="text-xs">Tel:</p>
      <p className="text-xs">E-mail: {purchaserEmail ?? ""}</p>

      <footer className="mt-10 flex justify-between border-t pt-2 text-xs text-muted-foreground">
        <span>{affiliateName ?? "Swedinox"}</span>
        <span>Purchase request {request.id} 1/1</span>
      </footer>
    </main>
  );
};
