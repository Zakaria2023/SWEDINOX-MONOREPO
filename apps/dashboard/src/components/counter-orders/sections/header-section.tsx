"use client";

import { CounterOrderFormValues } from "@/app/(dashboard)/counter-orders/validation";
import { DatePicker } from "@/components/shadcn/date-picker";
import { Input } from "@/components/shadcn/input";
import { SelectOption } from "@/components/shadcn/select";
import { FormLabel } from "@/components/ui/form-field";
import { FormSelectField } from "@/components/ui/form-select-field";
import { Controller, useFormContext } from "react-hook-form";

type Props = {
  isPending: boolean;
  companyOptions: SelectOption[];
  contactOptions: SelectOption[];
  hasContacts: boolean;
  orderMethodOptions: SelectOption[];
  sellerOptions: SelectOption[];
  statusOptions: SelectOption[];
  priorityOptions: SelectOption[];
  onCompanyChange: (value: string) => void;
};

export const HeaderSection = ({
  isPending,
  companyOptions,
  contactOptions,
  hasContacts,
  orderMethodOptions,
  sellerOptions,
  statusOptions,
  priorityOptions,
  onCompanyChange,
}: Props) => {
  const form = useFormContext<CounterOrderFormValues>();
  const { control, register } = form;

  return (
    <section className="space-y-4">
      <h2 className="border-b pb-2 text-lg font-semibold text-gray-800">
        Counter Order
      </h2>
      <div className="grid gap-4 rounded-2xl border border-border bg-muted/20 p-4 md:grid-cols-2">
        <FormSelectField
          control={control}
          id="companyUuid"
          name="companyUuid"
          label="Customer"
          options={companyOptions}
          emptyValue=""
          disabled={isPending}
          required
          errorMessage={form.formState.errors.companyUuid?.message}
          onValueChange={onCompanyChange}
        />

        <FormSelectField
          control={control}
          id="contactUuid"
          name="contactUuid"
          label="Contact"
          options={contactOptions}
          emptyValue=""
          disabled={isPending || !hasContacts}
        />

        <div>
          <FormLabel htmlFor="customerRef">Customer ref.</FormLabel>
          <Input
            id="customerRef"
            {...register("customerRef")}
            disabled={isPending}
          />
        </div>

        <div>
          <FormLabel htmlFor="ourReference">Our reference</FormLabel>
          <Input
            id="ourReference"
            {...register("ourReference")}
            disabled={isPending}
          />
        </div>

        <FormSelectField
          control={control}
          id="orderMethod"
          name="orderMethod"
          label="Order method"
          options={orderMethodOptions}
          emptyValue=""
          disabled={isPending}
        />

        <FormSelectField
          control={control}
          id="seller"
          name="seller"
          label="Seller"
          options={sellerOptions}
          emptyValue=""
          disabled={isPending}
        />

        <FormSelectField
          control={control}
          id="status"
          name="status"
          label="Status"
          options={statusOptions}
          disabled={isPending}
        />

        <FormSelectField
          control={control}
          id="priority"
          name="priority"
          label="Priority"
          options={priorityOptions}
          disabled={isPending}
        />

        <div>
          <FormLabel htmlFor="orderDate">Order date</FormLabel>
          <Controller
            name="orderDate"
            control={control}
            render={({ field }) => (
              <DatePicker
                value={field.value ?? ""}
                onChange={field.onChange}
                disabled={isPending}
              />
            )}
          />
        </div>

        <div>
          <FormLabel htmlFor="priceDate">Price date</FormLabel>
          <Controller
            name="priceDate"
            control={control}
            render={({ field }) => (
              <DatePicker
                value={field.value ?? ""}
                onChange={field.onChange}
                disabled={isPending}
              />
            )}
          />
        </div>
      </div>
    </section>
  );
};
