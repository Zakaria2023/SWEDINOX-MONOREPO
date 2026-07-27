import { z } from "zod";

// The follow-up grid has no dialog schema in the shared validation file — the
// legacy form edited rows inline as plain Input objects — so this section
// defines its own row schema. `date` and `by` are auto-filled when a row is
// drafted and only persisted on insert; updates write the editable columns.
export const followUpRowSchema = z.object({
  date: z.string().optional(),
  by: z.string().optional(),
  contactPerson: z.string().optional(),
  text: z.string().optional(),
  completed: z.boolean(),
});

export type FollowUpRowValues = z.infer<typeof followUpRowSchema>;
