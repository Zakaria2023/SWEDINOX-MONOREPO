import Link from "next/link";
import { QuoteLineRow } from "@/app/(dashboard)/quote-lines/actions";
import { DetailField } from "@/components/ui/detail-field";
import {
  formatDateColumn,
  formatDateValue,
  formatMoney,
  formatPercent,
  userName,
} from "@/lib/helpers";
import {
  CUSTOMER_GROUP_LABELS,
  ORDER_LINE_STATUS_LABELS,
  SALES_REPRESENTATIVE_LABELS,
  STOCK_UNIT_LABELS,
} from "@/lib/labels";

type Props = {
  /** Clerk id -> name; these columns store the id, not the name. */
  userNames: Record<string, string>;
  line: QuoteLineRow;
};

export const QuoteLineDetailView = ({ line, userNames }: Props) => (
  <div className="space-y-6">
    <section className="space-y-4">
      <h2 className="border-b pb-2 text-base font-semibold">Quote</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Quote
          </p>
          {line.quoteId === null ? (
            <p className="text-sm">—</p>
          ) : (
            <Link
              href={`/quotes/${line.quoteUuid}`}
              className="text-sm text-primary hover:underline"
            >
              #{line.quoteId}
            </Link>
          )}
        </div>
        <DetailField label="Our reference" value={line.ourReference} />
        <DetailField label="Customer reference" value={line.customerRef} />
        <DetailField
          label="Quote date"
          value={formatDateColumn(line.quoteDate)}
        />
        <DetailField
          label="Decision date"
          value={formatDateColumn(line.decisionDate)}
        />
        <DetailField
          label="Valid until"
          value={formatDateColumn(line.validUntil)}
        />
        <DetailField label="Order type" value={line.orderType} />
        <DetailField label="Seller" value={userName(line.seller, userNames)} />
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Converted to order
          </p>
          {line.convertedToOrderUuid && line.convertedToOrderId !== null ? (
            <Link
              href={`/orders/${line.convertedToOrderUuid}`}
              className="text-sm text-primary hover:underline"
            >
              #{line.convertedToOrderId}
            </Link>
          ) : (
            <p className="text-sm">Not converted</p>
          )}
        </div>
      </div>
    </section>

    <section className="space-y-4">
      <h2 className="border-b pb-2 text-base font-semibold">Customer</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <DetailField label="Customer" value={line.customerName} />
        <DetailField label="Customer code" value={line.customerCode} />
        <DetailField label="City" value={line.city} />
        <DetailField
          label="Customer group"
          value={
            line.customerGroup
              ? CUSTOMER_GROUP_LABELS[line.customerGroup]
              : null
          }
        />
        <DetailField
          label="Representative"
          value={
            line.representative
              ? SALES_REPRESENTATIVE_LABELS[line.representative]
              : null
          }
        />
        <DetailField
          label="Last follow-up"
          value={formatDateColumn(line.lastFollowUpDate)}
        />
        <DetailField label="Followed up by" value={line.lastFollowUpBy} />
      </div>
      <DetailField label="Follow-up note" value={line.lastFollowUp} />
    </section>

    <section className="space-y-4">
      <h2 className="border-b pb-2 text-base font-semibold">Line</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <DetailField label="Line number" value={line.lineNumber} />
        <DetailField label="Line type" value={line.lineType} />
        <DetailField
          label="Status"
          value={line.status ? ORDER_LINE_STATUS_LABELS[line.status] : null}
        />
        <DetailField label="Expiration reason" value={line.expirationReason} />
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Product
          </p>
          {line.productUuid && line.productCode ? (
            <Link
              href={`/products/${line.productUuid}`}
              className="text-sm text-primary hover:underline"
            >
              {[line.productCode, line.productName].filter(Boolean).join(" — ")}
            </Link>
          ) : (
            <p className="text-sm">—</p>
          )}
        </div>
        <DetailField label="Description" value={line.description} />
        <DetailField label="Reference" value={line.reference} />
        <DetailField label="Options" value={line.options} />
        <DetailField
          label="Revenue group"
          value={
            [line.revenueGroupNumber, line.revenueGroupName]
              .filter(Boolean)
              .join(" — ") || null
          }
        />
        <DetailField
          label="Delivery date"
          value={formatDateColumn(line.deliveryDate)}
        />
        <DetailField label="Created" value={formatDateValue(line.createdAt)} />
        <DetailField
          label="Last modified"
          value={formatDateValue(line.updatedAt)}
        />
      </div>
    </section>

    <section className="space-y-4">
      <h2 className="border-b pb-2 text-base font-semibold">
        Quantity and dimensions
      </h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <DetailField
          label="Quantity"
          value={`${line.quantity} ${
            line.unit ? STOCK_UNIT_LABELS[line.unit] : ""
          }`.trim()}
        />
        <DetailField label="Weight (kg)" value={line.weightKg} />
        <DetailField label="Length (mm)" value={line.lengthMm} />
        <DetailField label="Width (mm)" value={line.widthMm} />
        <DetailField label="Thickness (mm)" value={line.thicknessMm} />
      </div>
    </section>

    <section className="space-y-4">
      <h2 className="border-b pb-2 text-base font-semibold">
        Pricing and margin
      </h2>
      <p className="text-sm text-muted-foreground">
        Profit is reported twice: against what the goods cost when quoted, and
        against what re-buying them would cost today.
      </p>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <DetailField
          label="Gross price"
          value={`${formatMoney(Number(line.grossPrice ?? 0))} ${
            line.priceUnit ?? ""
          }`.trim()}
        />
        <DetailField
          label="Group discount"
          value={formatPercent(Number(line.groupDiscount ?? 0))}
        />
        <DetailField
          label="Line discount"
          value={formatPercent(Number(line.lineDiscount ?? 0))}
        />
        <DetailField
          label="Net price"
          value={formatMoney(Number(line.netPrice ?? 0))}
        />
        <DetailField
          label="Amount"
          value={formatMoney(Number(line.amount ?? 0))}
        />
        <DetailField
          label="Cost price"
          value={formatMoney(Number(line.costPrice ?? 0))}
        />
        <DetailField
          label="Purchase price"
          value={formatMoney(Number(line.purchasePrice ?? 0))}
        />
        <DetailField
          label="Replacement price"
          value={formatMoney(Number(line.replacementPrice ?? 0))}
        />
        <DetailField
          label="Profit"
          value={formatMoney(Number(line.profit ?? 0))}
        />
        <DetailField
          label="Profit margin"
          value={formatPercent(Number(line.profitMargin ?? 0))}
        />
      </div>
    </section>
  </div>
);
