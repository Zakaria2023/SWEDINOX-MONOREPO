import { z } from "zod";
import { VALIDATION_MESSAGES } from "@/lib/validation-messages";

export const createTextCategorySchema = () =>
  z.object({
    parentUuid: z.string().optional(),
    name: z.string().min(1, VALIDATION_MESSAGES.nameRequired),
    description: z.string().optional(),
    sequenceNumber: z.union([z.string(), z.literal(""), z.undefined()]),
    isActive: z.boolean(),
  });

export type TextCategoryFormValues = z.infer<
  ReturnType<typeof createTextCategorySchema>
>;
