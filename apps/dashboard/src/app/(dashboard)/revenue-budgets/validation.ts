import { z } from "zod";

const amount = z
  .number({ message: "Enter a number" })
  .min(0, "Cannot be negative");

const percentage = z
  .number({ message: "Enter a percentage" })
  .min(-100, "At least -100 %")
  .max(100, "At most 100 %");

export const revenueBudgetSchema = z.object({
  revenueGroupUuid: z.string().min(1, "Pick a revenue group"),
  year: z
    .number({ message: "Enter a year" })
    .int("Enter a whole year")
    .min(2000, "From 2000")
    .max(2100, "Up to 2100"),
  month: z
    .number({ message: "Enter a month" })
    .int("Enter a month from 1 to 12")
    .min(1, "Enter a month from 1 to 12")
    .max(12, "Enter a month from 1 to 12"),
  revenueStock: amount,
  revenueCrossDock: amount,
  revenueFactory: amount,
  weightStock: amount,
  weightCrossDock: amount,
  weightFactory: amount,
  profitPercentageStock: percentage,
  profitPercentageCrossDock: percentage,
  profitPercentageFactory: percentage,
});

export type RevenueBudgetFormValues = z.infer<typeof revenueBudgetSchema>;
