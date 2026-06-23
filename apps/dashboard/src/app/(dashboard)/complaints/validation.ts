import { z } from "zod";
import {
  complaintCategories,
  complaintReports,
  complaintTypes,
} from "@/lib/enums";

export const complaintSchema = z.object({
  companyUuid: z.string().min(1, "Company is required"),
  contactUuid: z.string().optional(),
  complaintType: z.enum(complaintTypes).optional(),
  report: z.enum(complaintReports).optional(),
  reportDate: z.string().optional(),
  description: z.string().optional(),
  category: z.enum(complaintCategories).optional(),
  productUuid: z.string().optional(),
  qty: z.string(),
  amount: z.string(),
  weight: z.string(),
});

export type ComplaintFormValues = z.infer<typeof complaintSchema>;

const today = new Date().toISOString().split("T")[0];

export const DEFAULT_COMPLAINT: ComplaintFormValues = {
  companyUuid: "",
  contactUuid: "",
  complaintType: undefined,
  report: undefined,
  reportDate: today,
  description: "",
  category: undefined,
  productUuid: "",
  qty: "0.000",
  amount: "0.00",
  weight: "0.000",
};
