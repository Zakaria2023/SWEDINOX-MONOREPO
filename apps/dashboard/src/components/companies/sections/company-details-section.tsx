"use client";

import { AddressFormValues, CompanyFormValues } from "@/app/(dashboard)/companies/validation";
import { CommSettingInput } from "@/app/(dashboard)/companies/actions";
import { Input } from "@/components/shadcn/input";
import { Textarea } from "@/components/shadcn/textarea";
import { FormFieldError, FormLabel } from "@/components/ui/form-field";
import { FormSelectField } from "@/components/ui/form-select-field";
import { COMMON_TEXT, COMMUNICATION_SETTING_SHAPE_LABELS, ADDRESS_CATEGORY_LABELS } from "@/lib/labels";
import { MapPin, MessageSquare, Plus, X } from "lucide-react";
import { useFormContext } from "react-hook-form";

type Props = {
  isPending: boolean;
  hasFirstAddress: boolean;
  addressValues: AddressFormValues;
  addressLabel: (address: { streetAndNo?: string; city?: string; altName?: string }) => string;
  additionalAddresses: AddressFormValues[];
  setIsFirstAddressDialogOpen: (open: boolean) => void;
  removeAdditionalAddress: (index: number) => void;
  handleAdditionalAddressOpenChange: (open: boolean) => void;
  communicationSettings: CommSettingInput[];
  commSettingLabel: (setting: CommSettingInput) => string;
  removeCommSetting: (index: number) => void;
  handleOpenCommSetting: () => void;
  langOptions: { value: string; label: string }[];
};

export const CompanyDetailsSection = ({
  isPending,
  hasFirstAddress,
  addressValues,
  addressLabel,
  additionalAddresses,
  setIsFirstAddressDialogOpen,
  removeAdditionalAddress,
  handleAdditionalAddressOpenChange,
  communicationSettings,
  commSettingLabel,
  removeCommSetting,
  handleOpenCommSetting,
  langOptions,
}: Props) => {
  const { register, control, formState: { errors } } = useFormContext<CompanyFormValues>();

  return (
    <section className="space-y-4">
      <h2 className="border-b pb-2 text-lg font-semibold text-gray-800">
        Company Details
      </h2>
      <div className="space-y-4 rounded-2xl border border-border bg-muted/20 p-4">
        <div className="grid gap-4 lg:grid-cols-3">
          <div>
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

          <FormSelectField
            control={control}
            id="lang"
            name="lang"
            label="Language"
            options={langOptions}
            emptyValue=""
            disabled={isPending}
          />

          <div>
            <FormLabel htmlFor="correspName">Corresp. Name</FormLabel>
            <Input
              id="correspName"
              {...register("correspName")}
              disabled={isPending}
            />
          </div>
        </div>

        <div>
          <FormLabel htmlFor="remarks">Remarks</FormLabel>
          <Textarea
            id="remarks"
            {...register("remarks")}
            rows={3}
            placeholder="Any additional remarks..."
            disabled={isPending}
          />
        </div>

        <div className="space-y-2">
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
                {COMMON_TEXT.edit}
              </button>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setIsFirstAddressDialogOpen(true)}
                className="inline-flex h-9 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border px-3 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                disabled={isPending}
              >
                <Plus className="size-4" />
                Add Address
              </button>
              {errors.address && (
                <p className="text-sm text-destructive">
                  Please add at least one address.
                </p>
              )}
            </>
          )}

          {additionalAddresses.map((address, index) => (
            <div
              key={index}
              className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2"
            >
              <div className="flex min-w-0 items-center gap-2 text-sm">
                <MapPin className="size-4 shrink-0 text-muted-foreground" />
                <span className="truncate text-muted-foreground">
                  {addressLabel(address)}
                </span>
                {address.category.map((cat) => (
                  <span
                    key={cat}
                    className="shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700"
                  >
                    {ADDRESS_CATEGORY_LABELS[cat]}
                  </span>
                ))}
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

          {hasFirstAddress && (
            <button
              type="button"
              onClick={() => handleAdditionalAddressOpenChange(true)}
              className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border px-3 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
              disabled={isPending}
            >
              <Plus className="size-4" />
              Add Address
            </button>
          )}
        </div>

        <div className="space-y-2">
          {communicationSettings.map((setting, index) => (
            <div
              key={index}
              className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2"
            >
              <div className="flex min-w-0 items-center gap-2 text-sm">
                <MessageSquare className="size-4 shrink-0 text-muted-foreground" />
                <span className="truncate text-muted-foreground">
                  {commSettingLabel(setting)}
                </span>
                {setting.shape && (
                  <span className="shrink-0 rounded-full bg-purple-100 px-2 py-0.5 text-xs text-purple-700">
                    {COMMUNICATION_SETTING_SHAPE_LABELS[setting.shape]}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => removeCommSetting(index)}
                className="shrink-0 text-muted-foreground hover:text-destructive"
                disabled={isPending}
              >
                <X className="size-4" />
                <span className="sr-only">
                  Remove communication setting
                </span>
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={handleOpenCommSetting}
            className="inline-flex h-9 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border px-3 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
            disabled={isPending}
          >
            <Plus className="size-4" />
            Add Communication Setting
          </button>
        </div>
      </div>
    </section>
  );
};
