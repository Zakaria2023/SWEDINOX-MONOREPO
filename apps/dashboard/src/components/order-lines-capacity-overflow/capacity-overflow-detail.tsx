import Link from "next/link";
import { CapacityOverflowRow } from "@/app/(dashboard)/order-lines-capacity-overflow/actions";
import { DetailField } from "@/components/ui/detail-field";
import {
  formatDateColumn,
  formatDateValue,
  orDash,
  yesNo,
} from "@/lib/helpers";
import { ORDER_ITEM_STATUS_LABELS, STOCK_UNIT_LABELS } from "@/lib/labels";

type Props = {
  overflow: CapacityOverflowRow;
};

export const CapacityOverflowDetailView = ({ overflow }: Props) => (
  <div className="space-y-6">
    <section className="space-y-4">
      <h2 className="border-b pb-2 text-base font-semibold">
        Decision recorded
      </h2>
      <p className="text-sm text-muted-foreground">
        That the capacity is over is a calculation; who moved which line, and
        when, is what this record holds.
      </p>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <DetailField label="Action" value={overflow.action} />
        <DetailField label="Action by" value={overflow.actionByUserId} />
        <DetailField
          label="Action on"
          value={formatDateColumn(overflow.actionOn)}
        />
        <DetailField
          label="Accountability"
          value={overflow.accountability}
        />
        <DetailField
          label="Created"
          value={formatDateValue(overflow.createdAt)}
        />
        <DetailField
          label="Last modified"
          value={formatDateValue(overflow.updatedAt)}
        />
      </div>
    </section>

    <section className="space-y-4">
      <h2 className="border-b pb-2 text-base font-semibold">
        Capacity check broken
      </h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Capacity check
          </p>
          {overflow.capacityCheckUuid ? (
            <Link
              href={`/capacity-checks/${overflow.capacityCheckUuid}`}
              className="text-sm text-primary hover:underline"
            >
              {overflow.capacityName ?? "View check"}
            </Link>
          ) : (
            <p className="text-sm">—</p>
          )}
        </div>
        <DetailField
          label="Capacity date"
          value={formatDateColumn(overflow.capacityDate)}
        />
      </div>
    </section>

    <section className="space-y-4">
      <h2 className="border-b pb-2 text-base font-semibold">Order line</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Order
          </p>
          {overflow.orderUuid && overflow.orderId !== null ? (
            <Link
              href={`/orders/${overflow.orderUuid}`}
              className="text-sm text-primary hover:underline"
            >
              #{overflow.orderId}
            </Link>
          ) : (
            <p className="text-sm">—</p>
          )}
        </div>
        <DetailField label="Order type" value={overflow.orderType} />
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Order line
          </p>
          <Link
            href={`/order-lines/${overflow.orderItemUuid}`}
            className="text-sm text-primary hover:underline"
          >
            {overflow.lineNumber === null
              ? "View line"
              : `Line ${overflow.lineNumber}`}
          </Link>
        </div>
        <DetailField label="Customer" value={overflow.companyName} />
        <DetailField
          label="Product"
          value={
            [overflow.productCode, overflow.productName]
              .filter(Boolean)
              .join(" — ") || null
          }
        />
        <DetailField
          label="Line status"
          value={
            overflow.lineStatus
              ? ORDER_ITEM_STATUS_LABELS[overflow.lineStatus]
              : null
          }
        />
        <DetailField label="Line type" value={overflow.lineType} />
        <DetailField label="Length (mm)" value={overflow.lengthMm} />
        <DetailField label="Width (mm)" value={overflow.widthMm} />
        <DetailField label="Thickness (mm)" value={overflow.thicknessMm} />
        <DetailField
          label="Unit"
          value={overflow.unit ? STOCK_UNIT_LABELS[overflow.unit] : null}
        />
        <DetailField label="Quantity planned" value={overflow.qtyPlanned} />
        <DetailField label="Quantity actual" value={overflow.qtyActual} />
        <DetailField label="Kg planned" value={overflow.kgPlanned} />
        <DetailField label="Kg actual" value={overflow.kgActual} />
        <DetailField
          label="Line delivery date"
          value={formatDateColumn(overflow.orderLineDeliveryDate)}
        />
        <DetailField label="Pickup" value={yesNo(overflow.isPickup)} />
      </div>
    </section>

    <section className="space-y-4">
      <h2 className="border-b pb-2 text-base font-semibold">
        Sawing and nesting plan
      </h2>
      <p className="text-sm text-muted-foreground">
        Empty when the line is neither cut nor nested.
      </p>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <DetailField label="Quality" value={overflow.quality} />
        <DetailField label="Category" value={overflow.category} />
        <DetailField
          label="Sawing spec required"
          value={yesNo(overflow.sawingSpec)}
        />
        <DetailField
          label="Fixed dimension"
          value={yesNo(overflow.fixedDimension)}
        />
        <DetailField label="To saw" value={overflow.toSaw} />
        <DetailField
          label="Sawing work order"
          value={overflow.sawingWorkOrder}
        />
        <DetailField
          label="Sawing work order line"
          value={overflow.sawingWorkOrderLine}
        />
        <DetailField label="Sawing machine" value={overflow.sawingMachine} />
        <DetailField label="Sawing type" value={overflow.sawingType} />
        <DetailField label="Sawing angles" value={overflow.sawingAngles} />
        <DetailField label="Left saw angle" value={overflow.leftSawAngle} />
        <DetailField label="Right saw angle" value={overflow.rightSawAngle} />
        <DetailField label="Drill holes" value={overflow.drillingHoles} />
        <DetailField label="Bundles" value={overflow.bundles} />
        <DetailField label="Standing" value={yesNo(overflow.standing)} />
        <DetailField label="Option quantity" value={overflow.optionQty} />
      </div>
    </section>

    <section className="space-y-4">
      <h2 className="border-b pb-2 text-base font-semibold">
        Production and delivery plan
      </h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <DetailField
          label="Production starting date"
          value={formatDateColumn(overflow.productionStartingDate)}
        />
        <DetailField
          label="Planned delivered quantity"
          value={overflow.plannedDeliveredQty}
        />
        <DetailField
          label="Delivered quantity"
          value={overflow.deliveredQty}
        />
        <DetailField label="Delivery unit" value={overflow.deliveryUnit} />
        <DetailField
          label="Delivery date planned"
          value={formatDateColumn(overflow.deliveryDatePlanned)}
        />
        <DetailField
          label="Delivery date actual"
          value={formatDateColumn(overflow.deliveryDateActual)}
        />
        <DetailField
          label="Delivery status"
          value={overflow.deliveryStatus}
        />
        <DetailField
          label="Transport date"
          value={orDash(overflow.transportDate)}
        />
      </div>
    </section>
  </div>
);
