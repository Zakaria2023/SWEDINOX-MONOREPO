import { z } from "zod";

// One call-off on a `Call-off` order — the reference's `Call-offs` panel row:
// a customer reference, the address it goes to, `Rush` and `IsSend`.
export const callOffSchema = z.object({
  customerRef: z.string().max(255),
  deliveryAddressUuid: z.string(),
  isRush: z.boolean(),
  isSent: z.boolean(),
});

export type CallOffValues = z.infer<typeof callOffSchema>;
