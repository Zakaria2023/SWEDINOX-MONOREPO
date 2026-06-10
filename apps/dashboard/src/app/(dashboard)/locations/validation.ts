import { locationAdoptPositions, locationTypes } from "@/lib/enums";
import { z } from "zod";

export const locationSchema = z.object({
  name: z.string().min(1, "Location name is required"),
  locationType: z.enum(locationTypes, { error: "Location type is required" }),
  loadingLocationUuid: z.string().optional(),
  addressUuid: z.string().optional(),
  // Keep as string; submit handler calls Number() — avoids z.coerce input/output divergence
  pickingSequence: z.union([z.string(), z.literal(""), z.undefined()]),
  isBlocked: z.boolean(),
  blockedReason: z.string().optional(),
  blockedForOptimization: z.boolean(),
  limitedDimensions: z.boolean(),
  adoptFrom: z.string().optional(),
  // No .default(); default lives in useForm's defaultValues
  adoptPosition: z.enum(locationAdoptPositions).optional(),
});

export type LocationFormValues = z.infer<typeof locationSchema>;
