import { WarehouseCapacityDetail } from "@/app/(dashboard)/warehouse-capacity/actions";
import { DetailField } from "@/components/ui/detail-field";
import {
  formatDateColumn,
  formatDateValue,
  formatFixed2,
  formatPercent,
} from "@/lib/helpers";
import { WAREHOUSE_WORK_ORDER_TYPE_LABELS } from "@/lib/labels";

type Props = {
  capacity: WarehouseCapacityDetail;
};

export const WarehouseCapacityDetailView = ({ capacity }: Props) => (
  <div className="space-y-6">
    <section className="space-y-4">
      <h2 className="border-b pb-2 text-base font-semibold">Snapshot</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <DetailField
          label="Date"
          value={formatDateColumn(capacity.capacityDate)}
        />
        <DetailField
          label="Warehouse section"
          value={capacity.warehouseSection}
        />
        <DetailField label="Subsection" value={capacity.subsection} />
        <DetailField
          label="Workorder type"
          value={
            capacity.workOrderType
              ? WAREHOUSE_WORK_ORDER_TYPE_LABELS[capacity.workOrderType]
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
      <h2 className="border-b pb-2 text-base font-semibold">Capacity</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <DetailField
          label="Occupied"
          value={formatFixed2(Number(capacity.occupied))}
        />
        <DetailField
          label="Ready"
          value={formatFixed2(Number(capacity.ready))}
        />
        <DetailField
          label="Remaining"
          value={formatFixed2(Number(capacity.remaining))}
        />
        <DetailField
          label="Remaining (derived)"
          value={formatFixed2(capacity.derivedRemaining)}
        />
        <DetailField
          label="Ready share"
          value={
            capacity.readyPercent === null
              ? "Nothing booked"
              : formatPercent(capacity.readyPercent)
          }
        />
      </div>
    </section>
  </div>
);
