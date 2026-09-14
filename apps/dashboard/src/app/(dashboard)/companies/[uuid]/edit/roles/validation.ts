import { companyRoles } from "@/lib/enums";
import { z } from "zod";

// Customer and prospect exclude each other — on 6 796 of 6 796 contact rows in
// the reference. Converting a prospect replaces one role with the other.
export const companyRolesSchema = z.object({
  roles: z
    .array(z.enum(companyRoles))
    .min(1, "Select at least one role")
    .refine(
      (roles) => !(roles.includes("customer") && roles.includes("prospect")),
      "A company is either a customer or a prospect, not both",
    ),
});

export type CompanyRolesFormValues = z.infer<typeof companyRolesSchema>;
