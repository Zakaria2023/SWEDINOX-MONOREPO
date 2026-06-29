"use client";

import { CompanyOption } from "@/app/(dashboard)/companies/actions";
import {
  ContractableRole,
  contractableRoles,
} from "@/lib/enums";
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
import { COMMON_TEXT, CONTRACTABLE_ROLE_LABELS } from "@/lib/labels";
import { Controller, UseFormReturn } from "react-hook-form";
import { z } from "zod";

const companyLinkSchema = z.object({
  companyUuid: z.string().min(1, "Company is required"),
  startingDate: z.string().optional(),
  endDate: z.string().optional(),
});
export type CompanyLinkFormValues = z.infer<typeof companyLinkSchema>;

const contractableRoleSet = new Set(contractableRoles as readonly string[]);

const getContractableRole = (company: CompanyOption): ContractableRole | null =>
  (company.roles.find((r) => contractableRoleSet.has(r)) as ContractableRole) ??
  null;

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
  const autoRole = selectedCompany
    ? getContractableRole(selectedCompany)
    : null;

  const companyOptions = [
    { value: "", label: COMMON_TEXT.selectPlaceholder },
    ...contractableCompanies.map((c) => ({
      value: c.uuid,
      label: [c.searchCode1, c.companyName].filter(Boolean).join(" — "),
    })),
  ];

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
                    onValueChange={field.onChange}
                    placeholder={COMMON_TEXT.selectPlaceholder}
                  />
                )}
              />
              <FormFieldError
                message={linkForm.formState.errors.companyUuid?.message}
              />
              {autoRole && (
                <div className="mt-1.5 flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground">Role:</span>
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                    {CONTRACTABLE_ROLE_LABELS[autoRole]}
                  </span>
                </div>
              )}
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
              {COMMON_TEXT.cancel}
            </Button>
            <Button type="submit">Add</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
