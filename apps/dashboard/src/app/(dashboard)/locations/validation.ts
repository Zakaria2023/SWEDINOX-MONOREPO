import { locationAdoptPositions, locationTypes } from "@/lib/enums";
import { z } from "zod";

export const locationSchema = z.object({
  name: z.string().min(1, "Location name is required"),
  locationType: z.enum(locationTypes, { error: "Location type is required" }),
  pickingSequence: z.union([z.coerce.number().int().nonnegative(), z.literal(""), z.undefined()]),
  isBlocked: z.boolean().default(false),
  blockedReason: z.string().optional(),
  blockedForOptimization: z.boolean().default(false),
  limitedDimensions: z.boolean().default(false),
  adoptFrom: z.string().optional(),
  adoptPosition: z.enum(locationAdoptPositions).default("below"),
});

export type LocationFormValues = z.infer<typeof locationSchema>;
