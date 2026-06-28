"use client";

import { Controller } from "react-hook-form";
import { useOrderSubmit } from "@/app/(dashboard)/orders/use-order-submit";
import { ClerkUserOption } from "@/lib/server/clerk";
import { CompanyOption } from "@/app/(dashboard)/companies/actions";
import { Input } from "@/components/shadcn/input";
import { Textarea } from "@/components/shadcn/textarea";
import { Select } from "@/components/shadcn/select";
import { FormActions } from "@/components/ui/form-actions";
import { FormError } from "@/components/ui/form-error";
import { FormFieldError, FormLabel } from "@/components/ui/form-field";
import { FormSelectField } from "@/components/ui/form-select-field";
import { FormCheckboxCard } from "@/components/ui/form-checkbox-card";

type Props = {
  companies: CompanyOption[];
  clerkUsers: ClerkUserOption[];
};

export const OrderForm = ({ companies, clerkUsers }: Props) => {
  const {
    form,
    isPending,
    onSubmit,
    state,
    isPickup,
    isConsignment,
    deliveryType,
    companyOptions,
    contactOptions,
    projectOptions,
    addressOptions,
    orderMethodOptions,
    deliveryTermOptions,
    weightTypeOptions,
    paymentTermOptions,
    isLoadingCompanyData,
    handleCompanyChange,
    handleCancel,
  } = useOrderSubmit({ companies });

  const {
    register,
    control,
    formState: { errors },
  } = form;

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <FormError>{state.error}</FormError>

      {/* ── Header ────────────────────────────────────────────────────── */}
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

      {/* ── Order Type ────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="border-b pb-2 text-base font-semibold">Order Type</h2>

        <div className="grid grid-cols-3 gap-3">
          <Controller
            control={control}
            name="isPickup"
            render={({ field }) => (
              <FormCheckboxCard
                label="Pick-up"
                checked={field.value}
                active={field.value}
                onChange={(e) => field.onChange(e.target.checked)}
              />
            )}
          />
          <Controller
            control={control}
            name="isIncidental"
            render={({ field }) => (
              <FormCheckboxCard
                label="Incidental"
                checked={field.value}
                active={field.value}
                onChange={(e) => field.onChange(e.target.checked)}
              />
            )}
          />
          <Controller
            control={control}
            name="isInternalProduction"
            render={({ field }) => (
              <FormCheckboxCard
                label="Internal production / processing"
                checked={field.value}
                active={field.value}
                onChange={(e) => field.onChange(e.target.checked)}
              />
            )}
          />
          <Controller
            control={control}
            name="isKlantMateriaal"
            render={({ field }) => (
              <FormCheckboxCard
                label="Klant materiaal"
                checked={field.value}
                active={field.value}
                onChange={(e) => field.onChange(e.target.checked)}
              />
            )}
          />
          <Controller
            control={control}
            name="isOverlengte"
            render={({ field }) => (
              <FormCheckboxCard
                label="Overlengte"
                checked={field.value}
                active={field.value}
                onChange={(e) => field.onChange(e.target.checked)}
              />
            )}
          />
        </div>

        {/* Consignment row */}
        <div className="flex items-center gap-4">
          <Controller
            control={control}
            name="isConsignment"
            render={({ field }) => (
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                />
                Consignment with a duration of
              </label>
            )}
          />
          {isConsignment && (
            <Input
              className="w-32"
              placeholder="e.g. 30 days"
              {...register("consignmentDuration")}
            />
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormSelectField
            control={control}
            id="weightType"
            name="weightType"
            label="Weight type"
            options={weightTypeOptions}
            emptyValue=""
          />

          <div className="flex items-end gap-6 pb-1">
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input type="checkbox" {...register("isPrinted")} />
              Printed
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input type="checkbox" {...register("isMailed")} />
              Mailed
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input type="checkbox" {...register("isFaxed")} />
              Faxed
            </label>
          </div>
        </div>
      </section>

      {/* ── Delivery ──────────────────────────────────────────────────── */}
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
            disabled={isPickup}
          />

          <FormSelectField
            control={control}
            id="deliveryAddressUuid"
            name="deliveryAddressUuid"
            label="Delivery Address"
            options={addressOptions}
            emptyValue=""
            disabled={isPickup || addressOptions.length <= 1}
          />
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
            <Input type="date" className="w-48" {...register("deliveryDate")} />
          ) : (
            <div className="flex items-center gap-2">
              <div>
                <FormLabel htmlFor="deliveryWeek">Week</FormLabel>
                <Input
                  id="deliveryWeek"
                  type="number"
                  min={1}
                  max={53}
                  className="w-20"
                  {...register("deliveryWeek", {
                    setValueAs: (v) => (v === "" ? undefined : parseInt(v, 10)),
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
                    setValueAs: (v) => (v === "" ? undefined : parseInt(v, 10)),
                  })}
                />
                <FormFieldError message={errors.deliveryYear?.message} />
              </div>
            </div>
          )}
        </div>

        <div>
          <FormLabel htmlFor="deliveryRemark">Delivery Remark</FormLabel>
          <Input id="deliveryRemark" {...register("deliveryRemark")} />
        </div>
      </section>

      {/* ── Logistics ─────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="border-b pb-2 text-base font-semibold">Logistics</h2>

        <div className="grid grid-cols-3 gap-3">
          <Controller
            control={control}
            name="completeDelivery"
            render={({ field }) => (
              <FormCheckboxCard
                label="Complete delivery"
                checked={field.value}
                active={field.value}
                onChange={(e) => field.onChange(e.target.checked)}
              />
            )}
          />
          <Controller
            control={control}
            name="transportBlockage"
            render={({ field }) => (
              <FormCheckboxCard
                label="Transport blockage"
                checked={field.value}
                active={field.value}
                onChange={(e) => field.onChange(e.target.checked)}
              />
            )}
          />
          <Controller
            control={control}
            name="vehicleWithCrane"
            render={({ field }) => (
              <FormCheckboxCard
                label="Vehicle with crane required"
                checked={field.value}
                active={field.value}
                onChange={(e) => field.onChange(e.target.checked)}
              />
            )}
          />
          <Controller
            control={control}
            name="vehicleWithCanopy"
            render={({ field }) => (
              <FormCheckboxCard
                label="Vehicle with canopy required"
                checked={field.value}
                active={field.value}
                onChange={(e) => field.onChange(e.target.checked)}
              />
            )}
          />
          <Controller
            control={control}
            name="bundlingSeparate"
            render={({ field }) => (
              <FormCheckboxCard
                label="Bundling separate"
                checked={field.value}
                active={field.value}
                onChange={(e) => field.onChange(e.target.checked)}
              />
            )}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <FormLabel htmlFor="transportRegion">Transport Region</FormLabel>
            <Input id="transportRegion" {...register("transportRegion")} />
          </div>
          <div>
            <FormLabel htmlFor="maxLengthMm">Max. Length (mm)</FormLabel>
            <Input
              id="maxLengthMm"
              type="number"
              {...register("maxLengthMm")}
            />
          </div>
          <div>
            <FormLabel htmlFor="maxBundleWeightKg">
              Max. Bundle Weight (kg)
            </FormLabel>
            <Input
              id="maxBundleWeightKg"
              type="number"
              step="0.01"
              {...register("maxBundleWeightKg")}
            />
          </div>
          <div>
            <FormLabel htmlFor="deliveryAfterTime">Delivery After</FormLabel>
            <Input
              id="deliveryAfterTime"
              type="time"
              {...register("deliveryAfterTime")}
            />
          </div>
          <div>
            <FormLabel htmlFor="deliverForTime">Deliver For</FormLabel>
            <Input
              id="deliverForTime"
              type="time"
              {...register("deliverForTime")}
            />
          </div>
          <div>
            <FormLabel htmlFor="transportMode">Transport Mode</FormLabel>
            <Input id="transportMode" {...register("transportMode")} />
          </div>
        </div>
      </section>

      {/* ── Finances ──────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="border-b pb-2 text-base font-semibold">Finances</h2>

        <div className="grid grid-cols-3 gap-3">
          <Controller
            control={control}
            name="showNetPrice"
            render={({ field }) => (
              <FormCheckboxCard
                label="Show net price"
                checked={field.value}
                active={field.value}
                onChange={(e) => field.onChange(e.target.checked)}
              />
            )}
          />
          <Controller
            control={control}
            name="scrapSurchargeSeparate"
            render={({ field }) => (
              <FormCheckboxCard
                label="Scrap surcharge separately"
                checked={field.value}
                active={field.value}
                onChange={(e) => field.onChange(e.target.checked)}
              />
            )}
          />
          <Controller
            control={control}
            name="calculateVatIfApplicable"
            render={({ field }) => (
              <FormCheckboxCard
                label="Calculate VAT if applicable"
                checked={field.value}
                active={field.value}
                onChange={(e) => field.onChange(e.target.checked)}
              />
            )}
          />
          <Controller
            control={control}
            name="financialBlockage"
            render={({ field }) => (
              <FormCheckboxCard
                label="Financial blockage"
                checked={field.value}
                active={field.value}
                onChange={(e) => field.onChange(e.target.checked)}
              />
            )}
          />
          <Controller
            control={control}
            name="invoiceBlockage"
            render={({ field }) => (
              <FormCheckboxCard
                label="Invoice blockage"
                checked={field.value}
                active={field.value}
                onChange={(e) => field.onChange(e.target.checked)}
              />
            )}
          />
          <Controller
            control={control}
            name="onlyTotalAmountOnInvoice"
            render={({ field }) => (
              <FormCheckboxCard
                label="Only total amount on invoice"
                checked={field.value}
                active={field.value}
                onChange={(e) => field.onChange(e.target.checked)}
              />
            )}
          />
          <Controller
            control={control}
            name="includeOptionPricesInMaterialPrices"
            render={({ field }) => (
              <FormCheckboxCard
                label="Include option prices in material prices"
                checked={field.value}
                active={field.value}
                onChange={(e) => field.onChange(e.target.checked)}
              />
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormSelectField
            control={control}
            id="paymentTerms"
            name="paymentTerms"
            label="Payment Terms"
            options={paymentTermOptions}
            emptyValue=""
          />

          <FormSelectField
            control={control}
            id="billingAddressUuid"
            name="billingAddressUuid"
            label="Billing Address"
            options={addressOptions}
            emptyValue=""
            disabled={addressOptions.length <= 1}
          />

          <div>
            <FormLabel htmlFor="blockingReason">Blocking Reason</FormLabel>
            <Input id="blockingReason" {...register("blockingReason")} />
          </div>
        </div>
      </section>

      {/* ── Remarks ───────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="border-b pb-2 text-base font-semibold">Remarks</h2>
        <Textarea
          id="remarks"
          rows={4}
          placeholder="Additional remarks..."
          {...register("remarks")}
        />
      </section>

      <FormActions
        submitLabel="Create Order"
        pendingLabel="Creating..."
        isPending={isPending}
        onCancel={handleCancel}
      />
    </form>
  );
};
