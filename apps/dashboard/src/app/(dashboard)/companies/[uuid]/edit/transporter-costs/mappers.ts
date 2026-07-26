import type {
  InsertTransporterCosts,
  SelectTransporterCosts,
} from "@/db/schema/transporter-costs";
import type { TransporterCostRowValues } from "./validation";

// Row ↔ grid-values mappers for the inline transporter-costs table. Null
// decimals render with the same zero fallbacks the legacy grid used; empty
// inputs write null back so clearing works.

export const transporterCostRowToValues = (
  row: SelectTransporterCosts,
): TransporterCostRowValues => ({
  fromDate: row.fromDate ?? "",
  untilDate: row.untilDate ?? "",
  nowValid: row.nowValid ?? false,
  fromKm: row.fromKm ?? "0.000",
  untilKm: row.untilKm ?? "0.000",
  fromKg: row.fromKg ?? "0.000",
  untilKg: row.untilKg ?? "0.000",
  price: row.price ?? "0.00",
  priceUnit: row.priceUnit ?? "amount",
  minAmount: row.minAmount ?? "0.00",
  maxAmount: row.maxAmount ?? "0.00",
});

export const transporterCostValuesToColumns = (
  values: TransporterCostRowValues,
): Partial<InsertTransporterCosts> => ({
  fromDate: values.fromDate || null,
  untilDate: values.untilDate || null,
  nowValid: values.nowValid,
  fromKm: values.fromKm || null,
  untilKm: values.untilKm || null,
  fromKg: values.fromKg || null,
  untilKg: values.untilKg || null,
  price: values.price || null,
  priceUnit: values.priceUnit,
  minAmount: values.minAmount || null,
  maxAmount: values.maxAmount || null,
});

export const transporterCostValuesEqual = (
  a: TransporterCostRowValues,
  b: TransporterCostRowValues,
): boolean =>
  a.fromDate === b.fromDate &&
  a.untilDate === b.untilDate &&
  a.nowValid === b.nowValid &&
  a.fromKm === b.fromKm &&
  a.untilKm === b.untilKm &&
  a.fromKg === b.fromKg &&
  a.untilKg === b.untilKg &&
  a.price === b.price &&
  a.priceUnit === b.priceUnit &&
  a.minAmount === b.minAmount &&
  a.maxAmount === b.maxAmount;
