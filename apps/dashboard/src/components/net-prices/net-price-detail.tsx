import Link from "next/link";
import { NetPriceRow } from "@/app/(dashboard)/net-prices/actions";
import { NetPriceActions } from "@/components/net-prices/net-price-actions";
import { DetailField } from "@/components/ui/detail-field";
import {
  formatDateColumn,
  formatDateValue,
  formatMoney,
  formatPercent,
  yesNo,
} from "@/lib/helpers";

type Props = {
  netPrice: NetPriceRow;
};

export const NetPriceDetailView = ({ netPrice }: Props) => (
  <div className="space-y-6">
    <section className="space-y-4">
      <h2 className="border-b pb-2 text-base font-semibold">Contract</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Contract
          </p>
          <Link
            href={`/contracts/${netPrice.contractUuid}`}
            className="text-sm text-primary hover:underline"
          >
            {netPrice.contractCode ?? "View contract"}
          </Link>
        </div>
        <DetailField
          label="Contract description"
          value={netPrice.contractDescription}
        />
        <DetailField label="Company" value={netPrice.companyName} />
        <DetailField label="Company code" value={netPrice.companyCode} />
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
            href={`/products/${netPrice.productUuid}`}
            className="text-sm text-primary hover:underline"
          >
            {[netPrice.productCode, netPrice.productName]
              .filter(Boolean)
              .join(" — ") || netPrice.productUuid}
          </Link>
        </div>
        <DetailField
          label="Old product code"
          value={netPrice.oldProductCode}
        />
        <DetailField label="Main group" value={netPrice.mainGroup} />
        <DetailField label="Sub group" value={netPrice.subGroup} />
        <DetailField
          label="Group product"
          value={yesNo(netPrice.groupProduct)}
        />
        <DetailField
          label="Stock product"
          value={yesNo(netPrice.stockProduct)}
        />
        <DetailField
          label="Standard product"
          value={yesNo(netPrice.standardProduct)}
        />
        <DetailField
          label="Base price"
          value={
            netPrice.basePrice === null
              ? null
              : formatMoney(Number(netPrice.basePrice))
          }
        />
        <DetailField
          label="Preferred supplier"
          value={netPrice.preferredSupplier}
        />
        <DetailField
          label="Supplier product code"
          value={netPrice.supplierProductCode}
        />
      </div>
    </section>

    <section className="space-y-4">
      <h2 className="border-b pb-2 text-base font-semibold">Agreed price</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <DetailField label="From quantity" value={netPrice.fromQty} />
        <DetailField
          label="Net price"
          value={
            netPrice.netPrice === null
              ? null
              : formatMoney(Number(netPrice.netPrice))
          }
        />
        <DetailField label="Price unit" value={netPrice.netPriceUnit} />
        <DetailField
          label="Discount"
          value={
            netPrice.discountPercent === null
              ? null
              : formatPercent(Number(netPrice.discountPercent))
          }
        />
        <DetailField
          label="Valid from"
          value={formatDateColumn(netPrice.validFrom)}
        />
        <DetailField
          label="Valid u/i"
          value={formatDateColumn(netPrice.validUntil)}
        />
        <DetailField
          label="Created"
          value={formatDateValue(netPrice.createdAt)}
        />
        <DetailField
          label="Last modified"
          value={formatDateValue(netPrice.updatedAt)}
        />
      </div>
    </section>

    <NetPriceActions netPriceUuid={netPrice.uuid} />
  </div>
);
