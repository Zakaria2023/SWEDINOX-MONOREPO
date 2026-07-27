import { CompanyRole, companyRoles } from "@/lib/enums";

const AGENT_ALLOWED = new Set<CompanyRole>(["agent", "other", "internal"]);
const PURCHASING_ORG_ALLOWED = new Set<CompanyRole>([
  "purchasing_org",
  "other",
]);

// Mirrors the role-exclusivity matrix of the legacy company form:
// customer/prospect are mutually exclusive, and agent / purchasing-org
// companies may only combine with their allowed partner roles.
export const getDisabledRoles = (selected: CompanyRole[]): Set<CompanyRole> => {
  const disabled = new Set<CompanyRole>();
  if (selected.includes("customer")) {
    disabled.add("prospect");
  }
  if (selected.includes("prospect")) {
    disabled.add("customer");
  }
  if (selected.includes("agent")) {
    for (const role of companyRoles) {
      if (!AGENT_ALLOWED.has(role)) {
        disabled.add(role);
      }
    }
  }
  if (selected.includes("purchasing_org")) {
    for (const role of companyRoles) {
      if (!PURCHASING_ORG_ALLOWED.has(role)) {
        disabled.add(role);
      }
    }
  }
  if (selected.some((role) => !AGENT_ALLOWED.has(role))) {
    disabled.add("agent");
  }
  if (selected.some((role) => !PURCHASING_ORG_ALLOWED.has(role))) {
    disabled.add("purchasing_org");
  }
  return disabled;
};
