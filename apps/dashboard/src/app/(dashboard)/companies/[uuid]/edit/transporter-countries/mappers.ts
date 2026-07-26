import type {
  InsertTransporterCountries,
  SelectTransporterCountries,
} from "@/db/schema/transporter-countries";
import type { TransporterCountryRowValues } from "./validation";

// Row ↔ grid-values mappers for the inline transporter-countries table.
// Empty selects/inputs write null back so clearing works.

export const transporterCountryRowToValues = (
  row: SelectTransporterCountries,
): TransporterCountryRowValues => ({
  country: row.country ?? "",
  deliveryTerms: row.deliveryTerms ?? "",
  maxKg: row.maxKg ?? "0.000",
  surchargePercentage: row.surchargePercentage ?? "0.00",
});

export const transporterCountryValuesToColumns = (
  values: TransporterCountryRowValues,
): Partial<InsertTransporterCountries> => ({
  country: (values.country || null) as InsertTransporterCountries["country"],
  deliveryTerms: (values.deliveryTerms ||
    null) as InsertTransporterCountries["deliveryTerms"],
  maxKg: values.maxKg || null,
  surchargePercentage: values.surchargePercentage || null,
});

export const transporterCountryValuesEqual = (
  a: TransporterCountryRowValues,
  b: TransporterCountryRowValues,
): boolean =>
  a.country === b.country &&
  a.deliveryTerms === b.deliveryTerms &&
  a.maxKg === b.maxKg &&
  a.surchargePercentage === b.surchargePercentage;
