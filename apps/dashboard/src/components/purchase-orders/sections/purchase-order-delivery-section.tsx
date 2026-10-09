"use client";

import { Controller, useFormContext } from "react-hook-form";
import { YardDeliveryAddress } from "@/app/(dashboard)/purchase-orders/actions";
import { PurchaseOrderFormValues } from "@/app/(dashboard)/purchase-orders/validation";
import { DatePicker } from "@/components/shadcn/date-picker";
import { Input } from "@/components/shadcn/input";
import { SelectOption } from "@/components/shadcn/select";
import { FormLabel } from "@/components/ui/form-field";
import { FormSelectField } from "@/components/ui/form-select-field";

type Props = {
  arrangeTransport: boolean;
  deliveryTermOptions: SelectOption[];
  supplierAddressOptions: SelectOption[];
  yardAddress: YardDeliveryAddress | null;
  handleDeliveryDateChange: (date: string) => void;
};

export const PurchaseOrderDeliverySection = ({
  arrangeTransport,
  deliveryTermOptions,
  supplierAddressOptions,
  yardAddress,
  handleDeliveryDateChange,
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

        {/* Our own yard, prefilled on every blank purchase order — the goods
            come to us unless transport is arranged the other way. */}
        <div>
          <FormLabel htmlFor="deliveryAddress">Delivery address</FormLabel>
          <Input
            id="deliveryAddress"
            readOnly
            value={yardAddress?.label ?? ""}
            placeholder="Set up our own company (role Internal) with a delivery address"
          />
        </div>

        {/* Greyed until transport is arranged: only then does it matter where
            the supplier's goods are collected from. */}
        <FormSelectField
          control={control}
          id="supplierAddressUuid"
          name="supplierAddressUuid"
          label="Supplier Address"
          options={supplierAddressOptions}
          emptyValue=""
          disabled={!arrangeTransport || supplierAddressOptions.length <= 1}
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
        <Controller
          control={control}
          name="pickupDropoffCdPurchases"
          render={({ field }) => (
            <label
              className={
                arrangeTransport
                  ? "flex cursor-pointer items-center gap-2 text-sm"
                  : "flex items-center gap-2 text-sm text-muted-foreground"
              }
            >
              <input
                type="checkbox"
                disabled={!arrangeTransport}
                checked={field.value}
                onChange={(e) => field.onChange(e.target.checked)}
              />
              Pick up / Drop-off CD-purchases
            </label>
          )}
        />
      </div>

      {/* ⦿ Date / ○ Week, both always on screen as on the reference, the
          one not chosen greyed. The week and year follow a chosen date. */}
      <div className="space-y-3">
        <FormLabel>Delivery Planned</FormLabel>
        <Controller
          control={control}
          name="deliveryType"
          render={({ field }) => (
            <div className="space-y-3">
              <div className="flex items-end gap-3">
                <label className="flex w-20 cursor-pointer items-center gap-2 pb-2 text-sm">
                  <input
                    type="radio"
                    value="date"
                    checked={field.value === "date"}
                    onChange={() => field.onChange("date")}
                  />
                  Date
                </label>
                <div>
                  <FormLabel htmlFor="deliveryDate">Date</FormLabel>
                  <Controller
                    name="deliveryDate"
                    control={control}
                    render={({ field: dateField }) => (
                      <DatePicker
                        id="deliveryDate"
                        value={dateField.value ?? ""}
                        onChange={handleDeliveryDateChange}
                        disabled={field.value !== "date"}
                        className="w-48"
                      />
                    )}
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

              <div className="flex items-end gap-3">
                <label className="flex w-20 cursor-pointer items-center gap-2 pb-2 text-sm">
                  <input
                    type="radio"
                    value="week"
                    checked={field.value === "week"}
                    onChange={() => field.onChange("week")}
                  />
                  Week
                </label>
                <div>
                  <FormLabel htmlFor="deliveryWeek">Week</FormLabel>
                  <Input
                    id="deliveryWeek"
                    type="number"
                    min={1}
                    max={53}
                    className="w-20"
                    disabled={field.value !== "week"}
                    {...register("deliveryWeek")}
                  />
                </div>
                <div>
                  <FormLabel htmlFor="deliveryYear">Year</FormLabel>
                  <Input
                    id="deliveryYear"
                    type="number"
                    className="w-28"
                    disabled={field.value !== "week"}
                    {...register("deliveryYear")}
                  />
                </div>
              </div>
            </div>
          )}
        />
      </div>
    </section>
  );
};
