"use client";

import { CommunicationSettingFormValues } from "@/app/(dashboard)/companies/validation";
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
import { FormFieldError, FormLabel } from "@/components/ui/form-field";
import { MessageSquare } from "lucide-react";
import { FormEventHandler } from "react";
import { Controller, UseFormReturn } from "react-hook-form";

type Props = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onCancel: () => void;
  onSave: FormEventHandler<HTMLFormElement>;
  form: UseFormReturn<CommunicationSettingFormValues>;
  selectedCommType: string;
  setSelectedCommType: (type: string) => void;
  documentTypeOptions: { value: string; label: string }[];
  communicationTypeOptions: { value: string; label: string }[];
  shapeOptions: { value: string; label: string }[];
};

export const CommunicationSettingDialog = ({
  isOpen,
  onOpenChange,
  onCancel,
  onSave,
  form,
  selectedCommType,
  setSelectedCommType,
  documentTypeOptions,
  communicationTypeOptions,
  shapeOptions,
}: Props) => (
  <Dialog open={isOpen} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <MessageSquare className="size-4" />
          Communication Setting
        </DialogTitle>
        <DialogDescription>
          Add a communication setting for this company.
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={onSave}>
        <DialogBody className="space-y-4">
          <div>
            <FormLabel htmlFor="cs-documentType" required>
              Document Type
            </FormLabel>
            <Controller
              name="documentType"
              control={form.control}
              render={({ field }) => (
                <Select
                  id="cs-documentType"
                  options={documentTypeOptions}
                  value={field.value}
                  onValueChange={field.onChange}
                  placeholder="Select"
                />
              )}
            />
            <FormFieldError
              message={form.formState.errors.documentType?.message}
            />
          </div>

          <div>
            <FormLabel htmlFor="cs-communicationType" required>
              Communication Type
            </FormLabel>
            <Controller
              name="communicationType"
              control={form.control}
              render={({ field }) => (
                <Select
                  id="cs-communicationType"
                  options={communicationTypeOptions}
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(value);
                    setSelectedCommType(value);
                    form.setValue("email", "");
                    form.setValue("fax", "");
                  }}
                  placeholder="Select"
                />
              )}
            />
            <FormFieldError
              message={form.formState.errors.communicationType?.message}
            />
          </div>

          <div>
            <FormLabel htmlFor="cs-shape">Shape</FormLabel>
            <Controller
              name="shape"
              control={form.control}
              render={({ field }) => (
                <Select
                  id="cs-shape"
                  options={shapeOptions}
                  value={field.value ?? ""}
                  onValueChange={field.onChange}
                  placeholder="Empty"
                />
              )}
            />
          </div>

          {selectedCommType === "email" && (
            <div>
              <FormLabel htmlFor="cs-email">Email</FormLabel>
              <Input id="cs-email" type="email" {...form.register("email")} />
            </div>
          )}

          {selectedCommType === "fax" && (
            <div>
              <FormLabel htmlFor="cs-fax">Fax</FormLabel>
              <Input id="cs-fax" {...form.register("fax")} />
            </div>
          )}
        </DialogBody>
        <DialogFormFooter onCancel={onCancel} submitLabel="Add Setting" />
      </form>
    </DialogContent>
  </Dialog>
);
