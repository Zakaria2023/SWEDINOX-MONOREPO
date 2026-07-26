"use client";

import {
  type CompanyRolesData,
  updateCompanyRoles,
} from "@/app/(dashboard)/companies/[uuid]/edit/roles/actions";
import { getDisabledRoles } from "@/app/(dashboard)/companies/[uuid]/edit/roles/helpers";
import {
  companyRolesSchema,
  type CompanyRolesFormValues,
} from "@/app/(dashboard)/companies/[uuid]/edit/roles/validation";
import { Button } from "@/components/shadcn/button";
import { Checkbox } from "@/components/shadcn/checkbox";
import { FormError } from "@/components/ui/form-error";
import { FormFieldError } from "@/components/ui/form-field";
import { type CompanyRole, companyRoles } from "@/lib/enums";
import { cn } from "@/lib/helpers";
import { COMPANY_ROLE_LABELS } from "@/lib/labels";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useActionState } from "react";
import { useForm } from "react-hook-form";

type Props = {
  company: CompanyRolesData;
};

export const CompanyRolesForm = ({ company }: Props) => {
  const [state, dispatch, isPending] = useActionState(updateCompanyRoles, {});

  const {
    watch,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm<CompanyRolesFormValues>({
    resolver: zodResolver(companyRolesSchema),
    defaultValues: {
      roles: company.roles ?? [],
    },
  });

  const selectedRoles = watch("roles") ?? [];
  const disabledRoles = getDisabledRoles(selectedRoles);

  const toggleRole = (role: CompanyRole) => {
    const isSelected = selectedRoles.includes(role);
    if (!isSelected && disabledRoles.has(role)) {
      return;
    }

    setValue(
      "roles",
      isSelected
        ? selectedRoles.filter((r) => r !== role)
        : [...selectedRoles, role],
    );
  };

  const onSubmit = handleSubmit((values) => {
    dispatch({ ...values, companyUuid: company.uuid });
  });

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <FormError>{state.error}</FormError>

      <section className="space-y-4">
        <h2 className="border-b pb-2 text-lg font-semibold text-gray-800">
          Roles
        </h2>
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
        <FormFieldError message={errors.roles?.message} />
      </section>

      <div className="flex gap-3 pb-6">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : "Save Changes"}
        </Button>
        <Link
          href={`/companies/${company.uuid}/edit`}
          className="inline-flex h-9 items-center rounded-lg border border-border px-4 text-sm text-gray-700 transition-colors hover:bg-muted/40"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
};
