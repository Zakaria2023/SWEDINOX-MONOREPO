import type { TFunction } from "i18next";
import { z } from "zod";
import { locationAdoptPositions, locationTypes } from "@/lib/enums";

export const createLocationSchema = (t: TFunction) =>
  z.object({
    name: z.string().min(1, t("validation.location-name-required")),
    locationType: z.enum(locationTypes, {
      error: t("validation.location-type-required"),
    }),
    loadingLocationUuid: z.string().optional(),
    addressUuid: z.string().optional(),
    pickingSequence: z.union([z.string(), z.literal(""), z.undefined()]),
    isBlocked: z.boolean(),
    blockedReason: z.string().optional(),
    blockedForOptimization: z.boolean(),
    limitedDimensions: z.boolean(),
    adoptFrom: z.string().optional(),
    adoptPosition: z.enum(locationAdoptPositions).optional(),
  });

export type LocationFormValues = z.infer<ReturnType<typeof createLocationSchema>>;

export const createSubLocationSchema = (t: TFunction) =>
  z.object({
    name: z.string().min(1, t("validation.location-name-required")),
    locationType: z.enum(locationTypes, {
      error: t("validation.location-type-required"),
    }),
    adoptFrom: z.string().min(1, t("validation.adopt-from-required")),
    adoptPosition: z.enum(locationAdoptPositions).optional(),
    pickingSequence: z.union([z.string(), z.literal(""), z.undefined()]),
    isBlocked: z.boolean(),
    blockedReason: z.string().optional(),
    blockedForOptimization: z.boolean(),
    limitedDimensions: z.boolean(),
  });

export type SubLocationFormValues = z.infer<ReturnType<typeof createSubLocationSchema>>;
