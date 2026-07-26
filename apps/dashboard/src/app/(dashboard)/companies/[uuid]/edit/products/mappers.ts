import type { ProductDialogValues } from "@/app/(dashboard)/companies/validation";
import type { ProductOption } from "@/app/(dashboard)/products/actions";
import type { InsertProducts, SelectProducts } from "@/db/schema/products";

// The product dialog edits only the company-specific terms of a product row
// (preferred, codes, delivery time, order quantities). Identity columns
// (productCode, name, productGroupUuid) are copied from the picked catalog
// product by the save action, and columns the dialog doesn't show
// (showOnWebsite, prices, stock figures) are never written on update, so
// values set elsewhere survive later edits.

export const productRowToDialogValues = (
  row: SelectProducts,
): ProductDialogValues => ({
  // The row's own uuid stands in for the picked product — the save action
  // re-copies the identity columns only when this differs from the row uuid.
  productUuid: row.uuid,
  preferred: row.preferred ?? false,
  ean: row.ean ?? "",
  externalProductCode: row.externalProductCode ?? "",
  editing: row.editing ?? "",
  deliveryTime: row.deliveryTime != null ? String(row.deliveryTime) : "",
  deliveryTimeUnit: row.deliveryTimeUnit ?? "",
  minOrderQty: row.minOrderQty ?? "",
  minOrderQtyUnit: row.minOrderQtyUnit ?? "",
  orderSeries: row.orderSeries != null ? String(row.orderSeries) : "",
  orderSeriesUnit: row.orderSeriesUnit ?? "",
});

// Lets the dialog show the row's own code/name as the selected product when
// editing, before the user re-picks anything.
export const productRowToOption = (row: SelectProducts): ProductOption => ({
  uuid: row.uuid,
  productCode: row.productCode,
  name: row.name,
  productGroupUuid: row.productGroupUuid,
});

// Empty inputs clear the column on update.
export const productValuesToUpdateColumns = (
  values: ProductDialogValues,
): Partial<InsertProducts> => ({
  preferred: values.preferred,
  ean: values.ean || null,
  externalProductCode: values.externalProductCode || null,
  editing: values.editing || null,
  deliveryTime: values.deliveryTime ? Number(values.deliveryTime) : null,
  deliveryTimeUnit: values.deliveryTimeUnit || null,
  minOrderQty: values.minOrderQty || null,
  minOrderQtyUnit: values.minOrderQtyUnit || null,
  orderSeries: values.orderSeries ? Number(values.orderSeries) : null,
  orderSeriesUnit: values.orderSeriesUnit || null,
});

// On insert, empty inputs stay undefined so the schema defaults apply
// (deliveryTime 0, minOrderQty "0.000", orderSeries 0) — the same values the
// legacy create-company flow produced.
export const productValuesToInsertColumns = (
  values: ProductDialogValues,
): Partial<InsertProducts> => ({
  preferred: values.preferred,
  ean: values.ean || undefined,
  externalProductCode: values.externalProductCode || undefined,
  editing: values.editing || undefined,
  deliveryTime: values.deliveryTime ? Number(values.deliveryTime) : undefined,
  deliveryTimeUnit: values.deliveryTimeUnit || undefined,
  minOrderQty: values.minOrderQty || undefined,
  minOrderQtyUnit: values.minOrderQtyUnit || undefined,
  orderSeries: values.orderSeries ? Number(values.orderSeries) : undefined,
  orderSeriesUnit: values.orderSeriesUnit || undefined,
});
