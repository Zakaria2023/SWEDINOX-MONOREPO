import Link from "next/link";
import { DetailField } from "@/components/ui/detail-field";
import { OrderLineStatus, OrderType, StockUnit } from "@/lib/enums";
import { formatDateColumn, yesNo } from "@/lib/helpers";
import {
  ORDER_LINE_STATUS_LABELS,
  ORDER_TYPE_LABELS,
  STOCK_UNIT_LABELS,
} from "@/lib/labels";

/**
 * The order line a production/logistics planning row hangs off. Declared
 * structurally rather than against one action's DTO, because the nesting,
 * (re)optimize and production-capacity-detail rows all carry this same set of
 * joined columns and all three screens print it identically.
 */
export type OrderLineContextRow = {
  orderId: number | null;
  orderUuid: string | null;
  orderType: OrderType | null;
  companyName: string | null;
  companyUuid: string | null;
  productUuid: string | null;
  productCode: string | null;
  productName: string | null;
  lineNumber: number | null;
  lineType: string | null;
  lineStatus: OrderLineStatus | null;
  orderLineDeliveryDate: string | Date | null;
  isPickup: boolean | null;
  unit: StockUnit | null;
  lengthMm: number | null;
  widthMm: number | null;
  thicknessMm: string | null;
  qtyPlanned: string | null;
  qtyActual: string | null;
  kgPlanned: string | null;
  kgActual: string | null;
  theoreticalWeight: string | null;
  theoreticalWeightUnit: string | null;
};

type Props = {
  line: OrderLineContextRow;
};

export const OrderLineContext = ({ line }: Props) => (
  <section className="space-y-4">
    <h2 className="border-b pb-2 text-base font-semibold">Order line</h2>
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      <div>
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Order
        </p>
        {line.orderUuid && line.orderId !== null ? (
          <Link
            href={`/orders/${line.orderUuid}`}
            className="text-sm text-primary hover:underline"
          >
            #{line.orderId}
          </Link>
        ) : (
          <p className="text-sm">—</p>
        )}
      </div>
      <DetailField
        label="Order type"
        value={line.orderType ? ORDER_TYPE_LABELS[line.orderType] : null}
      />
      <div>
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Customer
        </p>
        {line.companyUuid && line.companyName ? (
          <Link
            href={`/companies/${line.companyUuid}`}
            className="text-sm text-primary hover:underline"
          >
            {line.companyName}
          </Link>
        ) : (
          <p className="text-sm">—</p>
        )}
      </div>
      <DetailField label="Line number" value={line.lineNumber} />
      <DetailField label="Line type" value={line.lineType} />
      <DetailField
        label="Line status"
        value={
          line.lineStatus ? ORDER_LINE_STATUS_LABELS[line.lineStatus] : null
        }
      />
      <DetailField
        label="Line delivery date"
        value={formatDateColumn(line.orderLineDeliveryDate)}
      />
      <DetailField label="Pickup" value={yesNo(line.isPickup)} />
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
      <DetailField
        label="Unit"
        value={line.unit ? STOCK_UNIT_LABELS[line.unit] : null}
      />
      <DetailField label="Length (mm)" value={line.lengthMm} />
      <DetailField label="Width (mm)" value={line.widthMm} />
      <DetailField label="Thickness (mm)" value={line.thicknessMm} />
      <DetailField label="Quantity planned" value={line.qtyPlanned} />
      <DetailField label="Quantity actual" value={line.qtyActual} />
      <DetailField label="Kg planned" value={line.kgPlanned} />
      <DetailField label="Kg actual" value={line.kgActual} />
      <DetailField
        label="Theoretical weight"
        value={
          line.theoreticalWeight === null
            ? null
            : `${line.theoreticalWeight} ${
                line.theoreticalWeightUnit ?? ""
              }`.trim()
        }
      />
    </div>
  </section>
);
