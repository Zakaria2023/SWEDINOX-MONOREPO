import { z } from "zod";
import { textUsageCategories } from "@/lib/enums";
import { VALIDATION_MESSAGES } from "@/lib/validation-messages";

export const createTextSchema = () =>
  z.object({
    textCategoryUuid: z.string().optional(),
    title: z.string().min(1, VALIDATION_MESSAGES.nameRequired),
    textBlock: z.string().min(1, "Text block is required"),
    usageCategoriesJson: z.array(z.enum(textUsageCategories)),
    sequenceNumber: z.union([z.string(), z.literal(""), z.undefined()]),
    isActive: z.boolean(),
  });

export type TextFormValues = z.infer<ReturnType<typeof createTextSchema>>;
