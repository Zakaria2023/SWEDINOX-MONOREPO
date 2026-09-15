import { z } from "zod";

export const blockDeliverySchema = z.object({
  reason: z
    .string()
    .trim()
    .min(1, "Say why the delivery is blocked")
    .max(255, "Keep the reason under 255 characters"),
});

export type BlockDeliveryFormValues = z.infer<typeof blockDeliverySchema>;
