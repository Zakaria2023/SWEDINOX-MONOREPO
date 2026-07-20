import type { ReactNode } from "react";
import Link from "next/link";
import { FreightMovementDetail } from "@/app/(dashboard)/freight-movements/actions";
import { STOCK_MOVEMENT_REASON_LABELS, STOCK_UNIT_LABELS } from "@/lib/labels";
import { formatDateValue } from "@/lib/helpers";

type Props = {
  movement: FreightMovementDetail;
};

type FieldProps = {
  label: string;
  children: ReactNode;
};

const Field = ({ label, children }: FieldProps) => (
  <div>
    <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
      {label}
    </p>
    <p className="text-sm">{children}</p>
  </div>
);

export const FreightMovementDetailView = ({ movement }: Props) => (
  <div className="space-y-6">
    <div className="space-y-3">
      <h2 className="border-b pb-2 text-base font-semibold">Mutation</h2>
      <div className="grid grid-cols-2 gap-4 rounded-lg border p-4 sm:grid-cols-3">
        <Field label="Mutation date / time">
          {new Date(movement.mutationDate).toLocaleString("en-GB")}
        </Field>
        <Field label="Operator">{movement.mutationOperator ?? "—"}</Field>
        <Field label="Reason">
          {STOCK_MOVEMENT_REASON_LABELS[movement.reason]}
        </Field>
        <Field label="Product">
          {[movement.productCode, movement.productName]
            .filter(Boolean)
            .join(" — ") || "—"}
        </Field>
        <Field label="Dimensions (L × W mm)">
          {[movement.length, movement.widthDiameter]
            .map((value) => value ?? "—")
            .join(" × ")}
        </Field>
        <Field label="Mutation quantity">
          {movement.mutationQuantity}
          {movement.stockUnit
            ? ` ${STOCK_UNIT_LABELS[movement.stockUnit]}`
            : ""}
        </Field>
        <Field label="Internal charge">
          {movement.internalCharge ?? "—"}
        </Field>
        <Field label="Workorder #">{movement.workOrderNumber ?? "—"}</Field>
        <Field label="General ledger">{movement.generalLedger ?? "—"}</Field>
      </div>
    </div>

    <div className="space-y-3">
      <h2 className="border-b pb-2 text-base font-semibold">Stock balance</h2>
      <div className="grid grid-cols-2 gap-4 rounded-lg border p-4 sm:grid-cols-3">
        <Field label="Start date">{formatDateValue(movement.startDate)}</Field>
        <Field label="Starting stock">
          {movement.startingStockQty ?? "—"}
        </Field>
        <Field label="Starting value">
          {movement.startingStockValue ?? "—"}
        </Field>
        <Field label="End date">{formatDateValue(movement.endDate)}</Field>
        <Field label="Closing stock">{movement.closingStockQty ?? "—"}</Field>
        <Field label="Closing value">
          {movement.closingStockValue ?? "—"}
        </Field>
      </div>
    </div>

    <div className="space-y-3">
      <h2 className="border-b pb-2 text-base font-semibold">
        Accounting &amp; sources
      </h2>
      <div className="grid grid-cols-2 gap-4 rounded-lg border p-4 sm:grid-cols-3">
        <Field label="Revenue group">{movement.revenueGroupName ?? "—"}</Field>
        <Field label="Company">
          {[movement.companyId, movement.companyName]
            .filter(Boolean)
            .join(" — ") || "—"}
        </Field>
        <Field label="Order">
          {movement.orderId ? (
            <Link
              href={`/orders/${movement.orderUuid}`}
              className="font-medium underline-offset-4 hover:underline"
            >
              #{movement.orderId}
            </Link>
          ) : (
            "—"
          )}
        </Field>
        <Field label="Charge">{movement.chargeCode ?? "—"}</Field>
        <Field label="Purchase order">
          {movement.purchaseOrderId ? (
            <Link
              href={`/purchase-orders/${movement.purchaseOrderUuid}`}
              className="font-medium underline-offset-4 hover:underline"
            >
              #{movement.purchaseOrderId}
            </Link>
          ) : (
            "—"
          )}
        </Field>
        <Field label="Receipt date">
          {formatDateValue(movement.receiptDate)}
        </Field>
        <Field label="Supplier">{movement.supplierName ?? "—"}</Field>
        <Field label="Text">{movement.text ?? "—"}</Field>
      </div>
    </div>
  </div>
);
