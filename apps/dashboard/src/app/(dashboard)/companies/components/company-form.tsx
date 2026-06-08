"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Controller } from "react-hook-form";
import { Plus } from "lucide-react";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { Select, type SelectOption } from "@/components/shadcn/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/shadcn/sheet";
import {
  AddressForm,
} from "../../addresses/components/address-form";
import {
  getAddressesByCompany,
  type AddressActionResult,
  type AddressListItem,
} from "../../addresses/actions";
import { useCompanySubmit } from "../hooks/use-company-submit";

type LabelProps = {
  children: ReactNode;
  htmlFor?: string;
  required?: boolean;
};

type FieldErrorProps = {
  message?: string;
};

const NEW_ADDRESS_VALUE = "__new_address__";

const Label = ({ children, htmlFor, required }: LabelProps) => (
  <label
    htmlFor={htmlFor}
    className="mb-1 block text-sm font-medium text-gray-700"
  >
    {children}
    {required && <span className="ml-1 text-red-500">*</span>}
  </label>
);

const FieldError = ({ message }: FieldErrorProps) =>
  message ? <p className="mt-1 text-sm text-red-600">{message}</p> : null;

const formatAddressLabel = (address: AddressListItem) => {
  const primaryLabel =
    address.altName ||
    address.streetAndNo ||
    [address.postalCode, address.city].filter(Boolean).join(" ") ||
    `Address #${address.id}`;
  const secondaryLabel = [address.city, address.country]
    .filter(Boolean)
    .join(", ");

  return secondaryLabel && secondaryLabel !== primaryLabel
    ? `${primaryLabel} - ${secondaryLabel}`
    : primaryLabel;
};

export const CompanyForm = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isAddressSheetOpen, setIsAddressSheetOpen] = useState(false);
  const {
    companyUuid,
    ensureCompanyCreated,
    form,
    isPending,
    isSaved,
    onSubmit,
    state,
  } = useCompanySubmit();
  const {
    control,
    register,
    setValue,
    formState: { errors },
  } = form;
  const {
    data: addresses = [],
    isLoading: isAddressesLoading,
    refetch: refetchAddresses,
  } = useQuery({
    queryKey: ["company-addresses", companyUuid],
    queryFn: () => getAddressesByCompany(companyUuid!),
    enabled: Boolean(companyUuid),
  });

  const addressOptions: SelectOption[] = [
    ...addresses.map((address) => ({
      label: formatAddressLabel(address),
      value: String(address.id),
    })),
    {
      label: "+ Add new address",
      value: NEW_ADDRESS_VALUE,
    },
  ];

  const handleOpenAddressSheet = async () => {
    const result = await ensureCompanyCreated();

    if (!result.success || !result.companyUuid) {
      return;
    }

    setIsAddressSheetOpen(true);
  };

  const handleAddressCreated = async (result: AddressActionResult) => {
    if (!companyUuid) {
      setIsAddressSheetOpen(false);
      return;
    }

    await queryClient.invalidateQueries({
      queryKey: ["company-addresses", companyUuid],
    });
    await refetchAddresses();

    if (result.addressId) {
      setValue("addressId", String(result.addressId), {
        shouldDirty: true,
      });
    }

    setIsAddressSheetOpen(false);
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
              <Label htmlFor="companyName" required>
                Company Name
              </Label>
              <Input
                id="companyName"
                {...register("companyName")}
                aria-invalid={!!errors.companyName}
                placeholder="Enter the company name"
                disabled={isSaved || isPending}
              />
              <FieldError message={errors.companyName?.message} />
            </div>

            <div>
              <Label htmlFor="addressId">Address</Label>
              <Controller
                control={control}
                name="addressId"
                render={({ field }) => (
                  <Select
                    id="addressId"
                    name={field.name}
                    value={field.value || undefined}
                    options={addressOptions}
                    placeholder={
                      isAddressesLoading
                        ? "Loading addresses..."
                        : "Select or add an address"
                    }
                    disabled={isPending}
                    onValueChange={(value) => {
                      if (value === NEW_ADDRESS_VALUE) {
                        void handleOpenAddressSheet();
                        return;
                      }

                      field.onChange(value);
                    }}
                  />
                )}
              />
            </div>
          </div>
        </section>

        {state.error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3">
            <p className="text-sm text-red-600">{state.error}</p>
          </div>
        )}

        <div className="flex gap-3 pb-6">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving..." : isSaved ? "Done" : "Create Company"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/companies")}
          >
            Cancel
          </Button>
        </div>
      </form>

      <Sheet open={isAddressSheetOpen} onOpenChange={setIsAddressSheetOpen}>
        <SheetContent
          side="right"
          className="w-full overflow-y-auto p-0 data-[side=right]:sm:max-w-4xl"
        >
          <SheetHeader className="border-b bg-background px-6 py-5">
            <SheetTitle className="flex items-center gap-2">
              <Plus className="size-4" />
              New Address
            </SheetTitle>
            <SheetDescription>
              Add an address for the company you just created.
            </SheetDescription>
          </SheetHeader>

          <div className="p-6">
            {companyUuid ? (
              <AddressForm
                companyUuid={companyUuid}
                lockCompany
                cancelLabel="Close"
                submitLabel="Save Address"
                onCancel={() => setIsAddressSheetOpen(false)}
                onSuccess={handleAddressCreated}
              />
            ) : null}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};
