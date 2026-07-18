"use client";

import { Controller, FormProvider } from "react-hook-form";
import { useReturnOrderSubmit } from "@/app/(dashboard)/return-orders/use-return-order-submit";
import { CompanyOption } from "@/app/(dashboard)/companies/actions";
import { TextCategoryOption } from "@/app/(dashboard)/text-categories/actions";
import { Input } from "@/components/shadcn/input";
import { Textarea } from "@/components/shadcn/textarea";
import { Select } from "@/components/shadcn/select";
import { DocumentUploader } from "@/components/document-uploader";
import { FormActions } from "@/components/ui/form-actions";
import { FormError } from "@/components/ui/form-error";
import { FormFieldError, FormLabel } from "@/components/ui/form-field";
import { FormSelectField } from "@/components/ui/form-select-field";
import { FormCheckboxCard } from "@/components/ui/form-checkbox-card";
import { SurchargesSection } from "./sections/surcharges-section";
import { TextsSection } from "./sections/texts-section";

type Props = {
  companies: CompanyOption[];
  textCategories: TextCategoryOption[];
};

export const ReturnOrderForm = ({ companies, textCategories }: Props) => {
  const {
    form,
    isPending,
    onSubmit,
    state,
    isPickup,
    companyOptions,
    contactOptions,
    orderOptions,
    addressOptions,
    returnReasonOptions,
    paymentTermOptions,
    transportRegionOptions,
    transportModeOptions,
    isLoadingCompanyData,
    handleCompanyChange,
    handleCancel,
  } = useReturnOrderSubmit({ companies });

  const {
    register,
    control,
    watch,
    setValue,
    formState: { errors },
  } = form;

  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit} className="space-y-8">
        <FormError>{state.error}</FormError>

        {/* ── Return Order ──────────────────────────────────────────────── */}
        <section className="space-y-4">
          <h2 className="border-b pb-2 text-base font-semibold">
            Return Order
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
              id="orderUuid"
              name="orderUuid"
              label="Sales order"
              options={orderOptions}
              emptyValue=""
              disabled={orderOptions.length <= 1}
            />

            <div>
              <FormLabel htmlFor="customerRef">Customer ref.</FormLabel>
              <Input id="customerRef" {...register("customerRef")} />
            </div>

            <div>
              <FormLabel htmlFor="complaintRef">Complaint</FormLabel>
              <Input id="complaintRef" {...register("complaintRef")} />
            </div>

            <div>
              <FormLabel htmlFor="ourReference">Onze referentie</FormLabel>
              <Input id="ourReference" {...register("ourReference")} />
            </div>
          </div>

          <div className="flex gap-6">
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input type="checkbox" {...register("handlingBlocked")} />
              Handling blocked
            </label>
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
        </section>

        {/* ── Reception ─────────────────────────────────────────────────── */}
        <section className="space-y-4">
          <h2 className="border-b pb-2 text-base font-semibold">Reception</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <FormLabel htmlFor="returnDate">Return date</FormLabel>
              <Input id="returnDate" type="date" {...register("returnDate")} />
            </div>

            <div className="flex items-end pb-1">
              <Controller
                control={control}
                name="isPickup"
                render={({ field }) => (
                  <label className="flex cursor-pointer items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                    />
                    Pick-up
                  </label>
                )}
              />
            </div>

            {isPickup ? (
              <div>
                <FormLabel htmlFor="pickupAddress">Pick-up</FormLabel>
                <Input id="pickupAddress" {...register("pickupAddress")} />
              </div>
            ) : (
              <FormSelectField
                control={control}
                id="deliveryAddressUuid"
                name="deliveryAddressUuid"
                label="Delivery address"
                options={addressOptions}
                emptyValue=""
                disabled={addressOptions.length <= 1}
              />
            )}
          </div>
        </section>

        {/* ── Reason ────────────────────────────────────────────────────── */}
        <section className="space-y-4">
          <h2 className="border-b pb-2 text-base font-semibold">Reason</h2>
          <div className="max-w-sm">
            <FormSelectField
              control={control}
              id="returnReason"
              name="returnReason"
              label="Return reason"
              options={returnReasonOptions}
              emptyValue=""
            />
            <FormFieldError message={errors.returnReason?.message} />
          </div>
        </section>

        {/* ── Finances ──────────────────────────────────────────────────── */}
        <section className="space-y-4">
          <h2 className="border-b pb-2 text-base font-semibold">Finances</h2>

          <div className="grid grid-cols-2 gap-3">
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
            <FormSelectField
              control={control}
              id="transportRegion"
              name="transportRegion"
              label="Transport region"
              options={transportRegionOptions}
              emptyValue=""
            />
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
                Max. Bundle weight (kg)
              </FormLabel>
              <Input
                id="maxBundleWeightKg"
                type="number"
                step="0.01"
                {...register("maxBundleWeightKg")}
              />
            </div>
            <div>
              <FormLabel htmlFor="deliveryAfterTime">Delivery after</FormLabel>
              <Input
                id="deliveryAfterTime"
                type="time"
                {...register("deliveryAfterTime")}
              />
            </div>
            <div>
              <FormLabel htmlFor="deliverForTime">Deliver for</FormLabel>
              <Input
                id="deliverForTime"
                type="time"
                {...register("deliverForTime")}
              />
            </div>
            <FormSelectField
              control={control}
              id="transportMode"
              name="transportMode"
              label="Transport mode"
              options={transportModeOptions}
              emptyValue=""
            />
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

        {/* ── Surcharges ────────────────────────────────────────────────── */}
        <SurchargesSection companyOptions={companyOptions} />

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

        {/* ── Texts ─────────────────────────────────────────────────────── */}
        <TextsSection textCategories={textCategories} />

        <FormActions
          submitLabel="Create Return Order"
          pendingLabel="Creating..."
          isPending={isPending}
          onCancel={handleCancel}
        />
      </form>
    </FormProvider>
  );
};
