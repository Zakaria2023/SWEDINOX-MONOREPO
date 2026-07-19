"use client";

import { Controller, FormProvider } from "react-hook-form";
import { usePurchaseReturnOrderSubmit } from "@/app/(dashboard)/purchase-return-orders/use-purchase-return-order-submit";
import { CompanyOption } from "@/app/(dashboard)/companies/actions";
import { TextCategoryOption } from "@/app/(dashboard)/text-categories/actions";
import { ClerkUserOption } from "@/lib/server/clerk";
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
  clerkUsers: ClerkUserOption[];
  textCategories: TextCategoryOption[];
};

export const PurchaseReturnOrderForm = ({
  companies,
  clerkUsers,
  textCategories,
}: Props) => {
  const {
    form,
    isPending,
    onSubmit,
    state,
    isDropOff,
    supplierOptions,
    contactOptions,
    purchaseOrderOptions,
    addressOptions,
    purchaseOrderTypeOptions,
    returnReasonOptions,
    paymentTermOptions,
    transportRegionOptions,
    transportModeOptions,
    purchaserOptions,
    isLoadingSupplierData,
    handleSupplierChange,
    handleCancel,
  } = usePurchaseReturnOrderSubmit({ companies, clerkUsers });

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

        {/* ── Purchase Return Order ─────────────────────────────────────── */}
        <section className="space-y-4">
          <h2 className="border-b pb-2 text-base font-semibold">
            Purchase Return Order
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
              id="purchaseOrderType"
              name="purchaseOrderType"
              label="Purchase order type"
              options={purchaseOrderTypeOptions}
              emptyValue=""
            />

            <FormSelectField
              control={control}
              id="purchaseOrderUuid"
              name="purchaseOrderUuid"
              label="Purchase order"
              options={purchaseOrderOptions}
              emptyValue=""
              disabled={purchaseOrderOptions.length <= 1}
            />

            <div>
              <FormLabel htmlFor="purchaseOrderReference">Reference</FormLabel>
              <Input
                id="purchaseOrderReference"
                {...register("purchaseOrderReference")}
              />
            </div>

            <div>
              <FormLabel htmlFor="complaintRef">Complaint</FormLabel>
              <Input id="complaintRef" {...register("complaintRef")} />
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
              id="purchaser"
              name="purchaser"
              label="Purchaser"
              options={purchaserOptions}
              emptyValue=""
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
          </div>
        </section>

        {/* ── Invoicing ─────────────────────────────────────────────────── */}
        <section className="space-y-4">
          <h2 className="border-b pb-2 text-base font-semibold">Invoicing</h2>
          <div className="max-w-sm">
            <FormSelectField
              control={control}
              id="paymentTerms"
              name="paymentTerms"
              label="Payment terms"
              options={paymentTermOptions}
              emptyValue=""
            />
          </div>
        </section>

        {/* ── Delivery ──────────────────────────────────────────────────── */}
        <section className="space-y-4">
          <h2 className="border-b pb-2 text-base font-semibold">Delivery</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <FormLabel htmlFor="returnDate">Return date</FormLabel>
              <Input id="returnDate" type="date" {...register("returnDate")} />
            </div>

            <div>
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

            <div className="flex items-end pb-1">
              <Controller
                control={control}
                name="isDropOff"
                render={({ field }) => (
                  <label className="flex cursor-pointer items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                    />
                    Drop-off
                  </label>
                )}
              />
            </div>

            {isDropOff ? (
              <FormSelectField
                control={control}
                id="deliveryAddressUuid"
                name="deliveryAddressUuid"
                label="Delivery address"
                options={addressOptions}
                emptyValue=""
                disabled={addressOptions.length <= 1}
              />
            ) : (
              <div>
                <FormLabel htmlFor="pickupAddress">Pick-up</FormLabel>
                <Input id="pickupAddress" {...register("pickupAddress")} />
              </div>
            )}
          </div>
        </section>

        {/* ── Surcharges ────────────────────────────────────────────────── */}
        <SurchargesSection companyOptions={supplierOptions} />

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
            <Controller
              control={control}
              name="unloadingWarehousePerLine"
              render={({ field }) => (
                <FormCheckboxCard
                  label="Unloading warehouse per line"
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
              label="Transport"
              options={transportRegionOptions}
              emptyValue=""
            />
            <FormSelectField
              control={control}
              id="transportMode"
              name="transportMode"
              label="Transport mode"
              options={transportModeOptions}
              emptyValue=""
            />
            <div>
              <FormLabel htmlFor="pickupAfterTime">Pick up after</FormLabel>
              <Input
                id="pickupAfterTime"
                type="time"
                {...register("pickupAfterTime")}
              />
            </div>
            <div>
              <FormLabel htmlFor="pickupForTime">Pick up for</FormLabel>
              <Input
                id="pickupForTime"
                type="time"
                {...register("pickupForTime")}
              />
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
                Max. Bundle weight (kg)
              </FormLabel>
              <Input
                id="maxBundleWeightKg"
                type="number"
                step="0.01"
                {...register("maxBundleWeightKg")}
              />
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
          submitLabel="Create Purchase Return Order"
          pendingLabel="Creating..."
          isPending={isPending}
          onCancel={handleCancel}
        />
      </form>
    </FormProvider>
  );
};
