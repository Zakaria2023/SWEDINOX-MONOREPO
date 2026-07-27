import { z } from "zod";

// The legacy project dialog schema lives unexported inside
// companies/use-company-submit.ts, so this section defines its own copy of the
// same shape and defaults.
export const projectDialogSchema = z.object({
  projectName: z.string().optional(),
  endDate: z.string().optional(),
  revenue: z.string().optional(),
  contractUuid: z.string().optional(),
});

export type ProjectDialogValues = z.infer<typeof projectDialogSchema>;

export const DEFAULT_PROJECT_VALUES: ProjectDialogValues = {
  projectName: "",
  endDate: "",
  revenue: "",
  contractUuid: "",
};
