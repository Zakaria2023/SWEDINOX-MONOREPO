"use client";

import {
  getAddressesByCompany,
  type AddressActionResult,
  type AddressListItem,
} from "@/app/(dashboard)/addresses/actions";
import { type CompanyDetail } from "@/app/(dashboard)/companies/actions";
import { useCompanySubmit } from "@/app/(dashboard)/companies/use-company-submit";
import { AddressForm } from "@/components/addresses/address-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import { Input } from "@/components/shadcn/input";
import { type SelectOption } from "@/components/shadcn/select";
import { FormActions } from "@/components/ui/form-actions";
import { ErrorMessage } from "@/components/ui/error-message";
import { FormFieldError, FormLabel } from "@/components/ui/form-field";
import { FormSelectField } from "@/components/ui/form-select-field";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FormError } from "../ui/form-error";

type CompanyFormProps = {
  companyId?: number;
  initialAddresses?: AddressListItem[];
  initialCompany?: CompanyDetail | null;
  mode?: "add" | "edit";
};

const NEW_ADDRESS_VALUE = "__new_address__";

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

export const CompanyForm = ({
  companyId,
  initialAddresses = [],
  initialCompany,
  mode = "add",
}: CompanyFormProps) => {
  const router = useRouter();
  const [addresses, setAddresses] = useState(initialAddresses);
  const [addressLoadError, setAddressLoadError] = useState("");
  const [isAddressDialogOpen, setIsAddressDialogOpen] = useState(false);
  const [isAddressesLoading, setIsAddressesLoading] = useState(false);
  const {
    companyUuid,
    ensureCompanyCreated,
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
    watch,
    formState: { errors },
  } = form;

  useEffect(() => {
    if (!initialCompany) {
      return;
    }

    reset({
      addressId: "",
      companyName: initialCompany.companyName,
    });
    setCompanyUuid(initialCompany.uuid);
  }, [initialCompany, reset, setCompanyUuid]);

  useEffect(() => {
    setAddresses(initialAddresses);
  }, [initialAddresses]);

  if (mode === "edit" && !initialCompany) {
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

  const handleOpenAddressDialog = async () => {
    setAddressLoadError("");

    const result = await ensureCompanyCreated();

    if (!result.success || !result.companyUuid) {
      return;
    }

    if (!companyUuid) {
      setCompanyUuid(result.companyUuid);
    }

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

    setIsAddressesLoading(true);
    setAddressLoadError("");

    try {
      const nextAddresses = await getAddressesByCompany(effectiveCompanyUuid);
      setAddresses(nextAddresses);

      if (result.addressId) {
        setValue("addressId", String(result.addressId), {
          shouldDirty: true,
        });
      }
    } catch (error) {
      console.error("Failed to refresh company addresses", error);
      setAddressLoadError(
        "Address saved, but the list could not be refreshed.",
      );
    } finally {
      setIsAddressesLoading(false);
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

            <div>
              <FormSelectField
                control={control}
                id="addressId"
                label="Address"
                name="addressId"
                options={addressOptions}
                placeholder={
                  isAddressesLoading
                    ? "Loading addresses..."
                    : "Select or add an address"
                }
                disabled={isPending}
                onValueChange={(value, fieldOnChange) => {
                  if (value === NEW_ADDRESS_VALUE) {
                    void handleOpenAddressDialog();
                    return;
                  }

                  fieldOnChange(value);
                }}
              />
            </div>
          </div>
        </section>

        <FormError>{state.error}</FormError>

        {addressLoadError && <ErrorMessage message={addressLoadError} />}

        <FormActions
          isPending={isPending}
          onCancel={() => router.push("/companies")}
          submitLabel={
            mode === "edit"
              ? "Save Changes"
              : isPersisted
                ? "Done"
                : "Create Company"
          }
        />
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
              lockedCompanyName={watch("companyName")}
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
