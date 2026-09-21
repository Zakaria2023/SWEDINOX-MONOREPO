import Link from "next/link";
import { ReturnLineDetail } from "@/app/(dashboard)/return-lines/actions";
import { DetailField } from "@/components/ui/detail-field";
import {
  formatDateColumn,
  formatDateValue,
  formatMoney,
  formatPercent,
} from "@/lib/helpers";
import {
  ORDER_LINE_STATUS_LABELS,
  RETURN_ORDER_REASON_LABELS,
  RETURN_ORDER_STATUS_LABELS,
  STOCK_UNIT_LABELS,
} from "@/lib/labels";

type Props = {
  line: ReturnLineDetail;
};

export const ReturnLineDetailView = ({ line }: Props) => (
  <div className="space-y-6">
    <section className="space-y-4">
      <h2 className="border-b pb-2 text-base font-semibold">Return order</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Return order
          </p>
          {line.returnOrderId === null ? (
            <p className="text-sm">—</p>
          ) : (
            <Link
              href={`/return-orders/${line.returnOrderUuid}`}
              className="text-sm text-primary hover:underline"
            >
              #{line.returnOrderId}
            </Link>
          )}
        </div>
        <DetailField
          label="Return order status"
          value={
            line.returnOrderStatus
              ? RETURN_ORDER_STATUS_LABELS[line.returnOrderStatus]
              : null
          }
        />
        <DetailField
          label="Return order reason"
          value={
            line.returnOrderReason
              ? RETURN_ORDER_REASON_LABELS[line.returnOrderReason]
              : null
          }
        />
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Customer
          </p>
          {line.companyUuid && line.customerName ? (
            <Link
              href={`/companies/${line.companyUuid}`}
              className="text-sm text-primary hover:underline"
            >
              {line.customerName}
            </Link>
          ) : (
            <p className="text-sm">—</p>
          )}
        </div>
      </div>
    </section>

    <section className="space-y-4">
      <h2 className="border-b pb-2 text-base font-semibold">Line and origin</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <DetailField label="Line number" value={line.lineNumber} />
        <DetailField label="Line type" value={line.lineType} />
        <DetailField
          label="Line status"
          value={
            line.lineStatus ? ORDER_LINE_STATUS_LABELS[line.lineStatus] : null
          }
        />
        <DetailField label="Reference" value={line.reference} />
        <DetailField
          label="Return reason on the line"
          value={
            line.returnReason
              ? RETURN_ORDER_REASON_LABELS[line.returnReason]
              : null
          }
        />
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
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Original order
          </p>
          {line.originalOrderUuid ? (
            <Link
              href={`/orders/${line.originalOrderUuid}`}
              className="text-sm text-primary hover:underline"
            >
              {line.originalOrderLine === null
                ? "View order"
                : `Line ${line.originalOrderLine}`}
            </Link>
          ) : (
            <p className="text-sm">—</p>
          )}
        </div>
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Original order line
          </p>
          {line.originalOrderItemUuid ? (
            <Link
              href={`/order-lines/${line.originalOrderItemUuid}`}
              className="text-sm text-primary hover:underline"
            >
              View line
            </Link>
          ) : (
            <p className="text-sm">—</p>
          )}
        </div>
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Complaint
          </p>
          {line.complaintUuid ? (
            <Link
              href={`/complaints/${line.complaintUuid}`}
              className="text-sm text-primary hover:underline"
            >
              View complaint
            </Link>
          ) : (
            <p className="text-sm">—</p>
          )}
        </div>
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
        Goods coming back
      </h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <DetailField
          label="Quantity"
          value={`${line.quantity} ${
            line.unit ? STOCK_UNIT_LABELS[line.unit] : ""
          }`.trim()}
        />
        <DetailField label="Return quantity" value={line.returnQty} />
        <DetailField label="Weight (kg)" value={line.weightKg} />
        <DetailField label="Length (mm)" value={line.lengthMm} />
        <DetailField label="Width (mm)" value={line.widthMm} />
        <DetailField label="Thickness (mm)" value={line.thicknessMm} />
        <DetailField label="Quality code" value={line.qualityCode} />
        <DetailField label="Stock category" value={line.stockCategory} />
        <DetailField label="Options" value={line.options} />
        <DetailField label="Country" value={line.country} />
      </div>
    </section>

    <section className="space-y-4">
      <h2 className="border-b pb-2 text-base font-semibold">
        Pricing and margin
      </h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <DetailField
          label="Net price"
          value={`${formatMoney(Number(line.netPrice ?? 0))} ${
            line.priceUnit ?? ""
          }`.trim()}
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
          label="Fixed sales price"
          value={formatMoney(Number(line.fsp ?? 0))}
        />
        <DetailField
          label="Average purchase price"
          value={formatMoney(Number(line.app ?? 0))}
        />
        <DetailField
          label="Replacement price"
          value={formatMoney(Number(line.replacementPrice ?? 0))}
        />
        <DetailField label="Profit" value={formatMoney(line.profit)} />
        <DetailField
          label="Profit margin"
          value={formatPercent(line.profitMargin)}
        />
      </div>
    </section>
  </div>
);
