"use client";

import { CompanyFormValues } from "@/app/(dashboard)/companies/validation";
import { AddressForm } from "@/components/companies/address-form";
import { DialogFormFooter } from "@/components/ui/dialog-form-footer";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import { MapPin } from "lucide-react";
import { useFormContext } from "react-hook-form";

type Props = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onCancel: () => void;
  onSave: () => void;
};

export const FirstAddressDialog = ({
  isOpen,
  onOpenChange,
  onCancel,
  onSave,
}: Props) => {
  const { control, formState: { errors }, register, watch } = useFormContext<CompanyFormValues>();

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[85dvh] max-w-3xl flex-col gap-0 p-0">
        <DialogHeader className="shrink-0 border-b bg-background px-6 py-5">
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="size-4" />
            Address
          </DialogTitle>
          <DialogDescription>
            Fill in the address details for this company.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto p-6">
          <AddressForm
            control={control}
            errors={errors.address}
            register={register}
            watch={watch}
          />
        </div>
        <DialogFormFooter
          onCancel={onCancel}
          submitLabel="Save Address"
          onSubmit={onSave}
        />
      </DialogContent>
    </Dialog>
  );
};
