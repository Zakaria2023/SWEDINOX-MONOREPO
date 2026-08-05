import { ReoptimizeListItem } from "@/app/(dashboard)/reoptimize/actions";
import { DetailField } from "@/components/ui/detail-field";
import { OrderLineContext } from "@/components/ui/order-line-context";
import {
  formatDateColumn,
  formatDateValue,
  orDash,
  yesNo,
} from "@/lib/helpers";

type Props = {
  row: ReoptimizeListItem;
};

export const ReoptimizeDetailView = ({ row }: Props) => (
  <div className="space-y-6">
    <OrderLineContext line={row} />

    <section className="space-y-4">
      <h2 className="border-b pb-2 text-base font-semibold">Material</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <DetailField label="Quality" value={row.quality} />
        <DetailField label="Category" value={row.category} />
        <DetailField
          label="Sawing spec required"
          value={yesNo(row.sawingSpec)}
        />
        <DetailField
          label="Fixed dimension"
          value={yesNo(row.fixedDimension)}
        />
        <DetailField label="Option quantity" value={row.optionQty} />
      </div>
    </section>

    <section className="space-y-4">
      <h2 className="border-b pb-2 text-base font-semibold">Sawing plan</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <DetailField label="To saw" value={row.toSaw} />
        <DetailField
          label="Sawing work order status"
          value={row.sawingWorkOrderStatus}
        />
        <DetailField label="Sawing work order" value={row.sawingWorkOrder} />
        <DetailField
          label="Sawing work order line"
          value={row.sawingWorkOrderLine}
        />
        <DetailField label="Sawing type" value={row.sawingType} />
        <DetailField label="Sawing angles" value={row.sawingAngles} />
        <DetailField label="Left saw angle" value={row.leftSawAngle} />
        <DetailField label="Right saw angle" value={row.rightSawAngle} />
        <DetailField label="Bundles" value={row.bundles} />
        <DetailField
          label="Bundles plus remainder"
          value={row.bundlesPlusRemainder}
        />
        <DetailField label="Standing" value={yesNo(row.standing)} />
        <DetailField label="Sawing required" value={yesNo(row.sawing)} />
        <DetailField label="Drilling required" value={yesNo(row.drilling)} />
        <DetailField label="Drill holes" value={row.drillingHoles} />
      </div>
    </section>

    <section className="space-y-4">
      <h2 className="border-b pb-2 text-base font-semibold">
        Production and delivery planning
      </h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <DetailField
          label="Production starting date"
          value={formatDateColumn(row.productionStartingDate)}
        />
        <DetailField
          label="Planned delivered quantity"
          value={row.plannedDeliveredQty}
        />
        <DetailField label="Delivered quantity" value={row.deliveredQty} />
        <DetailField label="Delivery unit" value={row.deliveryUnit} />
        <DetailField
          label="Delivery date planned"
          value={formatDateColumn(row.deliveryDatePlanned)}
        />
        <DetailField
          label="Delivery date actual"
          value={formatDateColumn(row.deliveryDateActual)}
        />
        <DetailField label="Delivery status" value={row.deliveryStatus} />
        <DetailField
          label="Transport date"
          value={orDash(row.transportDate)}
        />
      </div>
    </section>

    <section className="space-y-4">
      <h2 className="border-b pb-2 text-base font-semibold">
        Fetching the raw material
      </h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <DetailField
          label="Fetch date"
          value={formatDateColumn(row.fetchDate)}
        />
        <DetailField label="Fetch code" value={row.fetchCode} />
        <DetailField label="Fetch line" value={row.fetchLine} />
        <DetailField label="Fetch status" value={row.fetchStatus} />
        <DetailField label="Fetch quantity" value={row.fetchQty} />
        <DetailField label="Fetch product" value={row.fetchProduct} />
        <DetailField label="Fetch description" value={row.fetchDescription} />
        <DetailField label="Fetch length" value={row.fetchLength} />
        <DetailField label="Residual length" value={row.residualLength} />
      </div>
    </section>

    <section className="space-y-4">
      <h2 className="border-b pb-2 text-base font-semibold">Record</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <DetailField label="Created" value={formatDateValue(row.createdAt)} />
        <DetailField
          label="Last modified"
          value={formatDateValue(row.updatedAt)}
        />
      </div>
    </section>
  </div>
);
