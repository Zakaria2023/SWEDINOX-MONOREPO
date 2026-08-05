import {
  warehouseBlockReasons,
  warehouseCountStockTypes,
  warehouseLoadingLocations,
  warehouseLocationTypes,
  warehouseProductTypes,
} from "@/lib/enums";
import { z } from "zod";

// The fields a location owns. `adaptFromUuid`/`placement` are deliberately not
// in here: they only decide where a *new* location is grafted onto the tree,
// and an existing one already has its place.
const locationFields = z.object({
  name: z.string().min(1, "Name is required"),
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

  // Count settings
  countPer: z.union([z.number().int().min(0), z.literal(""), z.undefined()]),
  countAs: z.enum(warehouseCountStockTypes),
  countUnderValue: z.union([
    z.number().int().min(0),
    z.literal(""),
    z.undefined(),
  ]),
  countUnderUnit: z.string().optional(),
  openCountOrderAvailable: z.boolean(),

  // Documents
  documents: z.array(z.object({ id: z.string(), fileName: z.string() })),
});

export const createLocationSchema = () =>
  locationFields.extend({
    adaptFromUuid: z.string().min(1, "Please select a warehouse to adapt from"),
    placement: z.enum(["next", "below"]),
  });

export const editLocationSchema = () => locationFields;

export type LocationFormValues = z.infer<ReturnType<typeof createLocationSchema>>;

export type LocationEditValues = z.infer<ReturnType<typeof editLocationSchema>>;

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
  countPer: "",
  countAs: "technical_stock",
  countUnderValue: "",
  countUnderUnit: "",
  openCountOrderAvailable: false,
  documents: [],
};
