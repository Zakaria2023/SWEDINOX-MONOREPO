import { DECIMAL_AMOUNT_PATTERN } from "@/lib/helpers";
import { z } from "zod";

// The legacy project dialog schema lives unexported inside
// companies/use-company-submit.ts, so this section defines its own copy of the
// same shape and defaults.
export const projectDialogSchema = z.object({
  projectName: z.string().optional(),
  endDate: z.string().optional(),
  // Revenue is stored in a decimal column, so anything that isn't an amount has
  // to be caught here — MySQL rejects the whole insert otherwise.
  revenue: z
    .string()
    .optional()
    .refine(
      (value) => !value?.trim() || DECIMAL_AMOUNT_PATTERN.test(value.trim()),
      "Revenue must be an amount, for example 1250.00",
    ),
  contractUuid: z.string().optional(),
});

export type ProjectDialogValues = z.infer<typeof projectDialogSchema>;

export const DEFAULT_PROJECT_VALUES: ProjectDialogValues = {
  projectName: "",
  endDate: "",
  revenue: "",
  contractUuid: "",
};
