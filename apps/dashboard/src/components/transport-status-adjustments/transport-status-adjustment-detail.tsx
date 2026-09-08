import Link from "next/link";
import { TransportStatusAdjustmentDetail } from "@/app/(dashboard)/transport-status-adjustments/actions";
import { DetailField } from "@/components/ui/detail-field";
import { formatDateValue, formatTimeValue } from "@/lib/helpers";
import { TRIP_STATUS_LABELS } from "@/lib/labels";

type Props = {
  adjustment: TransportStatusAdjustmentDetail;
};

export const TransportStatusAdjustmentDetailView = ({ adjustment }: Props) => (
  <div className="space-y-6">
    <section className="space-y-4">
      <h2 className="border-b pb-2 text-base font-semibold">
        Status change
      </h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <DetailField
          label="Trip status set to"
          value={
            adjustment.tripStatus
              ? TRIP_STATUS_LABELS[adjustment.tripStatus]
              : null
          }
        />
        <DetailField label="Modifier" value={adjustment.modifier} />
        <DetailField
          label="Date modified"
          value={formatDateValue(adjustment.timeModified)}
        />
        <DetailField
          label="Time modified"
          value={formatTimeValue(adjustment.timeModified)}
        />
        <DetailField
          label="Bill of lading"
          value={adjustment.billOfLading}
        />
        <DetailField
          label="Created"
          value={formatDateValue(adjustment.createdAt)}
        />
      </div>
    </section>

    <section className="space-y-4">
      <h2 className="border-b pb-2 text-base font-semibold">Applies to</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Order
          </p>
          {adjustment.orderUuid && adjustment.orderId !== null ? (
            <Link
              href={`/orders/${adjustment.orderUuid}`}
              className="text-sm text-primary hover:underline"
            >
              #{adjustment.orderId}
            </Link>
          ) : (
            <p className="text-sm">—</p>
          )}
        </div>
        <DetailField
          label="Order line"
          value={adjustment.orderLineNumber}
        />
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Customer
          </p>
          {adjustment.companyUuid && adjustment.companyName ? (
            <Link
              href={`/companies/${adjustment.companyUuid}`}
              className="text-sm text-primary hover:underline"
            >
              {adjustment.companyName}
            </Link>
          ) : (
            <p className="text-sm">—</p>
          )}
        </div>
        <DetailField
          label="Product"
          value={
            [adjustment.orderLineProductCode, adjustment.orderLineProductName]
              .filter(Boolean)
              .join(" — ") || null
          }
        />
      </div>
    </section>
  </div>
);
