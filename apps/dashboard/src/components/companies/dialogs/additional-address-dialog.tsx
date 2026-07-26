"use client";

import { CompanyFormValues } from "@/app/(dashboard)/companies/validation";
import { AddressForm } from "@/components/companies/address-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import { DialogFormFooter } from "@/components/ui/dialog-form-footer";
import { AddressCategory } from "@/lib/enums";
import { MapPin } from "lucide-react";
import { UseFormReturn } from "react-hook-form";

type Props = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onCancel: () => void;
  onSave: () => void;
  form: UseFormReturn<CompanyFormValues>;
  availableForNext: AddressCategory[];
  submitLabel?: string;
};

export const AdditionalAddressDialog = ({
  isOpen,
  onOpenChange,
  onCancel,
  onSave,
  form,
  availableForNext,
  submitLabel = "Save Address",
}: Props) => (
  <Dialog open={isOpen} onOpenChange={onOpenChange}>
    <DialogContent className="flex h-[85dvh] max-w-3xl flex-col gap-0 p-0">
      <DialogHeader className="shrink-0 border-b bg-background px-6 py-5">
        <DialogTitle className="flex items-center gap-2">
          <MapPin className="size-4" />
          Address
        </DialogTitle>
        <DialogDescription>
          Fill in the address details. Categories already assigned to another
          address are not available.
        </DialogDescription>
      </DialogHeader>
      <div className="flex-1 overflow-y-auto p-6">
        <AddressForm
          control={form.control}
          errors={form.formState.errors.address}
          register={form.register}
          watch={form.watch}
          availableCategories={availableForNext}
        />
      </div>
      <DialogFormFooter
        onCancel={onCancel}
        submitLabel={submitLabel}
        onSubmit={onSave}
      />
    </DialogContent>
  </Dialog>
);
