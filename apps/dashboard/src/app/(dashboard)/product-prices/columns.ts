import { ProductPriceRow } from "@/app/(dashboard)/product-prices/actions";
import { ExportColumn, numberCell, textCell, yesNoCell } from "@/lib/excel";

/**
 * Product prices as a sheet — the seventeen columns the screen has always
 * shown, in the same order.
 *
 * `Last invoiced price` and `APP` are not the product's own: both are read back
 * from the supplier invoices, because that is where a purchase price is
 * actually recorded. Everything else is the article.
 */

export type ProductPriceColumnKey =
  | "productCode"
  | "oldProductCode"
  | "name"
  | "priceUnit"
  | "groupProduct"
  | "stockProduct"
  | "standardProduct"
  | "mainGroup"
  | "subGroup"
  | "preferredSupplier"
  | "supplierProductCode"
  | "replacementPrice"
  | "basePrice"
  | "markup"
  | "averagePurchasePrice"
  | "orderAdviceCode"
  | "fixedSalesPrice";

export const PRODUCT_PRICE_COLUMNS: Array<
  ExportColumn<ProductPriceRow, ProductPriceColumnKey>
> = [
  {
    key: "productCode",
    label: "Product code",
    defaultVisible: true,
    value: (row) => textCell(row.productCode),
  },
  {
    key: "oldProductCode",
    label: "Old product no.",
    defaultVisible: true,
    value: (row) => textCell(row.oldProductCode),
  },
  {
    key: "name",
    label: "Product",
    defaultVisible: true,
    value: (row) => textCell(row.name),
  },
  {
    key: "priceUnit",
    label: "PriceU",
    defaultVisible: true,
    value: (row) => textCell(row.priceUnit),
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
    label: "Product no. supplier",
    defaultVisible: true,
    value: (row) => textCell(row.supplierProductCode),
  },
  {
    key: "replacementPrice",
    label: "Last invoiced price",
    defaultVisible: true,
    value: (row) => numberCell(row.replacementPrice),
  },
  {
    key: "basePrice",
    label: "Base price",
    defaultVisible: true,
    value: (row) => numberCell(row.basePrice),
  },
  {
    key: "markup",
    label: "Markup",
    defaultVisible: true,
    value: (row) => numberCell(row.markup),
  },
  {
    key: "averagePurchasePrice",
    label: "APP",
    defaultVisible: true,
    value: (row) => numberCell(row.averagePurchasePrice),
  },
  {
    key: "orderAdviceCode",
    label: "Order advice code",
    defaultVisible: true,
    value: (row) => textCell(row.orderAdviceCode),
  },
  {
    key: "fixedSalesPrice",
    label: "FSP",
    defaultVisible: true,
    value: (row) => numberCell(row.fixedSalesPrice),
  },
];
