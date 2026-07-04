"use client";

import { Checkbox } from "@/components/shadcn/checkbox";
import { CompanyRole, companyRoles } from "@/lib/enums";
import { cn } from "@/lib/helpers";
import { COMPANY_ROLE_LABELS } from "@/lib/labels";

type Props = {
  selectedRoles: CompanyRole[];
  disabledRoles: Set<CompanyRole>;
  isPending: boolean;
  toggleRole: (role: CompanyRole) => void;
};

export const RolesSection = ({
  selectedRoles,
  disabledRoles,
  isPending,
  toggleRole,
}: Props) => (
  <section className="space-y-4">
    <h2 className="border-b pb-2 text-lg font-semibold text-gray-800">Roles</h2>
    <div className="grid gap-3 rounded-2xl border border-border bg-muted/20 p-4 sm:grid-cols-2 lg:grid-cols-4">
      {companyRoles.map((role) => {
        const isDisabled = isPending || disabledRoles.has(role);
        return (
          <label
            key={role}
            className={cn(
              "flex items-center gap-3 rounded-lg border border-border bg-background px-4 py-3 transition-colors",
              isDisabled
                ? "cursor-not-allowed opacity-40"
                : "cursor-pointer hover:bg-muted/40",
            )}
          >
            <Checkbox
              checked={selectedRoles.includes(role)}
              onChange={() => toggleRole(role)}
              disabled={isDisabled}
            />
            <span className="text-sm font-medium text-gray-700">
              {COMPANY_ROLE_LABELS[role]}
            </span>
          </label>
        );
      })}
    </div>
  </section>
);
