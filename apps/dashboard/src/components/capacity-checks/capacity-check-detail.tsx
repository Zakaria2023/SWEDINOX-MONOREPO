import { CapacityCheckDetail } from "@/app/(dashboard)/capacity-checks/actions";
import { DetailField } from "@/components/ui/detail-field";
import {
  formatDateColumn,
  formatDateValue,
  formatFixed2,
  formatPercent,
} from "@/lib/helpers";
import { PRODUCTION_CAPACITY_STATUS_LABELS } from "@/lib/labels";

type Props = {
  check: CapacityCheckDetail;
};

export const CapacityCheckDetailView = ({ check }: Props) => (
  <div className="space-y-6">
    <section className="space-y-4">
      <h2 className="border-b pb-2 text-base font-semibold">Check</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <DetailField label="Name" value={check.checkName} />
        <DetailField label="Type" value={check.type} />
        <DetailField
          label="Status"
          value={
            check.status
              ? PRODUCTION_CAPACITY_STATUS_LABELS[check.status]
              : null
          }
        />
        <DetailField label="Date" value={formatDateColumn(check.checkDate)} />
        <DetailField
          label="Alert email time"
          value={check.timeAlertEmail}
        />
        <DetailField
          label="Max warning time"
          value={check.timeMaxWarning}
        />
        <DetailField label="Created" value={formatDateValue(check.createdAt)} />
        <DetailField
          label="Last modified"
          value={formatDateValue(check.updatedAt)}
        />
      </div>
    </section>

    <section className="space-y-4">
      <h2 className="border-b pb-2 text-base font-semibold">Capacity</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <DetailField
          label="Occupied"
          value={
            check.occupiedCapacity === null
              ? null
              : formatFixed2(Number(check.occupiedCapacity))
          }
        />
        <DetailField
          label="Capacity for the day"
          value={
            check.capacity === null
              ? null
              : formatFixed2(Number(check.capacity))
          }
        />
        <DetailField
          label="Maximum capacity"
          value={
            check.maximumCapacity === null
              ? null
              : formatFixed2(Number(check.maximumCapacity))
          }
        />
        <DetailField
          label="Warning threshold"
          value={
            check.warningCapacity === null
              ? null
              : formatFixed2(Number(check.warningCapacity))
          }
        />
        <DetailField
          label="Occupied share of maximum"
          value={
            check.occupiedPercentOfMaximum === null
              ? "No maximum recorded"
              : formatPercent(check.occupiedPercentOfMaximum)
          }
        />
        <DetailField
          label="Headroom to maximum"
          value={
            check.headroom === null ? null : formatFixed2(check.headroom)
          }
        />
        <DetailField
          label="Past warning threshold"
          value={
            check.warningCapacity === null
              ? "No threshold set"
              : check.pastWarning
                ? "Yes"
                : "No"
          }
        />
      </div>
    </section>
  </div>
);
