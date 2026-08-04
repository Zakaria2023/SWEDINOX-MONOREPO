import Link from "next/link";
import { OptionPriceRow } from "@/app/(dashboard)/option-prices-per-product/actions";
import { DetailField } from "@/components/ui/detail-field";
import {
  formatDateColumn,
  formatDateValue,
  formatMoney,
  yesNo,
} from "@/lib/helpers";
import { SALES_UNIT_LABELS } from "@/lib/labels";

type Props = {
  optionPrice: OptionPriceRow;
};

export const OptionPriceDetailView = ({ optionPrice }: Props) => (
  <div className="space-y-6">
    <section className="space-y-4">
      <h2 className="border-b pb-2 text-base font-semibold">Option</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <DetailField label="Option code" value={optionPrice.optionCode} />
        <DetailField label="Option name" value={optionPrice.optionName} />
      </div>
    </section>

    <section className="space-y-4">
      <h2 className="border-b pb-2 text-base font-semibold">Product</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Product
          </p>
          <Link
            href={`/products/${optionPrice.productUuid}`}
            className="text-sm text-primary hover:underline"
          >
            {[optionPrice.productCode, optionPrice.productName]
              .filter(Boolean)
              .join(" — ") || optionPrice.productUuid}
          </Link>
        </div>
        <DetailField
          label="Old product code"
          value={optionPrice.oldProductCode}
        />
        <DetailField label="Main group" value={optionPrice.mainGroup} />
        <DetailField label="Sub group" value={optionPrice.subGroup} />
        <DetailField
          label="Group product"
          value={yesNo(optionPrice.groupProduct)}
        />
        <DetailField
          label="Stock product"
          value={yesNo(optionPrice.stockProduct)}
        />
        <DetailField
          label="Standard product"
          value={yesNo(optionPrice.standardProduct)}
        />
        <DetailField
          label="Preferred supplier"
          value={optionPrice.preferredSupplier}
        />
        <DetailField
          label="Supplier product code"
          value={optionPrice.supplierProductCode}
        />
      </div>
    </section>

    <section className="space-y-4">
      <h2 className="border-b pb-2 text-base font-semibold">Price</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <DetailField
          label="Base price"
          value={
            optionPrice.basePrice === null
              ? null
              : formatMoney(Number(optionPrice.basePrice))
          }
        />
        <DetailField
          label="Cost price"
          value={
            optionPrice.costPrice === null
              ? null
              : formatMoney(Number(optionPrice.costPrice))
          }
        />
        <DetailField
          label="Price unit"
          value={
            optionPrice.priceUnit
              ? SALES_UNIT_LABELS[optionPrice.priceUnit]
              : null
          }
        />
        <DetailField
          label="Valid from"
          value={formatDateColumn(optionPrice.validFrom)}
        />
        <DetailField
          label="Valid until"
          value={formatDateColumn(optionPrice.validUntil)}
        />
        <DetailField
          label="Created"
          value={formatDateValue(optionPrice.createdAt)}
        />
        <DetailField
          label="Last modified"
          value={formatDateValue(optionPrice.updatedAt)}
        />
      </div>
    </section>
  </div>
);
