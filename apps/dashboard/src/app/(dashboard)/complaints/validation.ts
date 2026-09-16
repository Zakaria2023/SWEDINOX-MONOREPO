import { z } from "zod";
import {
  complaintCategories,
  complaintCauses,
  complaintReports,
  complaintSolutions,
  complaintStatuses,
  complaintTypes,
  stockUnits,
} from "@/lib/enums";
import { todayDateString } from "@/lib/helpers";

export const complaintSchema = z.object({
  companyUuid: z.string().min(1, "Company is required"),
  contactUuid: z.string().optional(),
  complaintType: z.enum(complaintTypes).optional(),
  // The one `Order:` picker; the type decides which kind of document it holds.
  documentUuid: z.string().optional(),
  report: z.enum(complaintReports).optional(),
  reportDate: z.string().optional(),
  description: z.string().optional(),
  category: z.enum(complaintCategories).optional(),
  productUuid: z.string().optional(),
  qty: z.string(),
  qtyUnit: z.enum(stockUnits).optional(),
  amount: z.string(),
  weight: z.string(),
  // Handling
  status: z.enum(complaintStatuses),
  responsibleUserId: z.string().optional(),
  deadline: z.string().optional(),
  cause: z.enum(complaintCauses).optional(),
  explanationOfCause: z.string().optional(),
  solution: z.enum(complaintSolutions).optional(),
  explanationOfSolution: z.string().optional(),
  costsCustomer: z.string(),
  costsCustomerNote: z.string().optional(),
  internalCosts: z.string(),
  internalCostsNote: z.string().optional(),
  extraCosts: z.string(),
  extraCostsNote: z.string().optional(),
  toBeReclaimed: z.string(),
  toBeReclaimedNote: z.string().optional(),
  documents: z.array(z.object({ id: z.string(), fileName: z.string() })),
});

export type ComplaintFormValues = z.infer<typeof complaintSchema>;

// One delivered order line added to an order complaint's Lines panel.
export const complaintLineSchema = z.object({
  orderItemUuid: z.string().min(1, "Choose the delivered line"),
  billOfLading: z.string().max(100, "At most 100 characters"),
  qtyShortfall: z
    .string()
    .refine(
      (value) => value.trim() !== "" && Number(value) >= 0,
      "Enter the disputed quantity (0 or more)",
    ),
  exchangeProductUuid: z.string(),
});

export type ComplaintLineFormValues = z.infer<typeof complaintLineSchema>;

export const DEFAULT_COMPLAINT_LINE: ComplaintLineFormValues = {
  orderItemUuid: "",
  billOfLading: "",
  qtyShortfall: "0",
  exchangeProductUuid: "",
};

export const DEFAULT_COMPLAINT: ComplaintFormValues = {
  companyUuid: "",
  contactUuid: "",
  complaintType: undefined,
  documentUuid: "",
  report: undefined,
  reportDate: todayDateString(),
  description: "",
  category: undefined,
  productUuid: "",
  qty: "0.000",
  qtyUnit: undefined,
  amount: "0.00",
  weight: "0.000",
  status: "new",
  responsibleUserId: "",
  deadline: todayDateString(),
  cause: undefined,
  explanationOfCause: "",
  solution: undefined,
  explanationOfSolution: "",
  costsCustomer: "0.00",
  costsCustomerNote: "",
  internalCosts: "0.00",
  internalCostsNote: "",
  extraCosts: "0.00",
  extraCostsNote: "",
  toBeReclaimed: "0.00",
  toBeReclaimedNote: "",
  documents: [],
};
