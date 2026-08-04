import { NestingListItem } from "@/app/(dashboard)/nesting/actions";
import { DetailField } from "@/components/ui/detail-field";
import { OrderLineContext } from "@/components/ui/order-line-context";
import {
  formatDateColumn,
  formatDateValue,
  orDash,
  yesNo,
} from "@/lib/helpers";

type Props = {
  nesting: NestingListItem;
};

export const NestingDetailView = ({ nesting }: Props) => (
  <div className="space-y-6">
    <OrderLineContext line={nesting} />

    <section className="space-y-4">
      <h2 className="border-b pb-2 text-base font-semibold">Material</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <DetailField label="Quality" value={nesting.quality} />
        <DetailField label="Category" value={nesting.category} />
        <DetailField
          label="Sawing spec required"
          value={yesNo(nesting.sawingSpec)}
        />
        <DetailField
          label="Fixed dimension"
          value={yesNo(nesting.fixedDimension)}
        />
        <DetailField label="Option quantity" value={nesting.optionQty} />
      </div>
    </section>

    <section className="space-y-4">
      <h2 className="border-b pb-2 text-base font-semibold">
        Nesting and sawing plan
      </h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <DetailField label="Nest" value={nesting.nest} />
        <DetailField label="Sawing machine" value={nesting.sawingMachine} />
        <DetailField
          label="Sawing work order"
          value={nesting.sawingWorkOrder}
        />
        <DetailField
          label="Sawing work order line"
          value={nesting.sawingWorkOrderLine}
        />
        <DetailField
          label="Sawing work order status"
          value={nesting.sawingWorkOrderStatus}
        />
        <DetailField label="To saw" value={nesting.toSaw} />
        <DetailField label="Sawing type" value={nesting.sawingType} />
        <DetailField label="Sawing angles" value={nesting.sawingAngles} />
        <DetailField label="Left saw angle" value={nesting.leftSawAngle} />
        <DetailField label="Right saw angle" value={nesting.rightSawAngle} />
        <DetailField label="Bundles" value={nesting.bundles} />
        <DetailField label="Standing" value={yesNo(nesting.standing)} />
        <DetailField label="Drill holes" value={nesting.drillingHoles} />
      </div>
    </section>

    <section className="space-y-4">
      <h2 className="border-b pb-2 text-base font-semibold">
        Production and delivery planning
      </h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <DetailField
          label="Production starting date"
          value={formatDateColumn(nesting.productionStartingDate)}
        />
        <DetailField
          label="Planned delivered quantity"
          value={nesting.plannedDeliveredQty}
        />
        <DetailField label="Delivered quantity" value={nesting.deliveredQty} />
        <DetailField label="Delivery unit" value={nesting.deliveryUnit} />
        <DetailField
          label="Delivery date planned"
          value={formatDateColumn(nesting.deliveryDatePlanned)}
        />
        <DetailField
          label="Delivery date actual"
          value={formatDateColumn(nesting.deliveryDateActual)}
        />
        <DetailField
          label="Delivery status"
          value={nesting.deliveryStatus}
        />
        <DetailField
          label="Transport date"
          value={orDash(nesting.transportDate)}
        />
      </div>
    </section>

    <section className="space-y-4">
      <h2 className="border-b pb-2 text-base font-semibold">
        Fetching the raw sheet
      </h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <DetailField
          label="Fetch date"
          value={formatDateColumn(nesting.fetchDate)}
        />
        <DetailField label="Fetch code" value={nesting.fetchCode} />
        <DetailField label="Fetch line" value={nesting.fetchLine} />
        <DetailField label="Fetch status" value={nesting.fetchStatus} />
        <DetailField label="Fetch quantity" value={nesting.fetchQty} />
        <DetailField label="Fetch product" value={nesting.fetchProduct} />
        <DetailField
          label="Fetch description"
          value={nesting.fetchDescription}
        />
        <DetailField label="Fetch length" value={nesting.fetchLength} />
        <DetailField
          label="Residual length"
          value={nesting.residualLength}
        />
      </div>
    </section>

    <section className="space-y-4">
      <h2 className="border-b pb-2 text-base font-semibold">Record</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <DetailField
          label="Created"
          value={formatDateValue(nesting.createdAt)}
        />
        <DetailField
          label="Last modified"
          value={formatDateValue(nesting.updatedAt)}
        />
      </div>
    </section>
  </div>
);
