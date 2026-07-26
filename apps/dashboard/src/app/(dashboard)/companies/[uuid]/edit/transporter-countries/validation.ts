import { deliveryTerms, transporterCountries } from "@/lib/enums";
import { z } from "zod";

// Row values for the inline transporter-countries grid. The legacy mega-form
// had no per-row schema (rows lived in plain component state), so this schema
// is new — it validates the same shape the grid edits.
export const transporterCountryRowSchema = z.object({
  country: z.union([z.enum(transporterCountries), z.literal("")]),
  deliveryTerms: z.union([z.enum(deliveryTerms), z.literal("")]),
  maxKg: z.string(),
  surchargePercentage: z.string(),
});

export type TransporterCountryRowValues = z.infer<
  typeof transporterCountryRowSchema
>;

// The same blank-row defaults the legacy addTransporterCountry handler
// applied (empty selects map to "" here instead of undefined).
export const DEFAULT_TRANSPORTER_COUNTRY_ROW: TransporterCountryRowValues = {
  country: "",
  deliveryTerms: "",
  maxKg: "0.000",
  surchargePercentage: "0.00",
};
