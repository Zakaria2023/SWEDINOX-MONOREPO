import Link from "next/link";
import { ProductionCapacityDetail } from "@/app/(dashboard)/production-capacity/actions";
import { DetailField } from "@/components/ui/detail-field";
import {
  formatDateColumn,
  formatDateValue,
  formatPercent,
} from "@/lib/helpers";
import {
  MACHINE_PRODUCTION_LABELS,
  PRODUCTION_CAPACITY_STATUS_LABELS,
} from "@/lib/labels";

type Props = {
  capacity: ProductionCapacityDetail;
};

export const ProductionCapacityDetailView = ({ capacity }: Props) => (
  <div className="space-y-6">
    <section className="space-y-4">
      <h2 className="border-b pb-2 text-base font-semibold">Snapshot</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <DetailField
          label="Date"
          value={formatDateColumn(capacity.capacityDate)}
        />
        <DetailField
          label="Status"
          value={
            capacity.status
              ? PRODUCTION_CAPACITY_STATUS_LABELS[capacity.status]
              : null
          }
        />
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Machine
          </p>
          {capacity.machineName ? (
            <Link
              href={`/machines/${capacity.machineUuid}`}
              className="text-sm text-primary hover:underline"
            >
              {[capacity.machineCode, capacity.machineName]
                .filter(Boolean)
                .join(" — ")}
            </Link>
          ) : (
            <p className="text-sm">—</p>
          )}
        </div>
        <DetailField
          label="Type of machine"
          value={
            capacity.machineType
              ? MACHINE_PRODUCTION_LABELS[capacity.machineType]
              : null
          }
        />
        <DetailField
          label="Created"
          value={formatDateValue(capacity.createdAt)}
        />
        <DetailField
          label="Last modified"
          value={formatDateValue(capacity.updatedAt)}
        />
      </div>
    </section>

    <section className="space-y-4">
      <h2 className="border-b pb-2 text-base font-semibold">Thresholds</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <DetailField
          label="Capacity for the day"
          value={capacity.capacity}
        />
        <DetailField
          label="Maximum capacity"
          value={capacity.maximumCapacity}
        />
        <DetailField
          label="Warning capacity"
          value={capacity.warningCapacity}
        />
        <DetailField
          label="Occupied share of maximum"
          value={
            capacity.occupiedPercentOfMaximum === null
              ? "No maximum recorded"
              : formatPercent(capacity.occupiedPercentOfMaximum)
          }
        />
        <DetailField
          label="Past warning threshold"
          value={
            capacity.warningCapacity === null
              ? "No threshold set"
              : capacity.pastWarning
                ? "Yes"
                : "No"
          }
        />
      </div>
    </section>

    <section className="space-y-4">
      <h2 className="border-b pb-2 text-base font-semibold">Square measures</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <DetailField label="Occupied" value={capacity.occupiedCapacity} />
        <DetailField label="Ready" value={capacity.ready} />
        <DetailField label="Remaining" value={capacity.remaining} />
      </div>
    </section>

    <section className="space-y-4">
      <h2 className="border-b pb-2 text-base font-semibold">
        Not-square measures
      </h2>
      <p className="text-sm text-muted-foreground">
        Linear and piece work. These are not comparable to the maximum above,
        which is a square measure.
      </p>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <DetailField label="Occupied" value={capacity.occupiedNotSquare} />
        <DetailField label="Ready" value={capacity.readyNotSquare} />
        <DetailField label="Remaining" value={capacity.remainingNotSquare} />
      </div>
    </section>
  </div>
);
