import {
  warehouseBlockReasons,
  warehouseLoadingLocations,
  warehouseLocationTypes,
} from "@/lib/enums";
import { VALIDATION_MESSAGES } from "@/lib/validation-messages";
import { z } from "zod";

export const createWarehouseSubSectionSchema = () =>
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
    pickingSequence: z.union([
      z.number().int().min(1),
      z.literal(""),
      z.undefined(),
    ]),
  });

export type WarehouseSubSectionFormValues = z.infer<
  ReturnType<typeof createWarehouseSubSectionSchema>
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
  pickingSequence: "",
};
