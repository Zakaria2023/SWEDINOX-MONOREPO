"use client";

import { ContractForProjectOption } from "@/app/(dashboard)/contracts/actions";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import { Input } from "@/components/shadcn/input";
import { Select } from "@/components/shadcn/select";
import { DialogFormFooter } from "@/components/ui/dialog-form-footer";
import { FormLabel } from "@/components/ui/form-field";
import { FolderOpen } from "lucide-react";
import { FormEventHandler } from "react";
import { Controller, UseFormReturn } from "react-hook-form";

type ProjectFormValues = {
  projectName?: string;
  endDate?: string;
  revenue?: string;
  contractUuid?: string;
};

type Props = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onCancel: () => void;
  onSave: FormEventHandler<HTMLFormElement>;
  form: UseFormReturn<ProjectFormValues>;
  projectContracts: ContractForProjectOption[];
  submitLabel?: string;
};

export const ProjectDialog = ({
  isOpen,
  onOpenChange,
  onCancel,
  onSave,
  form,
  projectContracts,
  submitLabel = "Add Project",
}: Props) => (
  <Dialog open={isOpen} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <FolderOpen className="size-4" />
          Project
        </DialogTitle>
        <DialogDescription>
          Add a project for this customer / prospect.
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={onSave}>
        <DialogBody className="space-y-4">
          <div>
            <FormLabel htmlFor="proj-name">Project Name</FormLabel>
            <Input
              id="proj-name"
              {...form.register("projectName")}
              placeholder="Project name"
            />
          </div>
          <div>
            <FormLabel htmlFor="proj-end">End Date</FormLabel>
            <Input id="proj-end" type="date" {...form.register("endDate")} />
          </div>
          <div>
            <FormLabel htmlFor="proj-revenue">Revenue</FormLabel>
            <Input
              id="proj-revenue"
              {...form.register("revenue")}
              placeholder="Revenue"
            />
          </div>
          <div>
            <FormLabel htmlFor="proj-contract">Contract</FormLabel>
            <Controller
              name="contractUuid"
              control={form.control}
              render={({ field }) => (
                <Select
                  id="proj-contract"
                  options={[
                    { value: "", label: "Empty" },
                    ...projectContracts.map((c) => ({
                      value: c.uuid,
                      label: `${c.code}${c.description ? ` – ${c.description}` : ""}`,
                    })),
                  ]}
                  value={field.value ?? ""}
                  onValueChange={field.onChange}
                  placeholder="Select"
                />
              )}
            />
          </div>
        </DialogBody>
        <DialogFormFooter onCancel={onCancel} submitLabel={submitLabel} />
      </form>
    </DialogContent>
  </Dialog>
);
