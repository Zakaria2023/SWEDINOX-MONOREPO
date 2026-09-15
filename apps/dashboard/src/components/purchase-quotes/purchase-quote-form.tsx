"use client";

import { Controller } from "react-hook-form";
import { usePurchaseQuoteSubmit } from "@/app/(dashboard)/purchase-quotes/use-purchase-quote-submit";
import { AddressOption } from "@/app/(dashboard)/addresses/actions";
import { CompanyOption } from "@/app/(dashboard)/companies/actions";
import { ProductOption } from "@/app/(dashboard)/products/actions";
import { PurchaseQuoteFormValues } from "@/app/(dashboard)/purchase-quotes/validation";
import { QuoteItemsSection } from "@/components/purchase-quotes/sections/quote-items-section";
import { DatePicker } from "@/components/shadcn/date-picker";
import { Input } from "@/components/shadcn/input";
import { Select } from "@/components/shadcn/select";
import { DocumentUploader } from "@/components/document-uploader";
import { FormActions } from "@/components/ui/form-actions";
import { FormError } from "@/components/ui/form-error";
import { FormFieldError, FormLabel } from "@/components/ui/form-field";
import { FormSelectField } from "@/components/ui/form-select-field";
import { FormCheckboxCard } from "@/components/ui/form-checkbox-card";
import { ClerkUserOption } from "@/lib/server/clerk";

type Props = {
  companies: CompanyOption[];
  clerkUsers: ClerkUserOption[];
  products: ProductOption[];
  internalAddresses: AddressOption[];
  /** Set when editing an existing quote; omitted when creating one. */
  purchaseQuoteUuid?: string;
  defaultValues?: PurchaseQuoteFormValues;
};

export const PurchaseQuoteForm = ({
  companies,
  clerkUsers,
  products,
  internalAddresses,
  purchaseQuoteUuid,
  defaultValues,
}: Props) => {
  const {
    form,
    isPending,
    isEditing,
    onSubmit,
    state,
    arrangeTransport,
    deliveryType,
    supplierOptions,
    agentOptions,
    contactOptions,
    supplierAddressOptions,
    deliveryAddressOptions,
    productOptions,
    itemFields,
    appendItem,
    removeItem,
    purchaseOrderTypeOptions,
    weightTypeOptions,
    deliveryTermOptions,
    paymentTermOptions,
    purchaserOptions,
    isLoadingCompanyData,
    handleSupplierChange,
    handleAgentChange,
    handleCancel,
  } = usePurchaseQuoteSubmit({
    companies,
    clerkUsers,
    products,
    internalAddresses,
    purchaseQuoteUuid,
    defaultValues,
  });

  const {
    register,
    control,
    watch,
    setValue,
    formState: { errors },
  } = form;

  const supplierUuid = watch("supplierUuid");
  const agentUuid = watch("agentUuid");

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <FormError>{state.error}</FormError>

      {/* ── Header ────────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="border-b pb-2 text-base font-semibold">
          Purchase Quote Information
        </h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <FormLabel htmlFor="supplierUuid">
              Supplier
              {isLoadingCompanyData && (
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
                  disabled={!!agentUuid}
                />
              )}
            />
            <FormFieldError message={errors.supplierUuid?.message} />
          </div>

          <div>
            <FormLabel htmlFor="agentUuid">Agent</FormLabel>
            <Controller
              control={control}
              name="agentUuid"
              render={({ field }) => (
                <Select
                  id="agentUuid"
                  value={field.value || ""}
                  options={agentOptions}
                  onValueChange={handleAgentChange}
                  disabled={!!supplierUuid}
                />
              )}
            />
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

          <div>
            <FormLabel htmlFor="reference">Reference</FormLabel>
            <Input id="reference" {...register("reference")} />
          </div>

          <div>
            <FormLabel htmlFor="ourReference">Our reference</FormLabel>
            <Input id="ourReference" {...register("ourReference")} />
          </div>

          <div>
            <FormLabel htmlFor="orderCategory">Order Category</FormLabel>
            <Input id="orderCategory" {...register("orderCategory")} />
          </div>
        </div>
      </section>

      {/* ── Quote ─────────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="border-b pb-2 text-base font-semibold">Quote</h2>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <FormLabel htmlFor="quoteNumber">Quote No</FormLabel>
            <Input id="quoteNumber" {...register("quoteNumber")} />
          </div>
          <div>
            <FormLabel htmlFor="quoteDate">Quote date</FormLabel>
            <Controller
              name="quoteDate"
              control={control}
              render={({ field }) => (
                <DatePicker
                  id="quoteDate"
                  value={field.value ?? ""}
                  onChange={field.onChange}
                />
              )}
            />
          </div>
          <div>
            <FormLabel htmlFor="validUntil">Valid u/i</FormLabel>
            <Controller
              name="validUntil"
              control={control}
              render={({ field }) => (
                <DatePicker
                  id="validUntil"
                  value={field.value ?? ""}
                  onChange={field.onChange}
                />
              )}
            />
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
          <Controller
            control={control}
            name="isConsignment"
            render={({ field }) => (
              <FormCheckboxCard
                label="Consignment"
                checked={field.value}
                active={field.value}
                onChange={(e) => field.onChange(e.target.checked)}
              />
            )}
          />
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
            id="deliveryAddressUuid"
            name="deliveryAddressUuid"
            label="Delivery Address"
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

        <div className="max-w-sm">
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

      <QuoteItemsSection
        productOptions={productOptions}
        control={control}
        register={register}
        itemFields={itemFields}
        appendItem={appendItem}
        removeItem={removeItem}
      />

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
        submitLabel={
          isEditing ? "Save Purchase Quote" : "Create Purchase Quote"
        }
        pendingLabel={isEditing ? "Saving..." : "Creating..."}
        isPending={isPending}
        onCancel={handleCancel}
      />
    </form>
  );
};
