import { CompanyOption } from "@/app/(dashboard)/companies/actions";
import { ContractGroupOption } from "@/app/(dashboard)/contract-groups/actions";
import { contractableRoles, contractTypes } from "@/lib/enums";
import { companyOptionLabel } from "@/lib/helpers";
import { CONTRACT_TYPE_LABELS, CONTRACTABLE_ROLE_LABELS } from "@/lib/labels";
import { TableFilterControl } from "@/lib/table-query";

export const contractFilters = (
  companies: CompanyOption[],
  contractGroups: ContractGroupOption[],
): TableFilterControl[] => [
  {
    key: "role",
    kind: "select",
    label: "Role",
    options: contractableRoles.map((role) => ({
      value: role,
      label: CONTRACTABLE_ROLE_LABELS[role],
    })),
  },
  {
    key: "contractType",
    kind: "select",
    label: "Type",
    options: contractTypes.map((type) => ({
      value: type,
      label: CONTRACT_TYPE_LABELS[type],
    })),
  },
  {
    key: "company",
    kind: "select",
    label: "Company",
    placeholder: "All companies",
    options: companies.map((company) => ({
      value: company.uuid,
      label: companyOptionLabel(company),
    })),
  },
  {
    key: "contractGroup",
    kind: "select",
    label: "Contract group",
    placeholder: "All groups",
    options: contractGroups.map((group) => ({
      value: group.uuid,
      label: group.name,
    })),
  },
];
