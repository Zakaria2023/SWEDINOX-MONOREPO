"use client";

import { Controller } from "react-hook-form";
import { ContractListItem } from "@/app/(dashboard)/contracts/actions";
import { useNetPriceSubmit } from "@/app/(dashboard)/net-prices/use-net-price-submit";
import { NetPriceFormValues } from "@/app/(dashboard)/net-prices/validation";
import { DatePicker } from "@/components/shadcn/date-picker";
import { Input } from "@/components/shadcn/input";
import { Select, SelectOption } from "@/components/shadcn/select";
import { FormActions } from "@/components/ui/form-actions";
import { FormError } from "@/components/ui/form-error";
import { FormFieldError, FormLabel } from "@/components/ui/form-field";
import { ProductSearchField } from "@/components/ui/product-search-field";
import { salesUnitOptions } from "@/lib/enums";
import { enumOptions } from "@/lib/helpers";
import { CONTRACTABLE_ROLE_LABELS, SALES_UNIT_LABELS } from "@/lib/labels";

const unitOptions = enumOptions(salesUnitOptions, SALES_UNIT_LABELS);

type Props = {
  contracts: ContractListItem[];
  netPriceUuid?: string;
  defaultValues?: NetPriceFormValues;
};

export const NetPriceForm = ({
  contracts,
  netPriceUuid,
  defaultValues,
}: Props) => {
  const { form, isPending, isEditing, onSubmit, state, handleCancel } =
    useNetPriceSubmit({ netPriceUuid, defaultValues });

  const {
    register,
    control,
    formState: { errors },
  } = form;

  const contractOptions: SelectOption[] = [
    { value: "", label: "— Select —" },
    ...contracts.map((contract) => ({
      value: contract.uuid,
      label: `${contract.code} — ${contract.description}${
        contract.role ? ` (${CONTRACTABLE_ROLE_LABELS[contract.role]})` : ""
      }`,
    })),
  ];


  return (
    <form onSubmit={onSubmit} className="max-w-3xl space-y-8">
      <FormError>{state.error}</FormError>

      <section className="space-y-4">
        <h2 className="border-b pb-2 text-base font-semibold">
          What was agreed
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <FormLabel htmlFor="contractUuid" required>
              Contract
            </FormLabel>
            <Controller
              control={control}
              name="contractUuid"
              render={({ field }) => (
                <Select
                  id="contractUuid"
                  value={field.value || ""}
                  options={contractOptions}
                  onValueChange={field.onChange}
                  invalid={!!errors.contractUuid}
                  disabled={isPending}
                />
              )}
            />
            <FormFieldError message={errors.contractUuid?.message} />
          </div>

          <div>
            <FormLabel htmlFor="productUuid" required>
              Product
            </FormLabel>
            {/* A net price is agreed per article, and there are 5 626 of them —
                a dropdown is not a way to find one. */}
            <Controller
              control={control}
              name="productUuid"
              render={({ field }) => (
                <ProductSearchField
                  id="productUuid"
                  value={field.value || ""}
                  sources={["catalogue", "stock"]}
                  invalid={!!errors.productUuid}
                  disabled={isPending}
                  onChange={(choice) => field.onChange(choice.productUuid)}
                />
              )}
            />
            <FormFieldError message={errors.productUuid?.message} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-4">
          <div>
            <FormLabel htmlFor="netPrice" required>
              Net price
            </FormLabel>
            <Input
              id="netPrice"
              type="number"
              step="0.01"
              min="0"
              {...register("netPrice")}
              disabled={isPending}
            />
            <FormFieldError message={errors.netPrice?.message} />
          </div>

          <div>
            <FormLabel htmlFor="netPriceUnit">Net priceU</FormLabel>
            <Controller
              control={control}
              name="netPriceUnit"
              render={({ field }) => (
                <Select
                  id="netPriceUnit"
                  value={field.value || ""}
                  options={unitOptions}
                  onValueChange={field.onChange}
                  disabled={isPending}
                />
              )}
            />
          </div>

          <div>
            <FormLabel htmlFor="fromQty">From quantity</FormLabel>
            <Input
              id="fromQty"
              type="number"
              step="0.001"
              min="0"
              {...register("fromQty")}
              disabled={isPending}
            />
          </div>

          <div>
            <FormLabel htmlFor="fromQtyUnit">FromQtyU</FormLabel>
            <Controller
              control={control}
              name="fromQtyUnit"
              render={({ field }) => (
                <Select
                  id="fromQtyUnit"
                  value={field.value || ""}
                  options={unitOptions}
                  onValueChange={field.onChange}
                  disabled={isPending}
                />
              )}
            />
          </div>
        </div>

        <p className="text-sm text-muted-foreground">
          One row per quantity break: a cheaper price above a quantity is its own
          row, and an order takes the highest break it reaches.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <FormLabel htmlFor="validFrom">Valid from</FormLabel>
            <Controller
              control={control}
              name="validFrom"
              render={({ field }) => (
                <DatePicker
                  id="validFrom"
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  disabled={isPending}
                />
              )}
            />
          </div>
          <div>
            <FormLabel htmlFor="validUntil">Valid u/i</FormLabel>
            <Controller
              control={control}
              name="validUntil"
              render={({ field }) => (
                <DatePicker
                  id="validUntil"
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  disabled={isPending}
                />
              )}
            />
          </div>
        </div>
      </section>

      <FormActions
        submitLabel={isEditing ? "Save net price" : "Add net price"}
        pendingLabel={isEditing ? "Saving..." : "Adding..."}
        isPending={isPending}
        onCancel={handleCancel}
      />
    </form>
  );
};
