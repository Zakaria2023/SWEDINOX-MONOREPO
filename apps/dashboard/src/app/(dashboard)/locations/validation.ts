import {
  warehouseBlockReasons,
  warehouseLoadingLocations,
  warehouseLocationTypes,
  warehouseProductTypes,
} from "@/lib/enums";
import { VALIDATION_MESSAGES } from "@/lib/validation-messages";
import { z } from "zod";

export const createLocationSchema = () =>
  z.object({
    adaptFromUuid: z.string().min(1, "Please select a warehouse to adapt from"),
    placement: z.enum(["next", "below"]),
    name: z.string().min(1, VALIDATION_MESSAGES.nameRequired),
    locationType: z.union([
      z.enum(warehouseLocationTypes),
      z.literal(""),
      z.undefined(),
    ]),
    loadingLocation: z.union([
      z.enum(warehouseLoadingLocations),
      z.literal(""),
      z.undefined(),
    ]),
    blocked: z.boolean(),
    blockReason: z.union([
      z.enum(warehouseBlockReasons),
      z.literal(""),
      z.undefined(),
    ]),
    blockedForOptimization: z.boolean(),
    limitedDimensions: z.boolean(),
    minLength: z.union([z.number().int().min(0), z.literal(""), z.undefined()]),
    maxLength: z.union([z.number().int().min(0), z.literal(""), z.undefined()]),
    maxWidth: z.union([z.number().int().min(0), z.literal(""), z.undefined()]),
    maxWeight: z.union([z.number().int().min(0), z.literal(""), z.undefined()]),
    productTypes: z.array(z.enum(warehouseProductTypes)),
    pickingSequence: z.union([
      z.number().int().min(1),
      z.literal(""),
      z.undefined(),
    ]),
  });

export type LocationFormValues = z.infer<ReturnType<typeof createLocationSchema>>;

export const DEFAULT_LOCATION: LocationFormValues = {
  adaptFromUuid: "",
  placement: "below",
  name: "",
  locationType: "",
  loadingLocation: "",
  blocked: false,
  blockReason: "",
  blockedForOptimization: false,
  limitedDimensions: false,
  minLength: "",
  maxLength: "",
  maxWidth: "",
  maxWeight: "",
  productTypes: [],
  pickingSequence: "",
};
