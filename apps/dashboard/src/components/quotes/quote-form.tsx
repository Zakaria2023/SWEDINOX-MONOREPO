"use client";

import { Controller } from "react-hook-form";
import { useQuoteSubmit } from "@/app/(dashboard)/quotes/use-quote-submit";
import { ClerkUserOption } from "@/lib/server/clerk";
import { CompanyOption } from "@/app/(dashboard)/companies/actions";
import { ContractForProjectOption } from "@/app/(dashboard)/contracts/actions";
import { ProductPricingOption } from "@/app/(dashboard)/products/actions";
import { QuoteFormValues } from "@/app/(dashboard)/quotes/validation";
import { Input } from "@/components/shadcn/input";
import { Textarea } from "@/components/shadcn/textarea";
import { Select } from "@/components/shadcn/select";
import { DocumentUploader } from "@/components/document-uploader";
import { QuoteLinesEditor } from "@/components/quotes/quote-lines-editor";
import { QuoteSummaryPanel } from "@/components/quotes/quote-summary";
import { QuoteSurchargesSection } from "@/components/quotes/sections/surcharges-section";
import { FormActions } from "@/components/ui/form-actions";
import { FormError } from "@/components/ui/form-error";
import { FormFieldError, FormLabel } from "@/components/ui/form-field";
import { FormSelectField } from "@/components/ui/form-select-field";
import { FormCheckboxCard } from "@/components/ui/form-checkbox-card";

type Props = {
  companies: CompanyOption[];
  clerkUsers: ClerkUserOption[];
  contracts: ContractForProjectOption[];
  products: ProductPricingOption[];
  /** Set when editing an existing quote; omitted when creating one. */
  quoteUuid?: string;
  defaultValues?: QuoteFormValues;
};

export const QuoteForm = ({
  companies,
  clerkUsers,
  contracts,
  products,
  quoteUuid,
  defaultValues,
}: Props) => {
  const {
    form,
    isPending,
    onSubmit,
    state,
    summary,
    isEditing,
    isPickup,
    isConsignment,
    deliveryType,
    companyOptions,
    contactOptions,
    projectOptions,
    contractOptions,
    addressOptions,
    requestMethodOptions,
    deliveryTermOptions,
    weightTypeOptions,
    paymentTermOptions,
    isLoadingCompanyData,
    handleCompanyChange,
    handleCancel,
  } = useQuoteSubmit({
    companies,
    contracts,
    products,
    quoteUuid,
    defaultValues,
  });

  const {
    register,
    control,
    watch,
    setValue,
    formState: { errors },
  } = form;

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <FormError>{state.error}</FormError>

      {/* ── Quote ─────────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="border-b pb-2 text-base font-semibold">Quote</h2>

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

          <div>
            <FormLabel htmlFor="customerRef">Customer Ref.</FormLabel>
            <Input id="customerRef" {...register("customerRef")} />
          </div>

          <div>
            <FormLabel htmlFor="ourReference">Our reference</FormLabel>
            <Input id="ourReference" {...register("ourReference")} />
          </div>

          <FormSelectField
            control={control}
            id="requestMethod"
            name="requestMethod"
            label="Request"
            options={requestMethodOptions}
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

          <FormSelectField
            control={control}
            id="projectUuid"
            name="projectUuid"
            label="Project"
            options={projectOptions}
            emptyValue=""
            disabled={projectOptions.length <= 1}
          />

          <FormSelectField
            control={control}
            id="contractUuid"
            name="contractUuid"
            label="Contract"
            options={contractOptions}
            emptyValue=""
          />

          <div>
            <FormLabel htmlFor="priceDate">Price date</FormLabel>
            <Input id="priceDate" type="date" {...register("priceDate")} />
          </div>

          <div>
            <FormLabel htmlFor="decisionDate">Decision date</FormLabel>
            <Input
              id="decisionDate"
              type="date"
              {...register("decisionDate")}
            />
          </div>

          <div>
            <FormLabel htmlFor="quoteDate">Quote date</FormLabel>
            <Input id="quoteDate" type="date" {...register("quoteDate")} />
          </div>

          <div>
            <FormLabel htmlFor="validityPeriodDays">
              Validity period (calendar days)
            </FormLabel>
            <Input
              id="validityPeriodDays"
              type="number"
              min={0}
              {...register("validityPeriodDays")}
            />
          </div>

          <div>
            <FormLabel htmlFor="validUntil">Valid u/i</FormLabel>
            <Input id="validUntil" type="date" {...register("validUntil")} />
          </div>
        </div>

        <div className="flex gap-6">
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input type="checkbox" {...register("leaveCustomerRef")} />
            Leave customer reference
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input type="checkbox" {...register("handlingBlocked")} />
            Handling blocked
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
            name="isCustomerMaterial"
            render={({ field }) => (
              <FormCheckboxCard
                label="Customer material"
                checked={field.value}
                active={field.value}
                onChange={(e) => field.onChange(e.target.checked)}
              />
            )}
          />
          <Controller
            control={control}
            name="isOverlength"
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
            <>
              <Input
                className="w-32"
                placeholder="e.g. Normal"
                {...register("consignmentDuration")}
              />
              <div>
                <FormLabel htmlFor="consignmentDurationUnit">u/i</FormLabel>
                <Input
                  id="consignmentDurationUnit"
                  className="w-32"
                  {...register("consignmentDurationUnit")}
                />
              </div>
            </>
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
            name="doNotShowTotalAmount"
            render={({ field }) => (
              <FormCheckboxCard
                label="Do not show total amount"
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
            label="Payment terms"
            options={paymentTermOptions}
            emptyValue=""
          />

          <FormSelectField
            control={control}
            id="billingAddressUuid"
            name="billingAddressUuid"
            label="Billing address"
            options={addressOptions}
            emptyValue=""
            disabled={addressOptions.length <= 1}
          />

          <div>
            <FormLabel htmlFor="blockingReason">Blocking reason</FormLabel>
            <Input id="blockingReason" {...register("blockingReason")} />
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

      {/* ── Follow-up ─────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="border-b pb-2 text-base font-semibold">Follow-up</h2>
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input type="checkbox" {...register("expired")} />
          Expired
        </label>
      </section>

      {/* ── Lines ─────────────────────────────────────────────────────── */}
      <QuoteLinesEditor
        control={control}
        products={products}
        isPickup={isPickup}
      />

      {/* ── Surcharges ────────────────────────────────────────────────── */}
      <QuoteSurchargesSection
        control={control}
        register={register}
        companyOptions={companyOptions}
      />

      {/* ── Summary ───────────────────────────────────────────────────── */}
      <QuoteSummaryPanel
        summary={summary}
        note="An estimate from list prices. The saved quote is recalculated with the customer's contract terms."
      />

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

      {/* ── Documents ─────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="border-b pb-2 text-base font-semibold">Documents</h2>
        <div className="space-y-2">
          {watch("documents")?.map((doc, index) => (
            <div key={doc.id} className="flex items-center gap-3 text-sm">
              <span className="flex-1">{doc.fileName}</span>
              <button
                type="button"
                onClick={async () => {
                  await fetch(`/api/documents/${doc.id}/delete`, {
                    method: "DELETE",
                  });
                  const current = watch("documents") ?? [];
                  setValue(
                    "documents",
                    current.filter((_, i) => i !== index),
                  );
                }}
                className="text-muted-foreground hover:text-destructive"
                aria-label="Remove"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <DocumentUploader
          onSuccess={(uploads) => {
            const current = watch("documents") ?? [];
            setValue("documents", [
              ...current,
              ...uploads.map((u) => ({
                id: u.documentId,
                fileName: u.fileName,
              })),
            ]);
          }}
        />
      </section>

      <FormActions
        submitLabel={isEditing ? "Save Quote" : "Create Quote"}
        pendingLabel={isEditing ? "Saving..." : "Creating..."}
        isPending={isPending}
        onCancel={handleCancel}
      />
    </form>
  );
};
