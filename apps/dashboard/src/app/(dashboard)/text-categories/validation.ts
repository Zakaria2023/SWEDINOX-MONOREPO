import { z } from "zod";
import { textUsageCategories } from "@/lib/enums";

export const createTextCategorySchema = () =>
  z.object({
    parentUuid: z.string().optional(),
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
    usageCategoriesJson: z.array(z.enum(textUsageCategories)),
    sequenceNumber: z.number().int().min(0).optional(),
    isActive: z.boolean(),
  });

export type TextCategoryFormValues = z.infer<
  ReturnType<typeof createTextCategorySchema>
>;
