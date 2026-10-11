"use client";

import { Controller, useFormContext } from "react-hook-form";
import { PurchaseRequestFormValues } from "@/app/(dashboard)/purchase-requests/validation";
import { DatePicker } from "@/components/shadcn/date-picker";
import { Input } from "@/components/shadcn/input";
import { SelectOption } from "@/components/shadcn/select";
import { FormLabel } from "@/components/ui/form-field";
import { FormSelectField } from "@/components/ui/form-select-field";
import { cn } from "@/lib/helpers";

type Props = {
  arrangeTransport: boolean;
  pickupDropoffCdPurchases: boolean;
  deliveryTermOptions: SelectOption[];
  deliveryAddressOptions: SelectOption[];
  supplierAddressOptions: SelectOption[];
  handleDeliveryDateChange: (date: string) => void;
};

/**
 * The reference's `Delivery` block on a request, in its order: `Delivery
 * terms · Delivery address`, `Arrange transport` and `Pick up/Drop-off
 * CD-purchases`, the greyed `Supplier address`, then the ⦿ Date / ○ Week block
 * exactly as the purchase order draws it.
 *
 * Mirrored rather than the purchase order's own section: a request keeps its
 * delivery address as one of our own addresses to choose — our yard,
 * `Bolderweg 10, 1332AT, Almere`, by default — where the order shows the yard
 * read-only.
 */
export const PurchaseRequestDeliverySection = ({
  arrangeTransport,
  pickupDropoffCdPurchases,
  deliveryTermOptions,
  deliveryAddressOptions,
  supplierAddressOptions,
  handleDeliveryDateChange,
}: Props) => {
  const { register, control } = useFormContext<PurchaseRequestFormValues>();

  return (
    <section className="space-y-4">
      <h2 className="text-sm font-semibold">Delivery</h2>

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
          id="deliveryAddressUuid"
          name="deliveryAddressUuid"
          label="Delivery address"
          options={deliveryAddressOptions}
          emptyValue=""
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
        {/* Greyed until we arrange the transport ourselves. */}
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

      {/* Greyed in the reference: only a pick-up at the supplier needs their
          address. */}
      <div className="max-w-md">
        <FormSelectField
          control={control}
          id="supplierAddressUuid"
          name="supplierAddressUuid"
          label="Supplier Address"
          options={supplierAddressOptions}
          emptyValue=""
          disabled={
            !arrangeTransport ||
            !pickupDropoffCdPurchases ||
            supplierAddressOptions.length <= 1
          }
        />
      </div>

      {/* ⦿ Date / ○ Week, both always on screen as on the reference, the one
          not chosen greyed. The week and year follow a chosen date. */}
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

              {/* Read-only rather than disabled while Date is chosen, so the
                  week the request was raised in is still saved with it. */}
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
                    readOnly={field.value !== "week"}
                    className={cn(
                      "w-20",
                      field.value !== "week" && "bg-muted text-muted-foreground",
                    )}
                    {...register("deliveryWeek")}
                  />
                </div>
                <div>
                  <FormLabel htmlFor="deliveryYear">Year</FormLabel>
                  <Input
                    id="deliveryYear"
                    type="number"
                    readOnly={field.value !== "week"}
                    className={cn(
                      "w-28",
                      field.value !== "week" && "bg-muted text-muted-foreground",
                    )}
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
