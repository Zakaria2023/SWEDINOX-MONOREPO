"use client";

import { ContractFormValues } from "@/app/(dashboard)/contracts/validation";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { Select } from "@/components/shadcn/select";
import { FormLabel } from "@/components/ui/form-field";
import {
  contractDiscountBasedOnTypes,
  contractSurchargePerTypes,
  contractTierUnits,
} from "@/lib/enums";
import {
  COMMON_TEXT,
  CONTRACT_DISCOUNT_BASED_ON_LABELS,
  CONTRACT_SURCHARGE_PER_TYPE_LABELS,
  CONTRACT_TIER_UNIT_LABELS,
} from "@/lib/labels";
import { Plus, X } from "lucide-react";
import { Controller, useFieldArray, useFormContext } from "react-hook-form";

type ContractPriceDetailsSectionProps = {
  isPending: boolean;
};

export const ContractPriceDetailsSection = ({
  isPending,
}: ContractPriceDetailsSectionProps) => {
  const { register, watch, setValue, control } =
    useFormContext<ContractFormValues>();

  const grossPrice = watch("grossPrice");
  const colorSurcharge = watch("colorSurcharge");
  const extraDiscount = watch("extraDiscount");
  const quantitySurcharge = watch("quantitySurcharge");
  const qsTierUnit = watch("quantitySurchargeTierUnit");
  const qsPerType = watch("quantitySurchargePerType");
  const lineDiscount = watch("lineDiscount");
  const ldTierUnit = watch("lineDiscountTierUnit");
  const groupDiscount = watch("groupDiscount");
  const gdTierUnit = watch("groupDiscountTierUnit");
  const gdBasedOn = watch("groupDiscountBasedOn");

  const {
    fields: qsTiers,
    append: appendQsTier,
    remove: removeQsTier,
  } = useFieldArray({ control, name: "quantitySurchargeTiers" });
  const {
    fields: ldTiers,
    append: appendLdTier,
    remove: removeLdTier,
  } = useFieldArray({ control, name: "lineDiscountTiers" });
  const {
    fields: gdTiers,
    append: appendGdTier,
    remove: removeGdTier,
  } = useFieldArray({ control, name: "groupDiscountTiers" });

  const tierUnitOptions = [
    { value: "", label: COMMON_TEXT.emptyOption },
    ...contractTierUnits.map((u) => ({
      value: u,
      label: CONTRACT_TIER_UNIT_LABELS[u],
    })),
  ];

  return (
    <section className="space-y-4">
      <h2 className="border-b pb-2 text-sm font-semibold uppercase tracking-wide text-gray-700">
        Details
      </h2>
      <div className="grid gap-6 lg:grid-cols-2">

        {/* Left: Gross prices, Color surcharge, Extra discount */}
        <div className="space-y-4 rounded-lg border p-4">
          <h3 className="text-sm font-semibold text-gray-700">Gross Prices</h3>

          {/* Gross price */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="grossPrice"
                {...register("grossPrice")}
                className="size-4 accent-primary"
                disabled={isPending}
              />
              <label htmlFor="grossPrice" className="text-sm font-medium text-gray-700">
                Gross price
              </label>
            </div>
            {grossPrice && (
              <div className="ml-6 flex items-center gap-2">
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  {...register("grossPriceValue")}
                  className="w-32"
                  disabled={isPending}
                />
                <span className="text-sm text-muted-foreground">TN</span>
              </div>
            )}
          </div>

          {/* Color surcharge */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="colorSurcharge"
                {...register("colorSurcharge")}
                className="size-4 accent-primary"
                disabled={isPending}
              />
              <label htmlFor="colorSurcharge" className="text-sm font-medium text-gray-700">
                Color surcharge
              </label>
            </div>
            {colorSurcharge && (
              <div className="ml-6 flex items-center gap-2">
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  {...register("colorSurchargeValue")}
                  className="w-32"
                  disabled={isPending}
                />
                <Input
                  placeholder="%"
                  {...register("colorSurchargeUnit")}
                  className="w-16"
                  disabled={isPending}
                />
              </div>
            )}
          </div>

          {/* Extra discount */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="extraDiscount"
                {...register("extraDiscount")}
                className="size-4 accent-primary"
                disabled={isPending}
              />
              <label htmlFor="extraDiscount" className="text-sm font-medium text-gray-700">
                Extra discount
              </label>
            </div>
            {extraDiscount && (
              <div className="ml-6 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-20 shrink-0 text-sm text-gray-600">Discount</span>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    {...register("extraDiscountValue")}
                    className="w-28"
                    disabled={isPending}
                  />
                  <Input
                    placeholder="%"
                    {...register("extraDiscountUnit")}
                    className="w-16"
                    disabled={isPending}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-20 shrink-0 text-sm text-gray-600">From</span>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0"
                    {...register("extraDiscountFromValue")}
                    className="w-28"
                    disabled={isPending}
                  />
                  <Input
                    placeholder="TN"
                    {...register("extraDiscountFromUnit")}
                    className="w-16"
                    disabled={isPending}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Quantity surcharge, Line discount, Group discount */}
        <div className="space-y-4">

          {/* Quantity surcharge */}
          <div className="rounded-lg border p-4 space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="quantitySurcharge"
                {...register("quantitySurcharge")}
                className="size-4 accent-primary"
                disabled={isPending}
              />
              <label htmlFor="quantitySurcharge" className="text-sm font-semibold text-gray-700">
                Quantity Surcharge
              </label>
            </div>
            {quantitySurcharge && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <FormLabel>Tier unit</FormLabel>
                    <Controller
                      name="quantitySurchargeTierUnit"
                      control={control}
                      render={({ field }) => (
                        <Select
                          options={tierUnitOptions}
                          value={field.value ?? ""}
                          onValueChange={(v) => field.onChange(v || undefined)}
                          disabled={isPending}
                        />
                      )}
                    />
                  </div>
                  <div>
                    <FormLabel>Discount unit</FormLabel>
                    <Input
                      placeholder="%"
                      {...register("quantitySurchargeDiscountUnit")}
                      disabled={isPending}
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-1 grid grid-cols-[1fr_1fr_32px] gap-1 text-xs font-medium text-gray-500">
                    <span>From {qsTierUnit ?? "TN"}</span>
                    <span>%</span>
                    <span />
                  </div>
                  {qsTiers.map((tier, i) => (
                    <div key={tier.id} className="mb-1 grid grid-cols-[1fr_1fr_32px] items-center gap-1">
                      <Input
                        type="number"
                        step="0.01"
                        {...register(`quantitySurchargeTiers.${i}.from`, { valueAsNumber: true })}
                        className="h-8 text-sm"
                        disabled={isPending}
                      />
                      <Input
                        type="number"
                        step="0.01"
                        {...register(`quantitySurchargeTiers.${i}.percentage`, { valueAsNumber: true })}
                        className="h-8 text-sm"
                        disabled={isPending}
                      />
                      <button
                        type="button"
                        onClick={() => removeQsTier(i)}
                        className="flex size-8 items-center justify-center text-muted-foreground hover:text-destructive"
                        disabled={isPending}
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => appendQsTier({ from: 0, percentage: 0 })}
                    disabled={isPending}
                    className="mt-1 h-7 text-xs"
                  >
                    <Plus className="mr-1 size-3" /> Add row
                  </Button>
                </div>

                <div>
                  <FormLabel>Toeslag per</FormLabel>
                  <div className="mt-1 space-y-1">
                    {contractSurchargePerTypes.map((type) => (
                      <label key={type} className="flex cursor-pointer items-center gap-2">
                        <input
                          type="radio"
                          className="size-4 accent-primary"
                          checked={qsPerType === type}
                          onChange={() => setValue("quantitySurchargePerType", type)}
                          disabled={isPending}
                        />
                        <span className="text-sm text-gray-700">
                          {CONTRACT_SURCHARGE_PER_TYPE_LABELS[type]}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Line discount */}
          <div className="rounded-lg border p-4 space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="lineDiscount"
                {...register("lineDiscount")}
                className="size-4 accent-primary"
                disabled={isPending}
              />
              <label htmlFor="lineDiscount" className="text-sm font-semibold text-gray-700">
                Line Discount
              </label>
            </div>
            {lineDiscount && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <FormLabel>Tier unit</FormLabel>
                    <Controller
                      name="lineDiscountTierUnit"
                      control={control}
                      render={({ field }) => (
                        <Select
                          options={tierUnitOptions}
                          value={field.value ?? ""}
                          onValueChange={(v) => field.onChange(v || undefined)}
                          disabled={isPending}
                        />
                      )}
                    />
                  </div>
                  <div>
                    <FormLabel>Discount unit</FormLabel>
                    <Input
                      placeholder="%"
                      {...register("lineDiscountDiscountUnit")}
                      disabled={isPending}
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-1 grid grid-cols-[1fr_1fr_32px] gap-1 text-xs font-medium text-gray-500">
                    <span>From {ldTierUnit === "Euro" ? "€" : ldTierUnit ?? "TN"}</span>
                    <span>%</span>
                    <span />
                  </div>
                  {ldTiers.map((tier, i) => (
                    <div key={tier.id} className="mb-1 grid grid-cols-[1fr_1fr_32px] items-center gap-1">
                      <Input
                        type="number"
                        step="0.01"
                        {...register(`lineDiscountTiers.${i}.from`, { valueAsNumber: true })}
                        className="h-8 text-sm"
                        disabled={isPending}
                      />
                      <Input
                        type="number"
                        step="0.01"
                        {...register(`lineDiscountTiers.${i}.percentage`, { valueAsNumber: true })}
                        className="h-8 text-sm"
                        disabled={isPending}
                      />
                      <button
                        type="button"
                        onClick={() => removeLdTier(i)}
                        className="flex size-8 items-center justify-center text-muted-foreground hover:text-destructive"
                        disabled={isPending}
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => appendLdTier({ from: 0, percentage: 0 })}
                    disabled={isPending}
                    className="mt-1 h-7 text-xs"
                  >
                    <Plus className="mr-1 size-3" /> Add row
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Group discount */}
          <div className="rounded-lg border p-4 space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="groupDiscount"
                {...register("groupDiscount")}
                className="size-4 accent-primary"
                disabled={isPending}
              />
              <label htmlFor="groupDiscount" className="text-sm font-semibold text-gray-700">
                Group Discount
              </label>
            </div>
            {groupDiscount && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <FormLabel>Tier unit</FormLabel>
                    <Controller
                      name="groupDiscountTierUnit"
                      control={control}
                      render={({ field }) => (
                        <Select
                          options={tierUnitOptions}
                          value={field.value ?? ""}
                          onValueChange={(v) => field.onChange(v || undefined)}
                          disabled={isPending}
                        />
                      )}
                    />
                  </div>
                  <div>
                    <FormLabel>Discount unit</FormLabel>
                    <Input
                      placeholder="%"
                      {...register("groupDiscountDiscountUnit")}
                      disabled={isPending}
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-1 grid grid-cols-[1fr_1fr_32px] gap-1 text-xs font-medium text-gray-500">
                    <span>From {gdTierUnit === "Euro" ? "€" : gdTierUnit ?? "TN"}</span>
                    <span>%</span>
                    <span />
                  </div>
                  {gdTiers.map((tier, i) => (
                    <div key={tier.id} className="mb-1 grid grid-cols-[1fr_1fr_32px] items-center gap-1">
                      <Input
                        type="number"
                        step="0.01"
                        {...register(`groupDiscountTiers.${i}.from`, { valueAsNumber: true })}
                        className="h-8 text-sm"
                        disabled={isPending}
                      />
                      <Input
                        type="number"
                        step="0.01"
                        {...register(`groupDiscountTiers.${i}.percentage`, { valueAsNumber: true })}
                        className="h-8 text-sm"
                        disabled={isPending}
                      />
                      <button
                        type="button"
                        onClick={() => removeGdTier(i)}
                        className="flex size-8 items-center justify-center text-muted-foreground hover:text-destructive"
                        disabled={isPending}
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => appendGdTier({ from: 0, percentage: 0 })}
                    disabled={isPending}
                    className="mt-1 h-7 text-xs"
                  >
                    <Plus className="mr-1 size-3" /> Add row
                  </Button>
                </div>

                <div>
                  <FormLabel>Korting o.b.v.</FormLabel>
                  <div className="mt-1 space-y-1">
                    {contractDiscountBasedOnTypes.map((type) => (
                      <label key={type} className="flex cursor-pointer items-center gap-2">
                        <input
                          type="radio"
                          className="size-4 accent-primary"
                          checked={gdBasedOn === type}
                          onChange={() => setValue("groupDiscountBasedOn", type)}
                          disabled={isPending}
                        />
                        <span className="text-sm text-gray-700">
                          {CONTRACT_DISCOUNT_BASED_ON_LABELS[type]}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </section>
  );
};
