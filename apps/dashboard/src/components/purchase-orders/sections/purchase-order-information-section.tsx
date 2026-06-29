"use client";

import { Controller, useFormContext } from "react-hook-form";
import { PurchaseOrderFormValues } from "@/app/(dashboard)/purchase-orders/validation";
import { Input } from "@/components/shadcn/input";
import { Select, SelectOption } from "@/components/shadcn/select";
import { FormFieldError, FormLabel } from "@/components/ui/form-field";
import { FormSelectField } from "@/components/ui/form-select-field";

type Props = {
  supplierOptions: SelectOption[];
  agentOptions: SelectOption[];
  contactOptions: SelectOption[];
  isLoadingSupplierData: boolean;
  handleSupplierChange: (uuid: string) => void;
};

export const PurchaseOrderInformationSection = ({
  supplierOptions,
  agentOptions,
  contactOptions,
  isLoadingSupplierData,
  handleSupplierChange,
}: Props) => {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<PurchaseOrderFormValues>();

  return (
    <section className="space-y-4">
      <h2 className="border-b pb-2 text-base font-semibold">
        Purchase Order Information
      </h2>

      <div className="grid grid-cols-2 gap-4">
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
              <Select
                id="supplierUuid"
                value={field.value || ""}
                options={supplierOptions}
                onValueChange={handleSupplierChange}
                invalid={!!errors.supplierUuid}
              />
            )}
          />
          <FormFieldError message={errors.supplierUuid?.message} />
        </div>

        <FormSelectField
          control={control}
          id="agentUuid"
          name="agentUuid"
          label="Agent"
          options={agentOptions}
          emptyValue=""
        />

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
          <FormLabel htmlFor="purchaser">Purchaser</FormLabel>
          <Input id="purchaser" {...register("purchaser")} />
        </div>

        <div>
          <FormLabel htmlFor="reference">Reference</FormLabel>
          <Input id="reference" {...register("reference")} />
        </div>

        <div>
          <FormLabel htmlFor="ourReference">Onze referentie</FormLabel>
          <Input id="ourReference" {...register("ourReference")} />
        </div>

        <div>
          <FormLabel htmlFor="orderCategory">Order Category</FormLabel>
          <Input id="orderCategory" {...register("orderCategory")} />
        </div>
      </div>
    </section>
  );
};
