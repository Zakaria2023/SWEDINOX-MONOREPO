import { ReactNode } from "react";
import Link from "next/link";
import { OrderHeaderInfo } from "@/app/(dashboard)/orders/[uuid]/actions";
import { OrderDetail } from "@/app/(dashboard)/orders/actions";
import { Button } from "@/components/shadcn/button";
import { QuoteSummaryPanel } from "@/components/quotes/quote-summary";
import { formatDateColumn, orderSummaryFromSnapshot } from "@/lib/helpers";
import {
  DELIVERY_TERM_LABELS,
  ORDER_METHOD_LABELS,
  ORDER_TYPE_LABELS,
  ORDER_WEIGHT_TYPE_LABELS,
} from "@/lib/labels";

type Props = {
  order: OrderDetail;
  header: OrderHeaderInfo | null;
  sellerName: string | null;
};

type FieldProps = {
  label: string;
  children: ReactNode;
};

type FlagProps = {
  label: string;
  checked: boolean | null;
};

/** One label/value row of the header, read-only as the reference greys it. */
const HeaderField = ({ label, children }: FieldProps) => (
  <div className="flex gap-3 text-sm">
    <dt className="w-32 shrink-0 text-muted-foreground">{label}</dt>
    <dd className="min-w-0 flex-1">
      {children === null || children === "" ? "—" : children}
    </dd>
  </div>
);

/** A ticked or empty box that cannot be changed from here. */
const HeaderFlag = ({ label, checked }: FlagProps) => (
  <label className="flex items-center gap-2 text-sm text-muted-foreground">
    <input
      type="checkbox"
      checked={checked ?? false}
      readOnly
      disabled
      className="size-4 accent-primary"
    />
    {label}
  </label>
);

/**
 * The read-only top of the reference's order screen (313/319/365): the header
 * fields and the `Order type` block side by side, then `Delivery` with
 * `Converted from quote …` under it, and the `Summary` beside them.
 *
 * Edits go through `Edit Details`, so nothing here is a form control.
 */
export const OrderHeader = ({ order, header, sellerName }: Props) => (
  <section className="grid gap-6 rounded-lg border p-4 xl:grid-cols-2">
    <div className="space-y-3">
      <p className="text-sm">
        Creation date: {formatDateColumn(order.createdAt)} - Delivery planned:{" "}
        {formatDateColumn(order.deliveryDate)}
        {header?.deliveredOn
          ? ` - Delivered: ${formatDateColumn(header.deliveredOn)}`
          : ""}
      </p>
      <dl className="space-y-1.5">
        <HeaderField label="Customer">
          {[header?.customerCode, order.companyName]
            .filter((part) => part !== null && part !== undefined)
            .join("  ")}
        </HeaderField>
        <HeaderField label="Contact">
          {[order.contactFirstName, order.contactLastName]
            .filter(Boolean)
            .join(" ")}
        </HeaderField>
        <HeaderField label="Customer ref.">{order.customerRef}</HeaderField>
        <HeaderField label="Order method">
          {order.orderMethod ? ORDER_METHOD_LABELS[order.orderMethod] : null}
        </HeaderField>
        <HeaderField label="Seller">{sellerName ?? order.seller}</HeaderField>
        <HeaderField label="Price date">
          {order.priceDate ? formatDateColumn(order.priceDate) : null}
        </HeaderField>
        <HeaderField label="Project">{header?.projectName ?? null}</HeaderField>
        <HeaderField label="Order category">{order.orderCategory}</HeaderField>
      </dl>
      <div className="flex flex-wrap gap-6">
        <HeaderFlag label="Leave customer ref." checked={order.leaveCustomer} />
        <HeaderFlag label="Handling blocked" checked={order.handlingBlocked} />
      </div>
    </div>

    <div className="space-y-3">
      <h3 className="text-sm font-semibold">Order type</h3>
      <div className="grid gap-2 sm:grid-cols-2">
        <HeaderFlag label="Pick-up" checked={order.isPickup} />
        <HeaderFlag
          label="Internal production / processing"
          checked={order.isInternalProduction}
        />
        <HeaderFlag label="Incidental" checked={order.isIncidental} />
        <HeaderFlag
          label="Customer material"
          checked={order.isCustomerMaterial}
        />
        <HeaderFlag
          label={`Consignment with a duration of ${order.consignmentDuration ?? "—"}`}
          checked={order.isConsignment}
        />
      </div>
      <dl className="space-y-1.5">
        <HeaderField label="Order type">
          {ORDER_TYPE_LABELS[order.orderType]}
        </HeaderField>
        <HeaderField label="Weight type">
          {order.weightType ? ORDER_WEIGHT_TYPE_LABELS[order.weightType] : null}
        </HeaderField>
      </dl>
      <div className="flex flex-wrap gap-6">
        <HeaderFlag label="Overlength" checked={order.isOverlength} />
        <HeaderFlag label="Printed" checked={order.isPrinted} />
        <HeaderFlag label="Mailed" checked={order.isMailed} />
        <HeaderFlag label="Faxed" checked={order.isFaxed} />
      </div>
    </div>

    <div className="space-y-3">
      <h3 className="text-sm font-semibold">Delivery</h3>
      <dl className="space-y-1.5">
        <HeaderField label="Delivery terms">
          {order.deliveryTerms ? DELIVERY_TERM_LABELS[order.deliveryTerms] : null}
        </HeaderField>
        <HeaderField label="Delivery address">
          {header?.deliveryAddress
            ? [
                header.deliveryAddress.streetAndNo,
                header.deliveryAddress.postalCode,
                header.deliveryAddress.city,
                header.deliveryAddress.country,
              ]
                .filter(Boolean)
                .join(", ")
            : null}
        </HeaderField>
        {order.orderType === "call_off" ? (
          <HeaderField label="Call-off period">
            {formatDateColumn(order.callOffPeriodFrom)} t/m{" "}
            {formatDateColumn(order.callOffPeriodTo)}
          </HeaderField>
        ) : (
          <>
            <HeaderField label={order.deliveryType === "week" ? "Week" : "Date"}>
              {order.deliveryType === "week"
                ? [order.deliveryWeek, order.deliveryYear]
                    .filter((part) => part !== null)
                    .join(" / ")
                : order.deliveryDate
                  ? formatDateColumn(order.deliveryDate)
                  : null}
            </HeaderField>
            <HeaderField label="Rem">{order.deliveryRemark}</HeaderField>
          </>
        )}
      </dl>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled
        title="Not built: the delivery date helper"
      >
        Keuzehulp
      </Button>
      {header && header.sourceQuotes.length > 0 && (
        <p className="text-sm">
          Converted from quote{" "}
          {header.sourceQuotes.map((quote, index) => (
            <span key={quote.uuid}>
              {index > 0 && ", "}
              <Link
                href={`/quotes/${quote.uuid}`}
                className="text-primary hover:underline"
              >
                {quote.id}
              </Link>
            </span>
          ))}
        </p>
      )}
    </div>

    {/* The order's own rollup — costed against the stock lots actually
        allocated to it, so it can report a truer margin than the quote. */}
    <QuoteSummaryPanel summary={orderSummaryFromSnapshot(order)} />
  </section>
);
