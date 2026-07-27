"use client";

import { ContractSelectionValues } from "@/app/(dashboard)/companies/validation";
import { ContractListItem } from "@/app/(dashboard)/contracts/actions";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import { Select } from "@/components/shadcn/select";
import { DialogFormFooter } from "@/components/ui/dialog-form-footer";
import { FormFieldError, FormLabel } from "@/components/ui/form-field";
import { ContractableRole } from "@/lib/enums";
import { CONTRACTABLE_ROLE_LABELS } from "@/lib/labels";
import { FileText } from "lucide-react";
import { FormEventHandler } from "react";
import { Controller, UseFormReturn } from "react-hook-form";

type Props = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onCancel: () => void;
  onSave: FormEventHandler<HTMLFormElement>;
  form: UseFormReturn<ContractSelectionValues>;
  availableContracts: ContractListItem[];
  activeContractableRoles: ContractableRole[];
};

export const ContractDialog = ({
  isOpen,
  onOpenChange,
  onCancel,
  onSave,
  form,
  availableContracts,
  activeContractableRoles,
}: Props) => (
  <Dialog open={isOpen} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <FileText className="size-4" />
          Add Contract
        </DialogTitle>
        <DialogDescription>
          Select an existing contract and assign a role for this company.
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={onSave}>
        <DialogBody className="space-y-4">
          <div>
            <FormLabel htmlFor="ct-contract" required>
              Contract
            </FormLabel>
            <Controller
              name="contractUuid"
              control={form.control}
              render={({ field }) => (
                <Select
                  id="ct-contract"
                  options={[
                    { value: "", label: "Select" },
                    ...availableContracts.map((c) => ({
                      value: c.uuid,
                      label: `${c.code}${c.description ? ` — ${c.description}` : ""}`,
                    })),
                  ]}
                  value={field.value}
                  onValueChange={field.onChange}
                  placeholder="Select"
                />
              )}
            />
            <FormFieldError
              message={form.formState.errors.contractUuid?.message}
            />
          </div>

          <div>
            <FormLabel htmlFor="ct-role" required>
              Role
            </FormLabel>
            {activeContractableRoles.length === 1 ? (
              <div className="mt-1.5 flex items-center gap-1.5">
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                  {CONTRACTABLE_ROLE_LABELS[activeContractableRoles[0]]}
                </span>
              </div>
            ) : (
              <Controller
                name="role"
                control={form.control}
                render={({ field }) => (
                  <Select
                    id="ct-role"
                    options={[
                      { value: "", label: "Select" },
                      ...activeContractableRoles.map((r) => ({
                        value: r,
                        label: CONTRACTABLE_ROLE_LABELS[r],
                      })),
                    ]}
                    value={field.value}
                    onValueChange={field.onChange}
                    placeholder="Select"
                  />
                )}
              />
            )}
            <FormFieldError message={form.formState.errors.role?.message} />
          </div>
        </DialogBody>

        <DialogFormFooter onCancel={onCancel} submitLabel="Add Contract" />
      </form>
    </DialogContent>
  </Dialog>
);
