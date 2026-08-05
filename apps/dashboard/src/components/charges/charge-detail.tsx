import Link from "next/link";
import { ChargeDetail } from "@/app/(dashboard)/charges/actions";
import { DetailField } from "@/components/ui/detail-field";
import {
  formatDateColumn,
  formatDateValue,
  formatMoney,
} from "@/lib/helpers";

type Props = {
  charge: ChargeDetail;
};

export const ChargeDetailView = ({ charge }: Props) => (
  <div className="space-y-6">
    <section className="space-y-4">
      <h2 className="border-b pb-2 text-base font-semibold">Charge</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <DetailField label="Code" value={charge.code} />
        <DetailField label="Surcharge" value={charge.surcharge} />
        <DetailField label="Status" value={charge.status} />
        <DetailField label="Order type" value={charge.orderType} />
        <DetailField label="Contract" value={charge.contract} />
        <DetailField
          label="Creation date"
          value={formatDateColumn(charge.creationDate)}
        />
        <DetailField
          label="Delivery date"
          value={formatDateColumn(charge.deliveryDate)}
        />
        <DetailField
          label="Created"
          value={formatDateValue(charge.createdAt)}
        />
        <DetailField
          label="Last modified"
          value={formatDateValue(charge.updatedAt)}
        />
      </div>
    </section>

    <section className="space-y-4">
      <h2 className="border-b pb-2 text-base font-semibold">Booked against</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Customer
          </p>
          {charge.companyUuid && charge.customerName ? (
            <Link
              href={`/companies/${charge.companyUuid}`}
              className="text-sm text-primary hover:underline"
            >
              {charge.customerName}
            </Link>
          ) : (
            <p className="text-sm">—</p>
          )}
        </div>
        <DetailField label="Debtor number" value={charge.debtorNo} />
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Order
          </p>
          {charge.orderUuid && charge.orderId !== null ? (
            <Link
              href={`/orders/${charge.orderUuid}`}
              className="text-sm text-primary hover:underline"
            >
              #{charge.orderId}
            </Link>
          ) : (
            <p className="text-sm">—</p>
          )}
        </div>
        <DetailField
          label="Revenue group"
          value={
            [charge.revenueGroupNumber, charge.revenueGroupName]
              .filter(Boolean)
              .join(" — ") || null
          }
        />
        <DetailField label="Region" value={charge.region} />
        <DetailField label="Country" value={charge.country} />
        <DetailField label="VAT number" value={charge.vatNumber} />
      </div>
    </section>

    <section className="space-y-4">
      <h2 className="border-b pb-2 text-base font-semibold">Money</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <DetailField
          label="Amount"
          value={formatMoney(Number(charge.amount))}
        />
        <DetailField label="Cost" value={formatMoney(Number(charge.cost))} />
        <DetailField
          label="Profit"
          value={formatMoney(Number(charge.profit))}
        />
        <DetailField label="Weight (kg)" value={charge.weightKg} />
      </div>

      <h3 className="text-sm font-medium text-muted-foreground">
        Surcharge tier
      </h3>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <DetailField
          label="From"
          value={
            charge.priceFrom === null
              ? null
              : formatMoney(Number(charge.priceFrom))
          }
        />
        <DetailField
          label="To"
          value={
            charge.priceTo === null ? null : formatMoney(Number(charge.priceTo))
          }
        />
        <DetailField
          label="Price"
          value={
            charge.price === null ? null : formatMoney(Number(charge.price))
          }
        />
        <DetailField label="Unit" value={charge.unit} />
      </div>
    </section>
  </div>
);
