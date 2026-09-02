import Link from "next/link";
import { TransportWorkOrderLineDetail } from "@/app/(dashboard)/transport-workorders/actions";
import { DetailField } from "@/components/ui/detail-field";
import { formatDateColumn, formatDateValue } from "@/lib/helpers";
import { WORK_ORDER_STATUS_LABELS } from "@/lib/labels";

type Props = {
  line: TransportWorkOrderLineDetail;
};

export const TransportWorkOrderLineDetailView = ({ line }: Props) => (
  <div className="space-y-6">
    <section className="space-y-4">
      <h2 className="border-b pb-2 text-base font-semibold">Trip</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <DetailField
          label="Work order"
          value={line.workOrderId === null ? null : `#${line.workOrderId}`}
        />
        <DetailField label="Trip number" value={line.tripNumber} />
        <DetailField
          label="Trip date"
          value={formatDateColumn(line.workOrderDate)}
        />
        <DetailField label="Vehicle" value={line.vehicle} />
        <DetailField
          label="Work order status"
          value={
            line.workOrderStatus
              ? WORK_ORDER_STATUS_LABELS[line.workOrderStatus]
              : null
          }
        />
      </div>
    </section>

    <section className="space-y-4">
      <h2 className="border-b pb-2 text-base font-semibold">Line</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <DetailField
          label="Line status"
          value={WORK_ORDER_STATUS_LABELS[line.status]}
        />
        <DetailField label="Source status" value={line.sourceStatus} />
        <DetailField label="Action" value={line.action} />
        <DetailField label="Order number" value={line.orderNumber} />
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Destination
          </p>
          {line.destinationCompanyUuid && line.destinationName ? (
            <Link
              href={`/companies/${line.destinationCompanyUuid}`}
              className="text-sm text-primary hover:underline"
            >
              {line.destinationName}
            </Link>
          ) : (
            <p className="text-sm">—</p>
          )}
        </div>
        <DetailField label="Postal code" value={line.postalCode} />
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Product
          </p>
          {line.productUuid ? (
            <Link
              href={`/products/${line.productUuid}`}
              className="text-sm text-primary hover:underline"
            >
              {[line.productCode ?? line.catalogProductCode, line.productName]
                .filter(Boolean)
                .join(" — ")}
            </Link>
          ) : (
            <p className="text-sm">{line.productCode ?? "—"}</p>
          )}
        </div>
        <DetailField label="Priority" value={line.priority} />
        <DetailField label="Created" value={formatDateValue(line.createdAt)} />
        <DetailField
          label="Last modified"
          value={formatDateValue(line.updatedAt)}
        />
      </div>
    </section>

    <section className="space-y-4">
      <h2 className="border-b pb-2 text-base font-semibold">Load</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <DetailField label="Length (mm)" value={line.lengthMm} />
        <DetailField label="Width (mm)" value={line.widthMm} />
        <DetailField label="Thickness (mm)" value={line.thicknessMm} />
        <DetailField label="Quantity planned" value={line.qtyPlanned} />
        <DetailField label="Quantity actual" value={line.qtyActual} />
        <DetailField label="Quantity loaded" value={line.qtyLoaded} />
        <DetailField label="Kg planned" value={line.kgPlanned} />
        <DetailField label="Kg actual" value={line.kgActual} />
        <DetailField label="Colli" value={line.colli} />
        <DetailField label="From location" value={line.fromLocation} />
        <DetailField label="To location" value={line.toLocation} />
      </div>
    </section>
  </div>
);
