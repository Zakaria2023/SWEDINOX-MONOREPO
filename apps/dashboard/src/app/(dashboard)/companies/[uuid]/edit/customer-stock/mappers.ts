import type { CustomerStockDialogValues } from "@/app/(dashboard)/companies/validation";
import type { ProductOption } from "@/app/(dashboard)/products/actions";
import type {
  InsertCustomerStock,
  SelectCustomerStock,
} from "@/db/schema/customer-stock";
import type { CustomerStockReason } from "@/lib/enums";

// The customer stock dialog edits location, product, quantity, reason, and
// description. productCode/productName are snapshotted from the picked catalog
// product by the save action, never entered directly.

export const customerStockRowToDialogValues = (
  row: SelectCustomerStock,
): CustomerStockDialogValues => ({
  location: row.location ?? "",
  productUuid: row.productUuid ?? "",
  quantity: row.quantity ?? "0.000",
  // Same placeholder cast DEFAULT_CUSTOMER_STOCK uses — the schema rejects ""
  // on submit, forcing a real pick for legacy rows with no reason stored.
  reason: row.reason ?? ("" as CustomerStockReason),
  description: row.description ?? "",
});

// Lets the dialog show the stored snapshot as the selected product when
// editing, before the user re-picks anything.
export const customerStockRowToOption = (
  row: SelectCustomerStock,
): ProductOption | null =>
  row.productUuid
    ? {
        uuid: row.productUuid,
        productCode: row.productCode ?? "",
        name: row.productName ?? "",
        productGroupUuid: null,
      }
    : null;

// Empty location/description clear the column; an empty quantity falls back to
// "0.000" — the same default the legacy save handler applied, so the stock
// grid always shows a number.
export const customerStockValuesToColumns = (
  values: CustomerStockDialogValues,
): Partial<InsertCustomerStock> => ({
  location: values.location || null,
  quantity: values.quantity || "0.000",
  reason: values.reason,
  description: values.description || null,
});
