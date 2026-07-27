import { ReactNode } from "react";
import { CountListDeviationDetail } from "@/app/(dashboard)/count-list-deviations/actions";
import { STOCK_UNIT_LABELS } from "@/lib/labels";
import { formatDateValue } from "@/lib/helpers";

type Props = {
  deviation: CountListDeviationDetail;
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

export const CountListDeviationDetailView = ({ deviation }: Props) => (
  <div className="space-y-6">
    <div className="space-y-3">
      <h2 className="border-b pb-2 text-base font-semibold">Count workorder</h2>
      <div className="grid grid-cols-2 gap-4 rounded-lg border p-4 sm:grid-cols-3">
        <Field label="Workorder #">{deviation.workOrderNumber ?? "—"}</Field>
        <Field label="Workorder date">
          {formatDateValue(deviation.workOrderDate)}
        </Field>
        <Field label="Booked by">{deviation.bookedBy ?? "—"}</Field>
        <Field label="Location">{deviation.location ?? "—"}</Field>
        <Field label="Product">
          {[deviation.productCode, deviation.productName]
            .filter(Boolean)
            .join(" — ") || "—"}
        </Field>
        <Field label="Length (mm)">{deviation.length ?? "—"}</Field>
        <Field label="Document">{deviation.documentReference ?? "—"}</Field>
        <Field label="Date reported as completed">
          {formatDateValue(deviation.dateReportedAsCompleted)}
        </Field>
      </div>
    </div>

    <div className="space-y-3">
      <h2 className="border-b pb-2 text-base font-semibold">Correction</h2>
      <div className="grid grid-cols-2 gap-4 rounded-lg border p-4 sm:grid-cols-3">
        <Field label="Quantity">
          {deviation.quantity}
          {deviation.unit ? ` ${STOCK_UNIT_LABELS[deviation.unit]}` : ""}
        </Field>
        <Field label="Kg.">{deviation.kg ?? "—"}</Field>
        <Field label="Amount">{deviation.amount ?? "—"}</Field>
        <Field label="Old stock">{deviation.oldStockQty ?? "—"}</Field>
        <Field label="Old stock Kg.">{deviation.oldStockKg ?? "—"}</Field>
        <Field label="New stock">{deviation.newStockQty ?? "—"}</Field>
        <Field label="New stock Kg.">{deviation.newStockKg ?? "—"}</Field>
      </div>
    </div>
  </div>
);
