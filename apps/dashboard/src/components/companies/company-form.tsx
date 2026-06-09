"use client";

import {
  getAddressesByCompany,
  type AddressActionResult,
  type AddressListItem,
} from "@/app/(dashboard)/addresses/actions";
import { getCompanyById } from "@/app/(dashboard)/companies/actions";
import { useCompanySubmit } from "@/app/(dashboard)/companies/use-company-submit";
import { AddressForm } from "@/components/addresses/address-form";
import { Button } from "@/components/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import { Input } from "@/components/shadcn/input";
import { Select, type SelectOption } from "@/components/shadcn/select";
import { ErrorMessage } from "@/components/ui/error-message";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Controller } from "react-hook-form";

type CompanyFormProps = {
  companyId?: number;
  mode?: "add" | "edit";
};

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
    address.CompanyAddresses.altName ||
    address.CompanyAddresses.streetAndNo ||
    [address.CompanyAddresses.postalCode, address.CompanyAddresses.city]
      .filter(Boolean)
      .join(" ") ||
    `Address #${address.CompanyAddresses.id}`;
  const secondaryLabel = [
    address.CompanyAddresses.city,
    address.CompanyAddresses.country,
  ]
    .filter(Boolean)
    .join(", ");

  return secondaryLabel && secondaryLabel !== primaryLabel
    ? `${primaryLabel} - ${secondaryLabel}`
    : primaryLabel;
};

export const CompanyForm = ({ companyId, mode = "add" }: CompanyFormProps) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isAddressDialogOpen, setIsAddressDialogOpen] = useState(false);
  const {
    companyUuid,
    form,
    isPending,
    isPersisted,
    onSubmit,
    setCompanyUuid,
    state,
  } = useCompanySubmit({ companyId, mode });
  const {
    control,
    register,
    reset,
    setValue,
    formState: { errors },
  } = form;
  const {
    data: companyDetail,
    isLoading: isCompanyLoading,
    isError: isCompanyError,
  } = useQuery({
    queryKey: ["company", companyId],
    queryFn: () => getCompanyById(companyId!),
    enabled: mode === "edit" && Boolean(companyId),
  });
  const { data: addresses = [], isLoading: isAddressesLoading } = useQuery({
    queryKey: ["company-addresses", companyUuid],
    queryFn: () => getAddressesByCompany(companyUuid!),
    enabled: Boolean(companyUuid),
  });

  useEffect(() => {
    if (!companyDetail) {
      return;
    }

    reset({
      addressId: "",
      companyName: companyDetail.companyName,
    });
    setCompanyUuid(companyDetail.uuid);
  }, [companyDetail, reset, setCompanyUuid]);

  if (mode === "edit" && isCompanyLoading) {
    return <p className="text-sm text-muted-foreground">Loading company...</p>;
  }

  if (mode === "edit" && (isCompanyError || !companyDetail)) {
    return <ErrorMessage message="Company not found." />;
  }

  const addressOptions: SelectOption[] = [
    ...addresses.map((address) => ({
      label: formatAddressLabel(address),
      value: String(address.CompanyAddresses.id),
    })),
    {
      label: "+ Add new address",
      value: NEW_ADDRESS_VALUE,
    },
  ];

  const handleOpenAddressDialog = () => {
    setIsAddressDialogOpen(true);
  };

  const handleAddressCreated = async (result: AddressActionResult) => {
    const effectiveCompanyUuid = companyUuid ?? result.companyUuid;

    if (!effectiveCompanyUuid) {
      setIsAddressDialogOpen(false);
      return;
    }

    if (!companyUuid && result.companyUuid) {
      setCompanyUuid(result.companyUuid);
    }

    await queryClient.invalidateQueries({
      queryKey: ["company-addresses", effectiveCompanyUuid],
    });

    if (result.addressId) {
      setValue("addressId", String(result.addressId), {
        shouldDirty: true,
      });
    }

    setIsAddressDialogOpen(false);
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
                disabled={isPending}
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
                        handleOpenAddressDialog();
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
            {isPending
              ? "Saving..."
              : mode === "edit"
                ? "Save Changes"
                : isPersisted
                  ? "Done"
                  : "Create Company"}
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

      <Dialog open={isAddressDialogOpen} onOpenChange={setIsAddressDialogOpen}>
        <DialogContent className="flex h-[85dvh] max-w-3xl flex-col gap-0 p-0">
          <DialogHeader className="shrink-0 border-b bg-background px-6 py-5">
            <DialogTitle className="flex items-center gap-2">
              <Plus className="size-4" />
              New Address
            </DialogTitle>
            <DialogDescription>
              Add an address for this company.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6">
            <AddressForm
              companyUuid={companyUuid}
              lockCompany={Boolean(companyUuid)}
              cancelLabel="Close"
              submitLabel="Save Address"
              onCancel={() => setIsAddressDialogOpen(false)}
              onSuccess={handleAddressCreated}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
