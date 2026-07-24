"use client";

import { CompanyOption } from "@/app/(dashboard)/companies/actions";
import { Button } from "@/components/shadcn/button";
import { DatePicker } from "@/components/shadcn/date-picker";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import { Select } from "@/components/shadcn/select";
import { FormFieldError, FormLabel } from "@/components/ui/form-field";
import { ContractableRole, contractableRoles } from "@/lib/enums";
import { CONTRACTABLE_ROLE_LABELS } from "@/lib/labels";
import { Controller, UseFormReturn } from "react-hook-form";
import { z } from "zod";

export const companyLinkSchema = z.object({
  companyUuid: z.string().min(1, "Company is required"),
  role: z.enum(contractableRoles, { error: "Role is required" }),
  startingDate: z.string().optional(),
  endDate: z.string().optional(),
});
export type CompanyLinkFormValues = z.infer<typeof companyLinkSchema>;

const contractableRoleSet = new Set(contractableRoles as readonly string[]);

const getContractableRoles = (company: CompanyOption): ContractableRole[] =>
  (company.roles ?? []).filter((r): r is ContractableRole =>
    contractableRoleSet.has(r),
  );

type AddCompanyDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  linkForm: UseFormReturn<CompanyLinkFormValues>;
  onSave: (e: React.FormEvent<HTMLFormElement>) => void;
  contractableCompanies: CompanyOption[];
};

export const AddCompanyDialog = ({
  isOpen,
  onOpenChange,
  linkForm,
  onSave,
  contractableCompanies,
}: AddCompanyDialogProps) => {
  const watchedCompanyUuid = linkForm.watch("companyUuid");
  const selectedCompany = contractableCompanies.find(
    (c) => c.uuid === watchedCompanyUuid,
  );

  const companyOptions = [
    { value: "", label: "Select an option" },
    ...contractableCompanies.map((c) => ({
      value: c.uuid,
      label: [c.searchCode1, c.companyName].filter(Boolean).join(" — "),
    })),
  ];

  // A company can carry several contractable roles (e.g. customer + supplier);
  // the contract is filed under the chosen one, so let the user pick which.
  const roleOptions = (
    selectedCompany ? getContractableRoles(selectedCompany) : []
  ).map((role) => ({ value: role, label: CONTRACTABLE_ROLE_LABELS[role] }));

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Company</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSave}>
          <DialogBody className="space-y-4">
            <div>
              <FormLabel htmlFor="linkCompanyUuid" required>
                Company
              </FormLabel>
              <Controller
                name="companyUuid"
                control={linkForm.control}
                render={({ field }) => (
                  <Select
                    id="linkCompanyUuid"
                    options={companyOptions}
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value);
                      // Default the role to the company's first contractable
                      // role so single-role companies need no extra step.
                      const company = contractableCompanies.find(
                        (c) => c.uuid === value,
                      );
                      const roles = company
                        ? getContractableRoles(company)
                        : [];
                      linkForm.setValue(
                        "role",
                        roles[0] ?? ("" as ContractableRole),
                      );
                    }}
                    placeholder="Select an option"
                  />
                )}
              />
              <FormFieldError
                message={linkForm.formState.errors.companyUuid?.message}
              />
            </div>

            <div>
              <FormLabel htmlFor="linkRole" required>
                Role
              </FormLabel>
              <Controller
                name="role"
                control={linkForm.control}
                render={({ field }) => (
                  <Select
                    id="linkRole"
                    options={roleOptions}
                    value={field.value}
                    onValueChange={field.onChange}
                    placeholder="Select role"
                    disabled={!selectedCompany}
                  />
                )}
              />
              <FormFieldError
                message={linkForm.formState.errors.role?.message}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <FormLabel>Starting Date</FormLabel>
                <Controller
                  name="startingDate"
                  control={linkForm.control}
                  render={({ field }) => (
                    <DatePicker
                      value={field.value ?? ""}
                      onChange={field.onChange}
                    />
                  )}
                />
              </div>
              <div>
                <FormLabel>End Date</FormLabel>
                <Controller
                  name="endDate"
                  control={linkForm.control}
                  render={({ field }) => (
                    <DatePicker
                      value={field.value ?? ""}
                      onChange={field.onChange}
                    />
                  )}
                />
              </div>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Add</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
