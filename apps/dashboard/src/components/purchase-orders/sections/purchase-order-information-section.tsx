"use client";

import { Controller, useFormContext } from "react-hook-form";
import { PurchaseOrderFormValues } from "@/app/(dashboard)/purchase-orders/validation";
import { Input } from "@/components/shadcn/input";
import { SearchSelect } from "@/components/shadcn/search-select";
import { SelectOption } from "@/components/shadcn/select";
import { FormFieldError, FormLabel } from "@/components/ui/form-field";
import { FormSelectField } from "@/components/ui/form-select-field";

type Props = {
  supplierOptions: SelectOption[];
  agentOptions: SelectOption[];
  contactOptions: SelectOption[];
  purchaserOptions: SelectOption[];
  isLoadingSupplierData: boolean;
  handleSupplierChange: (uuid: string) => void;
  handleAgentChange: (uuid: string) => void;
  /** Greyed once a line exists, as the reference greys it. */
  locked: boolean;
};

/**
 * The reference's header, left block: `Supplier · Agent · Contact + Reference
 * · Purchaser · Order category`, in that order.
 */
export const PurchaseOrderInformationSection = ({
  supplierOptions,
  agentOptions,
  contactOptions,
  purchaserOptions,
  isLoadingSupplierData,
  handleSupplierChange,
  handleAgentChange,
  locked,
}: Props) => {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<PurchaseOrderFormValues>();

  return (
    <section className="grid grid-cols-2 gap-x-6 gap-y-3">
      <div>
        <FormLabel htmlFor="supplierUuid" required>
          Supplier
          {isLoadingSupplierData && (
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              Loading...
            </span>
          )}
        </FormLabel>
        <Controller
          control={control}
          name="supplierUuid"
          render={({ field }) => (
            <SearchSelect
              id="supplierUuid"
              value={field.value || ""}
              options={supplierOptions}
              onValueChange={handleSupplierChange}
              invalid={!!errors.supplierUuid}
              disabled={locked}
            />
          )}
        />
        <FormFieldError message={errors.supplierUuid?.message} />
      </div>

      <div>
        <FormLabel htmlFor="agentUuid">Agent</FormLabel>
        <Controller
          control={control}
          name="agentUuid"
          render={({ field }) => (
            <SearchSelect
              id="agentUuid"
              value={field.value || ""}
              options={agentOptions}
              onValueChange={handleAgentChange}
            />
          )}
        />
      </div>

      <FormSelectField
        control={control}
        id="contactUuid"
        name="contactUuid"
        label="Contact"
        options={contactOptions}
        emptyValue=""
        disabled={contactOptions.length <= 1}
      />

      <div>
        <FormLabel htmlFor="reference">Reference</FormLabel>
        <Input id="reference" {...register("reference")} />
      </div>

      <FormSelectField
        control={control}
        id="purchaser"
        name="purchaser"
        label="Purchaser"
        options={purchaserOptions}
        emptyValue=""
      />

      <div>
        <FormLabel htmlFor="orderCategory">Order category</FormLabel>
        <Input id="orderCategory" {...register("orderCategory")} />
      </div>
    </section>
  );
};
