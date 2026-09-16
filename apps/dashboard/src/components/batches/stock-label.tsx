import { BatchDetail } from "@/app/(dashboard)/batches/actions";
import {
  formatDateColumn,
  formatLengthMm,
  formatNumber,
  orDash,
} from "@/lib/helpers";
import { STOCK_UNIT_LABELS } from "@/lib/labels";

type Props = {
  batch: BatchDetail;
};

type LabelFieldProps = {
  label: string;
  value: string | number | null;
};

const LabelField = ({ label, value }: LabelFieldProps) => (
  <div>
    <dt className="text-xs text-muted-foreground uppercase">{label}</dt>
    <dd className="font-medium">{orDash(value)}</dd>
  </div>
);

/**
 * The stock label for one batch — what goes on the bundle so the rack, the
 * picker and the customer can read which heat and which internal charge it is.
 * The internal charge is the key a delivered sheet traces back by, so it is
 * printed largest.
 */
export const StockLabel = ({ batch }: Props) => (
  <article className="mx-auto max-w-md space-y-4 rounded-lg border-2 border-foreground p-6">
    <header className="space-y-1 border-b pb-3">
      <p className="text-xs text-muted-foreground uppercase">
        Internal charge
      </p>
      <p className="text-4xl font-semibold tracking-tight">
        {batch.internalCharge ?? "—"}
      </p>
    </header>
    <div>
      <p className="text-lg font-semibold">{orDash(batch.productCode)}</p>
      <p className="text-sm">{orDash(batch.productName)}</p>
    </div>
    <dl className="grid grid-cols-2 gap-3 text-sm">
      <LabelField label="Charge" value={batch.charge} />
      <LabelField label="Sheet number" value={batch.sheetNumber} />
      <LabelField label="Quality" value={batch.qualityCode} />
      <LabelField label="Stock category" value={batch.stockCategory} />
      <LabelField
        label="Dimensions"
        value={`${formatLengthMm(batch.lengthMm)} x ${orDash(batch.widthMm)} x ${orDash(batch.thicknessMm)}`}
      />
      <LabelField label="Options" value={batch.options} />
      <LabelField
        label="Quantity"
        value={`${formatNumber(Number(batch.qty ?? 0))} ${batch.unit ? STOCK_UNIT_LABELS[batch.unit] : ""}`}
      />
      <LabelField label="Weight (kg)" value={formatNumber(Number(batch.kg ?? 0))} />
      <LabelField label="Supplier" value={batch.supplierName} />
      <LabelField
        label="Purchase order"
        value={batch.purchaseOrderId ?? batch.purchaseOrderCode}
      />
      <LabelField
        label="Receipt date"
        value={formatDateColumn(batch.receiptDate)}
      />
    </dl>
  </article>
);
