import { z } from "zod";

export const branchSettingsSchema = z.object({
  overduePostBlockDays: z
    .number({ message: "Enter a number of days" })
    .int("Enter a whole number of days")
    .min(1, "At least 1 day")
    .max(3650, "At most 3 650 days"),
  affiliateName: z.string().max(255, "At most 255 characters"),
});

export type BranchSettingsFormValues = z.infer<typeof branchSettingsSchema>;
