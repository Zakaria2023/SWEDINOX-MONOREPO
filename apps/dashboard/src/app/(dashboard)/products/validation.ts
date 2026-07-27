import { z } from "zod";
import { salesUnitOptions } from "@/lib/enums";

export const productSchema = z.object({
  productCode: z.string().min(1, "Product code is required"),
  commodityCode: z.string().optional(),
  productGroupUuid: z.string().optional(),
  companyUuid: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  stockProduct: z.boolean(),
  standardProduct: z.boolean(),
  length: z.string().optional(),
  widthDiameter: z.string().optional(),
  thickness: z.string().optional(),
  technicalStock: z.string(),
  stockUnit: z.enum(salesUnitOptions).optional(),
  theoreticalWeight: z.string(),
  weightUnit: z.enum(salesUnitOptions).optional(),
});

export type ProductFormValues = z.infer<typeof productSchema>;

export const DEFAULT_PRODUCT: ProductFormValues = {
  productCode: "",
  commodityCode: "",
  productGroupUuid: "",
  companyUuid: "",
  name: "",
  stockProduct: false,
  standardProduct: false,
  length: "",
  widthDiameter: "",
  thickness: "",
  technicalStock: "0.000",
  stockUnit: undefined,
  theoreticalWeight: "0.0000",
  weightUnit: undefined,
};
