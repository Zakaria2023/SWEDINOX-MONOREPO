import Link from "next/link";
import { ProductionWorkOrderLineDetail } from "@/app/(dashboard)/production-workorders/actions";
import { DetailField } from "@/components/ui/detail-field";
import { formatDateColumn, formatDateValue, yesNo } from "@/lib/helpers";
import {
  MACHINE_OPTION_LABELS,
  WAREHOUSE_WORK_ORDER_STATUS_LABELS,
} from "@/lib/labels";

type Props = {
  line: ProductionWorkOrderLineDetail;
};

export const ProductionWorkOrderLineDetailView = ({ line }: Props) => (
  <div className="space-y-6">
    <section className="space-y-4">
      <h2 className="border-b pb-2 text-base font-semibold">Work order</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <DetailField
          label="Work order"
          value={line.workOrderId === null ? null : `#${line.workOrderId}`}
        />
        <DetailField
          label="Work order date"
          value={formatDateColumn(line.workOrderDate)}
        />
        <DetailField
          label="Work order status"
          value={
            line.workOrderStatus
              ? WAREHOUSE_WORK_ORDER_STATUS_LABELS[line.workOrderStatus]
              : null
          }
        />
        <DetailField
          label="Processing option"
          value={line.option ? MACHINE_OPTION_LABELS[line.option] : null}
        />
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Machine
          </p>
          {line.machineUuid && line.machineName ? (
            <Link
              href={`/machines/${line.machineUuid}`}
              className="text-sm text-primary hover:underline"
            >
              {[line.machineCode, line.machineName]
                .filter(Boolean)
                .join(" — ")}
            </Link>
          ) : (
            <p className="text-sm">—</p>
          )}
        </div>
      </div>
    </section>

    <section className="space-y-4">
      <h2 className="border-b pb-2 text-base font-semibold">Line</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <DetailField label="Date" value={formatDateColumn(line.date)} />
        <DetailField
          label="Line status"
          value={WAREHOUSE_WORK_ORDER_STATUS_LABELS[line.status]}
        />
        <DetailField label="Order number" value={line.orderNumber} />
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
        <DetailField label="Extra options" value={line.extraOptions} />
        <DetailField label="Charge" value={line.charge} />
        <DetailField label="Priority" value={line.priority} />
        <DetailField label="Rush" value={yesNo(line.rush)} />
        <DetailField label="Pickup" value={yesNo(line.isPickup)} />
        <DetailField
          label="Deliver on"
          value={formatDateColumn(line.deliverOn)}
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
        Quantities and movement
      </h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <DetailField label="Thickness (mm)" value={line.thicknessMm} />
        <DetailField
          label="Quantity planned"
          value={`${line.qtyPlanned ?? "—"} ${line.unitPlanned ?? ""}`.trim()}
        />
        <DetailField
          label="Quantity actual"
          value={`${line.qtyActual ?? "—"} ${line.unitActual ?? ""}`.trim()}
        />
        <DetailField label="Quantity back" value={line.qtyBack} />
        <DetailField label="Kg planned" value={line.kgPlanned} />
        <DetailField label="Kg actual" value={line.kgActual} />
        <DetailField label="From location" value={line.fromLocation} />
        <DetailField label="To location" value={line.toLocation} />
      </div>
    </section>
  </div>
);
