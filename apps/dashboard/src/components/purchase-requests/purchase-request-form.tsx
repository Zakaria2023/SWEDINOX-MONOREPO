"use client";

import { Controller } from "react-hook-form";
import { usePurchaseRequestSubmit } from "@/app/(dashboard)/purchase-requests/use-purchase-request-submit";
import { CompanyOption } from "@/app/(dashboard)/companies/actions";
import { DatePicker } from "@/components/shadcn/date-picker";
import { Input } from "@/components/shadcn/input";
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

export const PurchaseRequestForm = ({ companies, clerkUsers }: Props) => {
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
  } = usePurchaseRequestSubmit({ companies, clerkUsers });

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
          Purchase Request Information
        </h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <FormLabel htmlFor="supplierUuid">
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
            <FormLabel htmlFor="orderCategory">Order Category</FormLabel>
            <Input id="orderCategory" {...register("orderCategory")} />
          </div>

          <div>
            <FormLabel htmlFor="reference">Reference</FormLabel>
            <Input id="reference" {...register("reference")} />
          </div>

          <div>
            <FormLabel htmlFor="ourReference">Onze referentie</FormLabel>
            <Input id="ourReference" {...register("ourReference")} />
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
                <Controller
                  control={control}
                  name="deliveryDate"
                  render={({ field }) => (
                    <DatePicker
                      value={field.value ?? ""}
                      onChange={field.onChange}
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

      {/* ── Follow-up ─────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="border-b pb-2 text-base font-semibold">Follow-up</h2>
        <div className="max-w-xs">
          <FormLabel htmlFor="deadline">Deadline</FormLabel>
          <Controller
            control={control}
            name="deadline"
            render={({ field }) => (
              <DatePicker value={field.value ?? ""} onChange={field.onChange} />
            )}
          />
        </div>
      </section>

      <FormActions
        submitLabel="Create Purchase Request"
        pendingLabel="Creating..."
        isPending={isPending}
        onCancel={handleCancel}
      />
    </form>
  );
};
