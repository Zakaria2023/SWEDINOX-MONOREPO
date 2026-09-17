import { z } from "zod";

// The reference's `Bewerk adres afstand`: the address as it is written, and the
// kilometres from our own depot to it. Whole kilometres — every one of the
// reference's 481 rows is an integer.
export const addressDistanceSchema = z.object({
  country: z.string().max(100, "At most 100 characters"),
  city: z.string().max(150, "At most 150 characters"),
  street: z.string().max(255, "At most 255 characters"),
  postalCode: z.string().max(50, "At most 50 characters"),
  km: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, "Kilometres must be a number, 0 or more"),
});

export type AddressDistanceValues = z.infer<typeof addressDistanceSchema>;
