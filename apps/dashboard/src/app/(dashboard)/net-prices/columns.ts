import { NetPriceRow } from "@/app/(dashboard)/net-prices/actions";
import {
  dateCell,
  ExportColumn,
  numberCell,
  textCell,
  yesNoCell,
} from "@/lib/excel";

/**
 * The net prices overview as a sheet — see app/(dashboard)/orders/columns.ts.
 */

export type NetPriceColumnKey =
  | "contractCode"
  | "contractDescription"
  | "companyCode"
  | "companyName"
  | "productCode"
  | "oldProductCode"
  | "productName"
  | "groupProduct"
  | "stockProduct"
  | "standardProduct"
  | "mainGroup"
  | "subGroup"
  | "preferredSupplier"
  | "supplierProductCode"
  | "basePrice"
  | "discountPercent"
  | "netPrice"
  | "netPriceUnit"
  | "validFrom"
  | "validUntil"
  | "fromQty"
  | "fromQtyUnit";

export const NET_PRICE_COLUMNS: Array<
  ExportColumn<NetPriceRow, NetPriceColumnKey>
> = [
  {
    key: "contractCode",
    label: "Contract code",
    defaultVisible: true,
    value: (row) => textCell(row.contractCode),
  },
  {
    key: "contractDescription",
    label: "Contract",
    defaultVisible: true,
    value: (row) => textCell(row.contractDescription),
  },
  {
    key: "companyCode",
    label: "Company code",
    defaultVisible: true,
    value: (row) => numberCell(row.companyCode),
  },
  {
    key: "companyName",
    label: "Company",
    defaultVisible: true,
    value: (row) => textCell(row.companyName),
  },
  {
    key: "productCode",
    label: "Product code",
    defaultVisible: true,
    value: (row) => textCell(row.productCode),
  },
  {
    key: "oldProductCode",
    label: "Product no. (old)",
    defaultVisible: true,
    value: (row) => textCell(row.oldProductCode),
  },
  {
    key: "productName",
    label: "Product",
    defaultVisible: true,
    value: (row) => textCell(row.productName),
  },
  {
    key: "groupProduct",
    label: "Group product",
    defaultVisible: true,
    value: (row) => yesNoCell(row.groupProduct),
  },
  {
    key: "stockProduct",
    label: "Stock product",
    defaultVisible: true,
    value: (row) => yesNoCell(row.stockProduct),
  },
  {
    key: "standardProduct",
    label: "Standard product",
    defaultVisible: true,
    value: (row) => yesNoCell(row.standardProduct),
  },
  {
    key: "mainGroup",
    label: "Main group",
    defaultVisible: true,
    value: (row) => textCell(row.mainGroup),
  },
  {
    key: "subGroup",
    label: "Subgroup",
    defaultVisible: true,
    value: (row) => textCell(row.subGroup),
  },
  {
    key: "preferredSupplier",
    label: "Preferred supplier",
    defaultVisible: true,
    value: (row) => textCell(row.preferredSupplier),
  },
  {
    key: "supplierProductCode",
    label: "Suppliers product no.",
    defaultVisible: true,
    value: (row) => textCell(row.supplierProductCode),
  },
  {
    key: "basePrice",
    label: "Base price",
    defaultVisible: false,
    value: (row) => numberCell(row.basePrice),
  },
  {
    key: "discountPercent",
    label: "Discount %",
    defaultVisible: false,
    value: (row) => numberCell(row.discountPercent),
  },
  {
    key: "netPrice",
    label: "Net price",
    defaultVisible: true,
    value: (row) => numberCell(row.netPrice),
  },
  {
    key: "netPriceUnit",
    label: "Net priceU",
    defaultVisible: true,
    value: (row) => textCell(row.netPriceUnit),
  },
  {
    key: "validFrom",
    label: "Valid from",
    defaultVisible: true,
    value: (row) => dateCell(row.validFrom),
  },
  {
    key: "validUntil",
    label: "Valid u/i",
    defaultVisible: true,
    value: (row) => dateCell(row.validUntil),
  },
  {
    key: "fromQty",
    label: "FromQty",
    defaultVisible: true,
    value: (row) => numberCell(row.fromQty),
  },
  {
    key: "fromQtyUnit",
    label: "FromQtyU",
    defaultVisible: true,
    value: (row) => textCell(row.fromQtyUnit),
  },
];
