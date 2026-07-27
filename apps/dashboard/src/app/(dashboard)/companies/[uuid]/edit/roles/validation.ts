import { companyRoles } from "@/lib/enums";
import { z } from "zod";

export const companyRolesSchema = z.object({
  roles: z.array(z.enum(companyRoles)).min(1, "Select at least one role"),
});

export type CompanyRolesFormValues = z.infer<typeof companyRolesSchema>;
