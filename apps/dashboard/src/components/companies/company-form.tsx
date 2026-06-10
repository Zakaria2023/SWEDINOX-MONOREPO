"use client";

import { useCompanySubmit } from "@/app/(dashboard)/companies/use-company-submit";
import { AddressForm } from "@/components/companies/address-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { FormActions } from "@/components/ui/form-actions";
import { FormFieldError, FormLabel } from "@/components/ui/form-field";
import { MapPin, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FormError } from "../ui/form-error";

export const CompanyForm = () => {
  const router = useRouter();
  const [isAddressDialogOpen, setIsAddressDialogOpen] = useState(false);
  const { form, isPending, onSubmit, state } = useCompanySubmit();
  const {
    control,
    register,
    watch,
    trigger,
    formState: { errors },
  } = form;

  const addressValues = watch("address");
  const hasAddress = !!(
    addressValues.streetAndNo ||
    addressValues.city ||
    addressValues.altName ||
    addressValues.postalCode
  );

  const handleSaveAddress = async () => {
    const isValid = await trigger("address");
    if (isValid) setIsAddressDialogOpen(false);
  };

  return (
    <>
      <form onSubmit={onSubmit} className="space-y-8">
        <section className="space-y-4">
          <h2 className="border-b pb-2 text-lg font-semibold text-gray-800">
            Company Details
          </h2>
          <div className="grid gap-4 rounded-2xl border border-border bg-muted/20 p-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <FormLabel htmlFor="companyName" required>
                Company Name
              </FormLabel>
              <Input
                id="companyName"
                {...register("companyName")}
                aria-invalid={!!errors.companyName}
                placeholder="Enter the company name"
                disabled={isPending}
              />
              <FormFieldError message={errors.companyName?.message} />
            </div>

            <div className="flex flex-col justify-end">
              {hasAddress ? (
                <div className="flex items-center justify-between gap-2 rounded-lg border border-border bg-background px-3 py-2">
                  <div className="flex min-w-0 items-center gap-2 text-sm">
                    <MapPin className="size-4 shrink-0 text-muted-foreground" />
                    <span className="truncate text-muted-foreground">
                      {[addressValues.streetAndNo, addressValues.city]
                        .filter(Boolean)
                        .join(", ") || addressValues.altName}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAddressDialogOpen(true)}
                    className="shrink-0 text-xs text-primary hover:underline"
                    disabled={isPending}
                  >
                    Edit
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsAddressDialogOpen(true)}
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-dashed border-border px-3 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                  disabled={isPending}
                >
                  <Plus className="size-4" />
                  Add Address
                </button>
              )}
            </div>
          </div>
        </section>

        <FormError>{state.error}</FormError>

        <FormActions
          isPending={isPending}
          onCancel={() => router.push("/companies")}
          submitLabel="Create Company"
        />
      </form>

      <Dialog open={isAddressDialogOpen} onOpenChange={setIsAddressDialogOpen}>
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

          <div className="shrink-0 border-t bg-background px-6 py-4">
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddressDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="button" onClick={handleSaveAddress}>
                Save Address
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
