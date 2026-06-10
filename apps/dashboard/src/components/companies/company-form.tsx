"use client";

import { useCompanySubmit } from "@/app/(dashboard)/companies/use-company-submit";
import {
  companySchema,
  type AddressFormValues,
  type CompanyFormValues,
} from "@/app/(dashboard)/companies/validation";
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
import { zodResolver } from "@hookform/resolvers/zod";
import { MapPin, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { FormError } from "../ui/form-error";

const DEFAULT_ADDRESS: CompanyFormValues["address"] = {
  category: [],
  poBox: false,
  needCrane: false,
  canopyRequired: false,
  bundleSeparately: false,
  addressComplete: false,
  specialTransport: false,
  altName: "",
  streetAndNo: "",
  postalCode: "",
  country: "",
  city: "",
  region: "",
  house: "",
  telephone: "",
  fax: "",
  email: "",
  website: "",
  billingAttention: "",
  billingAttentionAdditional: "",
  gln: "",
  peppolId: "",
  sequenceNumber: "",
  availableAt: "",
  unloadingStartTime: "",
  unloadingEndTime: "",
  maxLength: "",
  maxBundleWeight: "",
  loadingInstructions: "",
};

const addressLabel = (addr: { streetAndNo?: string; city?: string; altName?: string }) =>
  [addr.streetAndNo, addr.city].filter(Boolean).join(", ") || addr.altName || "Address";

export const CompanyForm = () => {
  const router = useRouter();
  const [isFirstAddressDialogOpen, setIsFirstAddressDialogOpen] = useState(false);
  const [isAdditionalAddressDialogOpen, setIsAdditionalAddressDialogOpen] = useState(false);
  const [additionalAddresses, setAdditionalAddresses] = useState<AddressFormValues[]>([]);

  const { form, isPending, onSubmit, state } = useCompanySubmit();
  const {
    control,
    register,
    watch,
    trigger,
    formState: { errors },
  } = form;

  const additionalForm = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      companyName: "",
      address: { ...DEFAULT_ADDRESS, category: ["delivery"] },
    },
  });

  const addressValues = watch("address");

  useEffect(() => {
    if (state.success) router.push("/companies");
  }, [state.success, router]);

  const hasFirstAddress = !!(
    addressValues.streetAndNo ||
    addressValues.city ||
    addressValues.altName ||
    addressValues.postalCode
  );

  const handleSaveFirstAddress = async () => {
    const isValid = await trigger("address");
    if (isValid) setIsFirstAddressDialogOpen(false);
  };

  const handleSaveAdditionalAddress = async () => {
    const isValid = await additionalForm.trigger("address");
    if (!isValid) return;
    const values = additionalForm.getValues("address");
    setAdditionalAddresses((prev) => [...prev, values]);
    additionalForm.reset({ companyName: "", address: { ...DEFAULT_ADDRESS, category: ["delivery"] } });
    setIsAdditionalAddressDialogOpen(false);
  };

  const removeAdditionalAddress = (index: number) => {
    setAdditionalAddresses((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <>
      <form onSubmit={onSubmit(additionalAddresses)} className="space-y-8">
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
              {hasFirstAddress ? (
                <div className="flex items-center justify-between gap-2 rounded-lg border border-border bg-background px-3 py-2">
                  <div className="flex min-w-0 items-center gap-2 text-sm">
                    <MapPin className="size-4 shrink-0 text-muted-foreground" />
                    <span className="truncate text-muted-foreground">
                      {addressLabel(addressValues)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsFirstAddressDialogOpen(true)}
                    className="shrink-0 text-xs text-primary hover:underline"
                    disabled={isPending}
                  >
                    Edit
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsFirstAddressDialogOpen(true)}
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

        {hasFirstAddress && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="border-b pb-2 text-lg font-semibold text-gray-800">
                Additional Delivery Addresses
              </h2>
              <button
                type="button"
                onClick={() => setIsAdditionalAddressDialogOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                disabled={isPending}
              >
                <Plus className="size-4" />
                Add Delivery Address
              </button>
            </div>

            {additionalAddresses.length > 0 && (
              <div className="space-y-2">
                {additionalAddresses.map((addr, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2"
                  >
                    <div className="flex min-w-0 items-center gap-2 text-sm">
                      <MapPin className="size-4 shrink-0 text-muted-foreground" />
                      <span className="truncate text-muted-foreground">
                        {addressLabel(addr)}
                      </span>
                      <span className="shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                        Delivery
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAdditionalAddress(index)}
                      className="shrink-0 text-muted-foreground hover:text-destructive"
                      disabled={isPending}
                    >
                      <X className="size-4" />
                      <span className="sr-only">Remove address</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        <FormError>{state.error}</FormError>

        <FormActions
          isPending={isPending}
          onCancel={() => router.push("/companies")}
          submitLabel="Create Company"
        />
      </form>

      {/* First address dialog — any category */}
      <Dialog open={isFirstAddressDialogOpen} onOpenChange={setIsFirstAddressDialogOpen}>
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
                onClick={() => setIsFirstAddressDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="button" onClick={handleSaveFirstAddress}>
                Save Address
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Additional address dialog — delivery only */}
      <Dialog
        open={isAdditionalAddressDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            additionalForm.reset({ companyName: "", address: { ...DEFAULT_ADDRESS, category: ["delivery"] } });
          }
          setIsAdditionalAddressDialogOpen(open);
        }}
      >
        <DialogContent className="flex h-[85dvh] max-w-3xl flex-col gap-0 p-0">
          <DialogHeader className="shrink-0 border-b bg-background px-6 py-5">
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="size-4" />
              Additional Delivery Address
            </DialogTitle>
            <DialogDescription>
              Additional addresses are restricted to the delivery category.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6">
            <AddressForm
              control={additionalForm.control}
              errors={additionalForm.formState.errors.address}
              register={additionalForm.register}
              watch={additionalForm.watch}
              deliveryOnly
            />
          </div>

          <div className="shrink-0 border-t bg-background px-6 py-4">
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  additionalForm.reset({ companyName: "", address: { ...DEFAULT_ADDRESS, category: ["delivery"] } });
                  setIsAdditionalAddressDialogOpen(false);
                }}
              >
                Cancel
              </Button>
              <Button type="button" onClick={handleSaveAdditionalAddress}>
                Save Address
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
