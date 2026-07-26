import { transporterPriceUnits } from "@/lib/enums";
import { todayDateString } from "@/lib/helpers";
import { z } from "zod";

// Row values for the inline transporter-costs grid. The legacy mega-form had
// no per-row schema (rows lived in plain component state), so this schema is
// new — it validates the same shape the grid edits.
export const transporterCostRowSchema = z.object({
  fromDate: z.string(),
  untilDate: z.string(),
  nowValid: z.boolean(),
  fromKm: z.string(),
  untilKm: z.string(),
  fromKg: z.string(),
  untilKg: z.string(),
  price: z.string(),
  priceUnit: z.enum(transporterPriceUnits),
  minAmount: z.string(),
  maxAmount: z.string(),
});

export type TransporterCostRowValues = z.infer<typeof transporterCostRowSchema>;

// New rows start valid from today through the far-future sentinel — the same
// defaults the legacy addTransporterCost handler applied. A function (not a
// const) so `fromDate` is evaluated when the row is added, not at module load.
export const defaultTransporterCostRowValues =
  (): TransporterCostRowValues => ({
    fromDate: todayDateString(),
    untilDate: "9999-12-31",
    nowValid: true,
    fromKm: "0.000",
    untilKm: "0.000",
    fromKg: "0.000",
    untilKg: "0.000",
    price: "0.00",
    priceUnit: "amount",
    minAmount: "0.00",
    maxAmount: "0.00",
  });
