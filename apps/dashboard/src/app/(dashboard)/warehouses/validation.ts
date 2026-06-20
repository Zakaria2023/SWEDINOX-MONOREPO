import {
  warehouseAddresses,
  warehouseBlockReasons,
  warehouseLoadingLocations,
  warehouseLocationTypes,
} from "@/lib/enums";
import { VALIDATION_MESSAGES } from "@/lib/validation-messages";
import { z } from "zod";

export const createWarehouseSchema = () =>
  z.object({
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
    address: z.union([
      z.enum(warehouseAddresses),
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
  });

export type WarehouseFormValues = z.infer<
  ReturnType<typeof createWarehouseSchema>
>;

export const DEFAULT_WAREHOUSE: WarehouseFormValues = {
  name: "",
  locationType: "",
  loadingLocation: "",
  address: "",
  blocked: false,
  blockReason: "",
  blockedForOptimization: false,
  limitedDimensions: false,
};
