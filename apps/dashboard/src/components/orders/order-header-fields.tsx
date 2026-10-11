"use client";

import Link from "next/link";
import { Controller, useFormContext } from "react-hook-form";
import { OrderHeaderInfo } from "@/app/(dashboard)/orders/[uuid]/actions";
import { OrderFormValues } from "@/app/(dashboard)/orders/validation";
import { QuoteSummaryPanel } from "@/components/quotes/quote-summary";
import { Button } from "@/components/shadcn/button";
import { DatePicker } from "@/components/shadcn/date-picker";
import { Input } from "@/components/shadcn/input";
import { Select, SelectOption } from "@/components/shadcn/select";
import { FormFieldError, FormLabel } from "@/components/ui/form-field";
import { FormSelectField } from "@/components/ui/form-select-field";
import { QuoteSummary } from "@/lib/helpers";
import { ClerkUserOption } from "@/lib/server/clerk";

// The reference's own `u/i` beside the consignment duration. No column holds
// it on an order, so it is drawn greyed.
const CONSIGNMENT_UNIT_OPTIONS: SelectOption[] = [{ value: "", label: "u/i" }];

// Printing, mailing and faxing the document tick these, never the seller —
// greyed on the reference.
const SENT_FLAGS = [
  { name: "isPrinted", label: "Printed" },
  { name: "isMailed", label: "Mailed" },
  { name: "isFaxed", label: "Faxed" },
] as const;

type Props = {
  companyOptions: SelectOption[];
  contactOptions: SelectOption[];
  projectOptions: SelectOption[];
  addressOptions: SelectOption[];
  orderMethodOptions: SelectOption[];
  deliveryTermOptions: SelectOption[];
  orderTypeOptions: SelectOption[];
  weightTypeOptions: SelectOption[];
  clerkUsers: ClerkUserOption[];
  isLoadingCompanyData: boolean;
  handleCompanyChange: (uuid: string) => void;
  isPickup: boolean;
  isConsignment: boolean;
  deliveryType: string;
  /** A saved order's customer is fixed: its lines were priced for it. */
  isCustomerLocked: boolean;
  /** The lines were weighed on the weight type, so it locks once there are any. */
  hasLines: boolean;
  /** What only a saved order knows — `Converted from quote …`. */
  header: OrderHeaderInfo | null;
  summary: QuoteSummary;
  summaryNote?: string;
};

/**
 * The top of the reference's order screen (100742, 10-9-2026), group for
 * group: the identity on the left with `Delivery` under it, and on the right
 * the `Order type` block, the flags and the summary. Every field is the form's,
 * so a new order and a saved one are the same header.
 */
export const OrderHeaderFields = ({
  companyOptions,
  contactOptions,
  projectOptions,
  addressOptions,
  orderMethodOptions,
  deliveryTermOptions,
  orderTypeOptions,
  weightTypeOptions,
  clerkUsers,
  isLoadingCompanyData,
  handleCompanyChange,
  isPickup,
  isConsignment,
  deliveryType,
  isCustomerLocked,
  hasLines,
  header,
  summary,
  summaryNote,
}: Props) => {
  const {
    register,
    control,
    watch,
    formState: { errors },
  } = useFormContext<OrderFormValues>();
  const orderType = watch("orderType");

  return (
    <div className="grid gap-x-10 gap-y-6 xl:grid-cols-2">
      <div className="space-y-6">
        {/* Identity */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
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
                  disabled={isCustomerLocked}
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

          <div>
            <FormLabel htmlFor="customerRef">Customer ref.</FormLabel>
            <Input id="customerRef" {...register("customerRef")} />
          </div>

          <div>
            {/* Untranslated in the reference itself — `our reference`. */}
            <FormLabel htmlFor="ourReference">Onze referentie</FormLabel>
            <Input id="ourReference" {...register("ourReference")} />
          </div>

          <FormSelectField
            control={control}
            id="orderMethod"
            name="orderMethod"
            label="Order method"
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
            <FormLabel htmlFor="priceDate">Price date</FormLabel>
            <Controller
              name="priceDate"
              control={control}
              render={({ field }) => (
                <DatePicker
                  id="priceDate"
                  value={field.value ?? ""}
                  onChange={field.onChange}
                />
              )}
            />
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
            <FormLabel htmlFor="orderCategory">Order category</FormLabel>
            <Input id="orderCategory" {...register("orderCategory")} />
          </div>
        </div>

        {/* Delivery */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold">Delivery</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormSelectField
              control={control}
              id="deliveryTerms"
              name="deliveryTerms"
              label="Delivery terms"
              options={deliveryTermOptions}
              emptyValue=""
              disabled={isPickup}
            />

            <FormSelectField
              control={control}
              id="deliveryAddressUuid"
              name="deliveryAddressUuid"
              label="Delivery address"
              options={addressOptions}
              emptyValue=""
              disabled={isPickup || addressOptions.length <= 1}
            />
          </div>

          {orderType === "call_off" ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <FormLabel htmlFor="callOffPeriodFrom">Call-off period</FormLabel>
                <Controller
                  control={control}
                  name="callOffPeriodFrom"
                  render={({ field }) => (
                    <DatePicker
                      id="callOffPeriodFrom"
                      value={field.value ?? ""}
                      onChange={field.onChange}
                    />
                  )}
                />
              </div>
              <div>
                <FormLabel htmlFor="callOffPeriodTo">t/m</FormLabel>
                <Controller
                  control={control}
                  name="callOffPeriodTo"
                  render={({ field }) => (
                    <DatePicker
                      id="callOffPeriodTo"
                      value={field.value ?? ""}
                      onChange={field.onChange}
                    />
                  )}
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-end gap-4">
              <Controller
                control={control}
                name="deliveryType"
                render={({ field }) => (
                  <div className="flex gap-4 pb-2">
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
                  </div>
                )}
              />

              {deliveryType === "date" ? (
                <div>
                  <FormLabel htmlFor="deliveryDate">Date</FormLabel>
                  <Controller
                    name="deliveryDate"
                    control={control}
                    render={({ field }) => (
                      <DatePicker
                        id="deliveryDate"
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        className="w-48"
                      />
                    )}
                  />
                </div>
              ) : (
                <>
                  <div>
                    <FormLabel htmlFor="deliveryWeek">Week</FormLabel>
                    <Input
                      id="deliveryWeek"
                      type="number"
                      min={1}
                      max={53}
                      className="w-20"
                      {...register("deliveryWeek", {
                        setValueAs: (v) =>
                          v === "" ? undefined : parseInt(v, 10),
                      })}
                    />
                    <FormFieldError message={errors.deliveryWeek?.message} />
                  </div>
                  <div>
                    <FormLabel htmlFor="deliveryYear">Year</FormLabel>
                    <Input
                      id="deliveryYear"
                      type="number"
                      min={2000}
                      max={2099}
                      className="w-28"
                      {...register("deliveryYear", {
                        setValueAs: (v) =>
                          v === "" ? undefined : parseInt(v, 10),
                      })}
                    />
                    <FormFieldError message={errors.deliveryYear?.message} />
                  </div>
                </>
              )}

              {/* The reference's delivery-date helper. */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled
                title="Not built: the delivery date helper"
                className="mb-1"
              >
                Keuzehulp
              </Button>
            </div>
          )}

          <div>
            <FormLabel htmlFor="deliveryRemark">Rem</FormLabel>
            <Input id="deliveryRemark" {...register("deliveryRemark")} />
          </div>

          {header && header.sourceQuotes.length > 0 && (
            <p className="text-sm">
              Converted from quote{" "}
              {header.sourceQuotes.map((quote, index) => (
                <span key={quote.uuid}>
                  {index > 0 && ", "}
                  <Link
                    href={`/quotes/${quote.uuid}`}
                    className="text-primary hover:underline"
                  >
                    {quote.id}
                  </Link>
                </span>
              ))}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {/* Order type */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold">Order type</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input type="checkbox" {...register("isPickup")} />
              Pick-up
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input type="checkbox" {...register("isIncidental")} />
              Incidental
            </label>
            {/* Greyed on the reference's orders (108183, 100785): the system
                decides these two, the seller does not tick them. */}
            <label
              className="flex items-center gap-2 text-sm text-muted-foreground"
              title="Set by the system"
            >
              <input
                type="checkbox"
                checked={watch("isInternalProduction")}
                readOnly
                disabled
              />
              Internal production/processing
            </label>
            <label
              className="flex items-center gap-2 text-sm text-muted-foreground"
              title="Set by the system"
            >
              <input
                type="checkbox"
                checked={watch("isCustomerMaterial")}
                readOnly
                disabled
              />
              Klant materiaal
            </label>
          </div>

          {/* Consignment is a term, not a boolean: the duration is always on
              screen and greyed until the box is ticked. */}
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input type="checkbox" {...register("isConsignment")} />
              Consignment with a duration of
            </label>
            <Input
              className="w-28"
              aria-label="Consignment duration"
              disabled={!isConsignment}
              {...register("consignmentDuration")}
            />
            <Select
              className="w-24"
              options={CONSIGNMENT_UNIT_OPTIONS}
              value=""
              disabled
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormSelectField
              control={control}
              id="orderType"
              name="orderType"
              label="Order type"
              options={orderTypeOptions}
            />
            {/* The weight the order is priced on is a choice — `Trade weight`
                beside `Normal` on 100742. */}
            <FormSelectField
              control={control}
              id="weightType"
              name="weightType"
              label="Weight type"
              options={weightTypeOptions}
              emptyValue=""
              disabled={hasLines}
            />
          </div>

          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input type="checkbox" {...register("isOverlength")} />
            Overlength
          </label>
        </div>

        {/* Flags */}
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          {SENT_FLAGS.map((flag) => (
            <label
              key={flag.name}
              className="flex items-center gap-2 text-sm text-muted-foreground"
              title="Set by the system"
            >
              <input
                type="checkbox"
                checked={watch(flag.name)}
                readOnly
                disabled
              />
              {flag.label}
            </label>
          ))}
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input type="checkbox" {...register("handlingBlocked")} />
            Handling blocked
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input type="checkbox" {...register("leaveCustomer")} />
            Leave customer ref.
          </label>
        </div>

        <QuoteSummaryPanel summary={summary} note={summaryNote} />
      </div>
    </div>
  );
};
