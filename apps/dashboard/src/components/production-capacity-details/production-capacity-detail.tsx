import { ProductionCapacityDetailListItem } from "@/app/(dashboard)/production-capacity-details/actions";
import { DetailField } from "@/components/ui/detail-field";
import { OrderLineContext } from "@/components/ui/order-line-context";
import { formatDateColumn, formatDateValue, yesNo } from "@/lib/helpers";
import { DELIVERY_STATUS_LABELS } from "@/lib/labels";

type Props = {
  detail: ProductionCapacityDetailListItem;
};

export const ProductionCapacityDetailView = ({ detail }: Props) => (
  <div className="space-y-6">
    <OrderLineContext line={detail} />

    <section className="space-y-4">
      <h2 className="border-b pb-2 text-base font-semibold">
        Material and delivery
      </h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <DetailField label="Quality" value={detail.quality} />
        <DetailField label="Category" value={detail.category} />
        <DetailField
          label="Fixed dimension"
          value={yesNo(detail.fixedDimension)}
        />
        <DetailField
          label="Delivery status"
          value={
            detail.deliveryStatus
              ? DELIVERY_STATUS_LABELS[detail.deliveryStatus]
              : null
          }
        />
        <DetailField label="Option quantity" value={detail.optionQty} />
      </div>
    </section>

    <section className="space-y-4">
      <h2 className="border-b pb-2 text-base font-semibold">Planning</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <DetailField
          label="Production starting date"
          value={formatDateColumn(detail.productionStartingDate)}
        />
        <DetailField
          label="Planned delivery date"
          value={formatDateColumn(detail.plannedDeliveryDate)}
        />
        <DetailField
          label="Transport date"
          value={formatDateColumn(detail.transportDate)}
        />
      </div>
    </section>

    <section className="space-y-4">
      <h2 className="border-b pb-2 text-base font-semibold">Sawing plan</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <DetailField label="Sawing speed" value={detail.sawingSpeed} />
        <DetailField label="To saw" value={detail.toSaw} />
        <DetailField
          label="Sawing work order"
          value={detail.sawingWorkOrder}
        />
        <DetailField
          label="Sawing work order line"
          value={detail.sawingWorkOrderLine}
        />
        <DetailField label="Sawing method" value={detail.sawingMethod} />
        <DetailField label="Sawing type" value={detail.sawingType} />
        <DetailField label="Left saw angle" value={detail.leftSawAngle} />
        <DetailField label="Right saw angle" value={detail.rightSawAngle} />
        <DetailField label="Sawing angles" value={detail.sawingAngles} />
        <DetailField label="Standing" value={yesNo(detail.standing)} />
        <DetailField label="Bundles" value={detail.bundles} />
        <DetailField
          label="Bundles plus remainder"
          value={detail.bundlesPlusRemainder}
        />
        <DetailField label="Sawing required" value={yesNo(detail.sawing)} />
        <DetailField label="Drilling required" value={yesNo(detail.drilling)} />
        <DetailField label="Drill holes" value={detail.drillingHoles} />
      </div>
    </section>

    <section className="space-y-4">
      <h2 className="border-b pb-2 text-base font-semibold">Record</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <DetailField label="Created" value={formatDateValue(detail.createdAt)} />
        <DetailField
          label="Last modified"
          value={formatDateValue(detail.updatedAt)}
        />
      </div>
    </section>
  </div>
);
