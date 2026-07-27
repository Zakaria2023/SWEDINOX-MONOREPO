import { InsertProcessings, SelectProcessings } from "@/db/schema/processings";
import { ProcessingRowValues } from "./validation";

// Row ↔ grid-values mappers for the inline processings table. Empty
// selects/inputs write null back so clearing works.

export const processingRowToValues = (
  row: SelectProcessings,
): ProcessingRowValues => ({
  editing: row.editing ?? "",
  preference: row.preference ?? false,
  supplierUuid: row.supplierUuid ?? "",
  deliveryTime: row.deliveryTime ?? 0,
  deliveryTimeUnit: row.deliveryTimeUnit ?? "",
  processorLocation: row.processorLocation ?? "",
});

export const processingValuesToColumns = (
  values: ProcessingRowValues,
): Partial<InsertProcessings> => ({
  editing: (values.editing || null) as InsertProcessings["editing"],
  preference: values.preference,
  supplierUuid: values.supplierUuid || null,
  deliveryTime: values.deliveryTime,
  deliveryTimeUnit: (values.deliveryTimeUnit ||
    null) as InsertProcessings["deliveryTimeUnit"],
  processorLocation: values.processorLocation || null,
});

export const processingValuesEqual = (
  a: ProcessingRowValues,
  b: ProcessingRowValues,
): boolean =>
  a.editing === b.editing &&
  a.preference === b.preference &&
  a.supplierUuid === b.supplierUuid &&
  a.deliveryTime === b.deliveryTime &&
  a.deliveryTimeUnit === b.deliveryTimeUnit &&
  a.processorLocation === b.processorLocation;
