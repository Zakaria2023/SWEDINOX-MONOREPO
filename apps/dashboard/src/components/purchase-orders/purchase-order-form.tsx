"use client";

import { Controller } from "react-hook-form";
import { usePurchaseOrderSubmit } from "@/app/(dashboard)/purchase-orders/use-purchase-order-submit";
import { CompanyOption } from "@/app/(dashboard)/companies/actions";
import { Input } from "@/components/shadcn/input";
import { Textarea } from "@/components/shadcn/textarea";
import { Select } from "@/components/shadcn/select";
import { FormActions } from "@/components/ui/form-actions";
import { FormError } from "@/components/ui/form-error";
import { FormFieldError, FormLabel } from "@/components/ui/form-field";
import { FormSelectField } from "@/components/ui/form-select-field";
import { FormCheckboxCard } from "@/components/ui/form-checkbox-card";
import { ClerkUserOption } from "@/lib/server/clerk";

type Props = {
  companies: CompanyOption[];
  clerkUsers: ClerkUserOption[];
};

export const PurchaseOrderForm = ({ companies, clerkUsers }: Props) => {
  const {
    form,
    isPending,
    onSubmit,
    state,
    arrangeTransport,
    deliveryType,
    supplierOptions,
    agentOptions,
    contactOptions,
    supplierAddressOptions,
    purchaseOrderTypeOptions,
    weightTypeOptions,
    deliveryTermOptions,
    paymentTermOptions,
    purchaserOptions,
    isLoadingSupplierData,
    handleSupplierChange,
    handleCancel,
  } = usePurchaseOrderSubmit({ companies, clerkUsers });

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

          <FormSelectField
            control={control}
            id="purchaser"
            name="purchaser"
            label="Purchaser"
            options={purchaserOptions}
            emptyValue=""
          />

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

      {/* ── Purchase Order Type ───────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="border-b pb-2 text-base font-semibold">
          Purchase Order Type
        </h2>

        <div className="grid grid-cols-2 gap-4">
          <FormSelectField
            control={control}
            id="purchaseOrderType"
            name="purchaseOrderType"
            label="Type"
            options={purchaseOrderTypeOptions}
            emptyValue=""
          />

          <FormSelectField
            control={control}
            id="weightType"
            name="weightType"
            label="Weight type"
            options={weightTypeOptions}
            emptyValue=""
          />
        </div>

        <div className="flex flex-wrap gap-4">
          <Controller
            control={control}
            name="isOverlengte"
            render={({ field }) => (
              <FormCheckboxCard
                label="Overlength"
                checked={field.value}
                active={field.value}
                onChange={(e) => field.onChange(e.target.checked)}
              />
            )}
          />
          <Controller
            control={control}
            name="doNotPrintPrices"
            render={({ field }) => (
              <FormCheckboxCard
                label="Do not print prices"
                checked={field.value}
                active={field.value}
                onChange={(e) => field.onChange(e.target.checked)}
              />
            )}
          />
        </div>

        <div className="flex gap-6">
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
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input type="checkbox" {...register("messageSentViaStaalWeb")} />
            Message sent via StaalWeb
          </label>
        </div>
      </section>

      {/* ── Finances ──────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="border-b pb-2 text-base font-semibold">Finances</h2>
        <div className="max-w-sm">
          <FormSelectField
            control={control}
            id="paymentTerms"
            name="paymentTerms"
            label="Payment Terms"
            options={paymentTermOptions}
            emptyValue=""
          />
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
        submitLabel="Create Purchase Order"
        pendingLabel="Creating..."
        isPending={isPending}
        onCancel={handleCancel}
      />
    </form>
  );
};
