import { ProductOption } from "@/app/(dashboard)/products/actions";
import { stockMovementReasons, stockMovementTypes } from "@/lib/enums";
import {
  STOCK_MOVEMENT_REASON_LABELS,
  STOCK_MOVEMENT_TYPE_LABELS,
} from "@/lib/labels";
import { TableFilterControl } from "@/lib/table-query";

export const stockMovementFilters = (
  products: ProductOption[],
): TableFilterControl[] => [
  {
    key: "type",
    kind: "select",
    label: "Direction",
    options: stockMovementTypes.map((type) => ({
      value: type,
      label: STOCK_MOVEMENT_TYPE_LABELS[type],
    })),
  },
  {
    key: "reason",
    kind: "select",
    label: "Reason",
    options: stockMovementReasons.map((reason) => ({
      value: reason,
      label: STOCK_MOVEMENT_REASON_LABELS[reason],
    })),
  },
  {
    key: "product",
    kind: "select",
    label: "Product",
    placeholder: "All products",
    options: products.map((product) => ({
      value: product.uuid,
      label: `${product.productCode} — ${product.name}`,
    })),
  },
  { key: "createdAt", kind: "dateRange", label: "Moved" },
];
