import type {
  InsertCustomerProjects,
  SelectCustomerProjects,
} from "@/db/schema/customer-projects";
import type { ProjectDialogValues } from "./validation";

// The project dialog edits the name, end date, revenue, and linked contract.
// startingDate and daysInSystem are set once on insert (today / 0, matching
// the legacy add handler) and are never rewritten on update.

export const projectRowToDialogValues = (
  row: SelectCustomerProjects,
): ProjectDialogValues => ({
  projectName: row.projectName ?? "",
  endDate: row.endDate ?? "",
  revenue: row.revenue,
  contractUuid: row.contractUuid ?? "",
});

export const projectValuesToColumns = (
  values: ProjectDialogValues,
): Partial<InsertCustomerProjects> => ({
  projectName: values.projectName || null,
  endDate: values.endDate || null,
  // revenue is NOT NULL with a 0.00 default, so clearing writes the default
  // instead of null.
  revenue: values.revenue || "0.00",
  contractUuid: values.contractUuid || null,
});
