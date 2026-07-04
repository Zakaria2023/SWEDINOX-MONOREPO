"use client";

import { Controller, useFormContext } from "react-hook-form";
import { PurchaseOrderFormValues } from "@/app/(dashboard)/purchase-orders/validation";
import { Input } from "@/components/shadcn/input";
import { SelectOption } from "@/components/shadcn/select";
import { FormLabel } from "@/components/ui/form-field";
import { FormSelectField } from "@/components/ui/form-select-field";

type Props = {
  arrangeTransport: boolean;
  deliveryType: string;
  deliveryTermOptions: SelectOption[];
  supplierAddressOptions: SelectOption[];
};

export const PurchaseOrderDeliverySection = ({
  arrangeTransport,
  deliveryType,
  deliveryTermOptions,
  supplierAddressOptions,
}: Props) => {
  const { register, control } = useFormContext<PurchaseOrderFormValues>();

  return (
    <section className="space-y-4">
      <h2 className="border-b pb-2 text-base font-semibold">Delivery</h2>

      <div className="grid grid-cols-2 gap-4">
        <FormSelectField
          control={control}
          id="deliveryTerms"
          name="deliveryTerms"
          label="Delivery Terms"
          options={deliveryTermOptions}
          emptyValue=""
        />

        <FormSelectField
          control={control}
          id="supplierAddressUuid"
          name="supplierAddressUuid"
          label="Supplier Address"
          options={supplierAddressOptions}
          emptyValue=""
          disabled={supplierAddressOptions.length <= 1}
        />
      </div>

      <div className="flex flex-wrap items-center gap-6">
        <Controller
          control={control}
          name="arrangeTransport"
          render={({ field }) => (
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={field.value}
                onChange={(e) => field.onChange(e.target.checked)}
              />
              Arrange transport
            </label>
          )}
        />
        {arrangeTransport && (
          <Controller
            control={control}
            name="pickupDropoffCdPurchases"
            render={({ field }) => (
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                />
                Pick up / Drop-off CD-purchases
              </label>
            )}
          />
        )}
      </div>

      {/* Delivery date / week toggle */}
      <div className="space-y-3">
        <FormLabel>Delivery Planned</FormLabel>
        <div className="flex gap-6">
          <Controller
            control={control}
            name="deliveryType"
            render={({ field }) => (
              <>
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="radio"
                    value="date"
                    checked={field.value === "date"}
                    onChange={() => field.onChange("date")}
                  />
                  Date
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="radio"
                    value="week"
                    checked={field.value === "week"}
                    onChange={() => field.onChange("week")}
                  />
                  Week
                </label>
              </>
            )}
          />
        </div>

        {deliveryType === "date" ? (
          <div className="flex items-end gap-3">
            <div>
              <FormLabel htmlFor="deliveryDate">Date</FormLabel>
              <Input
                id="deliveryDate"
                type="date"
                className="w-48"
                {...register("deliveryDate")}
              />
            </div>
            <div>
              <FormLabel htmlFor="deliveryRemark">Rem</FormLabel>
              <Input
                id="deliveryRemark"
                className="w-40"
                {...register("deliveryRemark")}
              />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div>
              <FormLabel htmlFor="deliveryWeek">Week</FormLabel>
              <Input
                id="deliveryWeek"
                type="number"
                min={1}
                max={53}
                className="w-20"
                {...register("deliveryWeek")}
              />
            </div>
            <div>
              <FormLabel htmlFor="deliveryYear">Year</FormLabel>
              <Input
                id="deliveryYear"
                type="number"
                className="w-28"
                {...register("deliveryYear")}
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
