import {
  warehouseBlockReasons,
  warehouseLoadingLocations,
  warehouseLocationTypes,
  warehouseProductTypes,
} from "@/lib/enums";
import { z } from "zod";

// The fields a sub section owns. `adaptFromUuid`/`placement` are deliberately
// not in here: they only decide where a *new* sub section is grafted onto the
// tree, and an existing one already has its place.
const warehouseSubSectionFields = z.object({
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
});

export const createWarehouseSubSectionSchema = () =>
  warehouseSubSectionFields.extend({
    adaptFromUuid: z.string().min(1, "Please select a warehouse to adapt from"),
    placement: z.enum(["next", "below"]),
  });

export const editWarehouseSubSectionSchema = () => warehouseSubSectionFields;

export type WarehouseSubSectionFormValues = z.infer<
  ReturnType<typeof createWarehouseSubSectionSchema>
>;

export type WarehouseSubSectionEditValues = z.infer<
  ReturnType<typeof editWarehouseSubSectionSchema>
>;

export const DEFAULT_WAREHOUSE_SUB_SECTION: WarehouseSubSectionFormValues = {
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
