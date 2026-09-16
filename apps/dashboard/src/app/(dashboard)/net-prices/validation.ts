import { z } from "zod";
import { salesUnitOptions } from "@/lib/enums";
import { todayDateString } from "@/lib/helpers";

export const netPriceSchema = z.object({
  contractUuid: z.string().min(1, "Contract is required"),
  productUuid: z.string().min(1, "Product is required"),
  netPrice: z.string().min(1, "Agreed price is required"),
  netPriceUnit: z.enum(salesUnitOptions),
  fromQty: z.string(),
  fromQtyUnit: z.enum(salesUnitOptions),
  validFrom: z.string().optional(),
  validUntil: z.string().optional(),
});

export type NetPriceFormValues = z.infer<typeof netPriceSchema>;

export const DEFAULT_NET_PRICE: NetPriceFormValues = {
  contractUuid: "",
  productUuid: "",
  netPrice: "",
  netPriceUnit: "KG",
  fromQty: "0",
  fromQtyUnit: "KG",
  validFrom: todayDateString(),
  validUntil: "",
};
