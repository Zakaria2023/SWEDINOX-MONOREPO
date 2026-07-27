import { z } from "zod";
import {
  contractDiscountBasedOnTypes,
  contractSurchargePerTypes,
  contractTierUnits,
  contractTypes,
} from "@/lib/enums";

const priceTierSchema = z.object({
  from: z.number().min(0),
  percentage: z.number().min(0),
});

export const createContractSchema = () =>
  z.object({
    code: z.string().min(1, "Code is required"),
    contractType: z.enum(contractTypes).optional(),
    description: z
      .string()
      .min(1, "Description is required"),
    contractGroupUuid: z.string().min(1, "Contract Group is required"),
    quicklyChangeOrder: z.string().optional(),
    hasPriceDate: z.boolean(),
    priceDate: z.string().optional(),
    linkToNewCustomer: z.boolean(),
    searchCode1: z.string().optional(),
    searchCode2: z.string().optional(),
    searchCode3: z.string().optional(),
    websiteSorting: z.union([z.string(), z.literal(""), z.undefined()]),
    hideOnWebsite: z.boolean(),
    // Details — Gross prices
    grossPrice: z.boolean(),
    grossPriceValue: z.string().optional(),
    // Details — Color surcharge
    colorSurcharge: z.boolean(),
    colorSurchargeValue: z.string().optional(),
    colorSurchargeUnit: z.string().optional(),
    // Details — Extra discount
    extraDiscount: z.boolean(),
    extraDiscountValue: z.string().optional(),
    extraDiscountUnit: z.string().optional(),
    extraDiscountFromValue: z.string().optional(),
    extraDiscountFromUnit: z.string().optional(),
    // Details — Quantity surcharge
    quantitySurcharge: z.boolean(),
    quantitySurchargeTierUnit: z.enum(contractTierUnits).optional(),
    quantitySurchargeDiscountUnit: z.string().optional(),
    quantitySurchargeTiers: z.array(priceTierSchema),
    quantitySurchargePerType: z.enum(contractSurchargePerTypes).optional(),
    // Details — Line discount
    lineDiscount: z.boolean(),
    lineDiscountTierUnit: z.enum(contractTierUnits).optional(),
    lineDiscountDiscountUnit: z.string().optional(),
    lineDiscountTiers: z.array(priceTierSchema),
    // Details — Group discount
    groupDiscount: z.boolean(),
    groupDiscountTierUnit: z.enum(contractTierUnits).optional(),
    groupDiscountDiscountUnit: z.string().optional(),
    groupDiscountTiers: z.array(priceTierSchema),
    groupDiscountBasedOn: z.enum(contractDiscountBasedOnTypes).optional(),
  });

export type ContractFormValues = z.infer<ReturnType<typeof createContractSchema>>;
