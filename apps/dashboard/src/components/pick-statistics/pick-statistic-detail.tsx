import Link from "next/link";
import { PickStatisticListItem } from "@/app/(dashboard)/pick-statistics/actions";
import { DetailField } from "@/components/ui/detail-field";
import {
  formatDateValue,
  formatFixed2,
  formatNumber,
  yesNo,
} from "@/lib/helpers";
import { STOCK_UNIT_LABELS } from "@/lib/labels";

type Props = {
  statistic: PickStatisticListItem;
};

export const PickStatisticDetailView = ({ statistic }: Props) => (
  <div className="space-y-6">
    <section className="space-y-4">
      <h2 className="border-b pb-2 text-base font-semibold">Period</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <DetailField label="Year" value={statistic.year} />
        <DetailField label="Month" value={statistic.month} />
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Product
          </p>
          {statistic.productCode ? (
            <Link
              href={`/products/${statistic.productUuid}`}
              className="text-sm text-primary hover:underline"
            >
              {[statistic.productCode, statistic.productName]
                .filter(Boolean)
                .join(" — ")}
            </Link>
          ) : (
            <p className="text-sm">—</p>
          )}
        </div>
        <DetailField
          label="Stock product"
          value={yesNo(statistic.stockProduct)}
        />
        <DetailField
          label="Created"
          value={formatDateValue(statistic.createdAt)}
        />
        <DetailField
          label="Last modified"
          value={formatDateValue(statistic.updatedAt)}
        />
      </div>
    </section>

    <section className="space-y-4">
      <h2 className="border-b pb-2 text-base font-semibold">Picks</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <DetailField label="Picks" value={formatNumber(statistic.picks)} />
        <DetailField
          label="Quantity picked"
          value={`${statistic.quantityPicked} ${
            statistic.unit ? STOCK_UNIT_LABELS[statistic.unit] : ""
          }`.trim()}
        />
        <DetailField label="Kg picked" value={statistic.kgPicked} />
        <DetailField
          label="Average quantity per pick"
          value={formatFixed2(statistic.avgQtyPerPick)}
        />
        <DetailField
          label="Average kg per pick"
          value={formatFixed2(statistic.avgKgPerPick)}
        />
      </div>
    </section>
  </div>
);
