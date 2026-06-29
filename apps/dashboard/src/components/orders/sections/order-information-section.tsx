"use client";

import { Controller, useFormContext } from "react-hook-form";
import { OrderFormValues } from "@/app/(dashboard)/orders/validation";
import { ClerkUserOption } from "@/lib/server/clerk";
import { Input } from "@/components/shadcn/input";
import { Select, SelectOption } from "@/components/shadcn/select";
import { FormFieldError, FormLabel } from "@/components/ui/form-field";
import { FormSelectField } from "@/components/ui/form-select-field";

type Props = {
  companyOptions: SelectOption[];
  contactOptions: SelectOption[];
  orderMethodOptions: SelectOption[];
  projectOptions: SelectOption[];
  clerkUsers: ClerkUserOption[];
  isLoadingCompanyData: boolean;
  handleCompanyChange: (uuid: string) => void;
};

export const OrderInformationSection = ({
  companyOptions,
  contactOptions,
  orderMethodOptions,
  projectOptions,
  clerkUsers,
  isLoadingCompanyData,
  handleCompanyChange,
}: Props) => {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<OrderFormValues>();

  return (
    <section className="space-y-4">
      <h2 className="border-b pb-2 text-base font-semibold">
        Order Information
      </h2>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <FormLabel htmlFor="companyUuid" required>
            Customer
            {isLoadingCompanyData && (
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                Loading...
              </span>
            )}
          </FormLabel>
          <Controller
            control={control}
            name="companyUuid"
            render={({ field }) => (
              <Select
                id="companyUuid"
                value={field.value || ""}
                options={companyOptions}
                onValueChange={handleCompanyChange}
                invalid={!!errors.companyUuid}
              />
            )}
          />
          <FormFieldError message={errors.companyUuid?.message} />
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

        <FormSelectField
          control={control}
          id="orderMethod"
          name="orderMethod"
          label="Order Method"
          options={orderMethodOptions}
          emptyValue=""
        />

        <FormSelectField
          control={control}
          id="seller"
          name="seller"
          label="Seller"
          options={clerkUsers}
          emptyValue=""
        />

        <div>
          <FormLabel htmlFor="customerRef">Customer Ref.</FormLabel>
          <Input id="customerRef" {...register("customerRef")} />
        </div>

        <div>
          <FormLabel htmlFor="ourReference">Our Reference</FormLabel>
          <Input id="ourReference" {...register("ourReference")} />
        </div>

        <FormSelectField
          control={control}
          id="projectUuid"
          name="projectUuid"
          label="Project"
          options={projectOptions}
          emptyValue=""
          disabled={projectOptions.length <= 1}
        />

        <div>
          <FormLabel htmlFor="priceDate">Price Date</FormLabel>
          <Input id="priceDate" type="date" {...register("priceDate")} />
        </div>

        <div>
          <FormLabel htmlFor="orderCategory">Order Category</FormLabel>
          <Input id="orderCategory" {...register("orderCategory")} />
        </div>
      </div>

      <div className="flex gap-6">
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input type="checkbox" {...register("leaveCustomer")} />
          Leave Customer
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input type="checkbox" {...register("handlingBlocked")} />
          Handling Blocked
        </label>
      </div>
    </section>
  );
};
