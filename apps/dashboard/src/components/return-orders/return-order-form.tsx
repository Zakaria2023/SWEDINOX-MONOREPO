"use client";

import { Controller, FormProvider } from "react-hook-form";
import { CompanyOption } from "@/app/(dashboard)/companies/actions";
import { ReturnOrderDetail } from "@/app/(dashboard)/return-orders/actions";
import { returnOrderDetailToFormValues } from "@/app/(dashboard)/return-orders/mappers";
import { useReturnOrderSubmit } from "@/app/(dashboard)/return-orders/use-return-order-submit";
import { ReturnOrderFormValues } from "@/app/(dashboard)/return-orders/validation";
import { TextCategoryOption } from "@/app/(dashboard)/text-categories/actions";
import { DatePicker } from "@/components/shadcn/date-picker";
import { Input } from "@/components/shadcn/input";
import { Select } from "@/components/shadcn/select";
import { Textarea } from "@/components/shadcn/textarea";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { FormActions } from "@/components/ui/form-actions";
import { FormError } from "@/components/ui/form-error";
import { FormFieldError, FormLabel } from "@/components/ui/form-field";
import { FormSelectField } from "@/components/ui/form-select-field";
import {
  PurchaseOrderNewPanels,
  WORK_ORDER_PANELS,
  panelsNamed,
} from "@/components/purchase-orders/purchase-order-new-panels";
import {
  formatAddressLine,
  formatDateColumn,
  formatMoney,
  formatNumber,
  getQuoteVatRatePercent,
  isReturnOrderEditable,
  proRataSlice,
} from "@/lib/helpers";
import { RETURN_ORDER_DOCUMENT_STATUS_LABELS } from "@/lib/labels";
import { NewReturnOrderLines } from "./new-return-order-lines";
import { ReturnOrderLines } from "./return-order-lines";
import { ReturnOrderToolbar } from "./return-order-toolbar";
import { ComplaintsSection } from "./sections/complaints-section";
import { DocumentsSection } from "./sections/documents-section";
import { FinancesSection } from "./sections/finances-section";
import { InvoiceLinesSection } from "./sections/invoice-lines-section";
import { LogisticsSection } from "./sections/logistics-section";
import { OptionsSection } from "./sections/options-section";
import { SurchargesSection } from "./sections/surcharges-section";
import { TextsSection } from "./sections/texts-section";
import { WorkordersSection } from "./sections/workorders-section";

type Props = {
  companies: CompanyOption[];
  textCategories: TextCategoryOption[];
  /** The saved return: its own page is this same screen, prefilled. */
  existing?: ReturnOrderDetail | null;
  /** A new return's opening values — `Par. return` sets customer and order. */
  defaultValues?: ReturnOrderFormValues;
};

/**
 * A sales return order — goods a customer sends back to us — in the
 * reference's document layout (return 290247, 29-9-2026): the toolbar on top,
 * the header with its summary, then `Order lines` and every panel under it. A
 * new return and a saved one are the same screen.
 */
export const ReturnOrderForm = ({
  companies,
  textCategories,
  existing = null,
  defaultValues,
}: Props) => {
  const {
    form,
    isPending,
    isEditing,
    onSubmit,
    error,
    pendingLines,
    setPendingLines,
    isPickup,
    companyOptions,
    contactOptions,
    orderOptions,
    addressOptions,
    pickupOptions,
    deliveryOptions,
    returnReasonOptions,
    paymentTermOptions,
    transportRegionOptions,
    transportModeOptions,
    isLoadingCompanyData,
    handleCompanyChange,
    handleCancel,
  } = useReturnOrderSubmit({
    companies,
    returnOrderUuid: existing?.uuid,
    defaultValues: existing
      ? returnOrderDetailToFormValues(existing)
      : defaultValues,
    savedDeliveryAddress: existing?.deliveryAddressUuid
      ? {
          value: existing.deliveryAddressUuid,
          label:
            formatAddressLine({
              streetAndNo: existing.deliveryStreetAndNo,
              postalCode: existing.deliveryPostalCode,
              city: existing.deliveryCity,
            }) || existing.deliveryAddressUuid,
        }
      : null,
  });

  const {
    register,
    control,
    watch,
    formState: { errors },
  } = form;

  const companyUuid = watch("companyUuid");
  const returnDate = watch("returnDate") ?? "";

  // Goods back on the shelf, a credit raised, or a cancelled return: nothing
  // on it changes any more.
  const isReadOnly =
    existing !== null && !isReturnOrderEditable(existing.status);
  // `Make final` locks the customer and the return date (290247); so does a
  // line, which was picked from this customer's invoices.
  const isFinal = existing !== null && existing.status !== "open";
  const isCustomerLocked =
    existing !== null && (isFinal || existing.items.length > 0);

  // A saved return reads the Summary its lines and surcharges were rolled up
  // into; a new one sums what is typed, at the invoiced prices.
  const pendingFigures = pendingLines.map(({ line, returnQty }) => {
    const quantity = Number(returnQty || 0);
    return {
      amount: Number(line?.netPrice ?? 0) * quantity,
      weightKg: line
        ? proRataSlice(Number(line.weightKg ?? 0), {
            quantity: Number(line.quantity ?? 0),
            alreadyBilled: 0,
            billing: quantity,
          })
        : 0,
    };
  });
  const typedSurcharges = (watch("surcharges") ?? []).reduce(
    (sum, surcharge) => sum + Number(surcharge.amount || 0),
    0,
  );
  const materials = existing
    ? Number(existing.materialsRevenue ?? 0)
    : pendingFigures.reduce((sum, line) => sum + line.amount, 0);
  const options = existing ? Number(existing.optionsRevenue ?? 0) : 0;
  const surcharges = existing
    ? Number(existing.surchargesRevenue ?? 0)
    : typedSurcharges;
  const totalExclVat = existing
    ? Number(existing.totalExclVat ?? 0)
    : materials + options + surcharges;
  const vat = existing
    ? Number(existing.vatAmount ?? 0)
    : (totalExclVat *
        getQuoteVatRatePercent(watch("calculateVatIfApplicable"), undefined)) /
      100;
  const totalInclVat = existing
    ? Number(existing.totalInclVat ?? 0)
    : totalExclVat + vat;
  const totalKg = existing
    ? Number(existing.totalWeightKg ?? 0)
    : pendingFigures.reduce((sum, line) => sum + line.weightKg, 0);
  const summaryRows: Array<[string, string, boolean?]> = [
    ["Materials", formatMoney(materials)],
    ["Options", formatMoney(options)],
    ["Surcharges", formatMoney(surcharges), true],
    ["Tot. excl. VAT", formatMoney(totalExclVat)],
    ["VAT", formatMoney(vat), true],
    ["Tot. incl. VAT", formatMoney(totalInclVat)],
    ["Total weight", `${formatNumber(totalKg)} Kg`],
  ];

  // The reference's banner: `Return order 290247, Mercainox … - Provisional`,
  // with `Printed` and `Mailed` once they are.
  const banner = existing
    ? `${[`Return order ${existing.id}`, existing.companyName]
        .filter(Boolean)
        .join(", ")} - ${RETURN_ORDER_DOCUMENT_STATUS_LABELS[existing.status ?? "open"]}${existing.isPrinted ? ", Printed" : ""}${existing.isMailed ? ", Mailed" : ""}`
    : "Return order";

  const lineCount = existing ? existing.items.length : pendingLines.length;

  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit} className="space-y-6">
        <FormError>{error}</FormError>

        <ReturnOrderToolbar returnOrder={existing} />

        <section className="space-y-4 rounded-lg border p-4">
          <div className="space-y-1">
            <h1 className="text-lg font-semibold">{banner}</h1>
            {existing && (
              <p className="text-sm text-muted-foreground">
                Creation date:{" "}
                {formatDateColumn(existing.orderDate ?? existing.createdAt)}
              </p>
            )}
          </div>

          <fieldset
            disabled={isReadOnly}
            className="grid gap-x-10 gap-y-6 lg:grid-cols-[3fr_2fr]"
          >
            <div className="space-y-6">
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
                  <FormLabel htmlFor="salesRep">Sales</FormLabel>
                  {/* The reference fills the rep from the customer record; a
                      return has no column to hold it. */}
                  <Input id="salesRep" value="" readOnly disabled />
                </div>

                {/* Greyed in the reference, which never links a return to its
                    sale (290247). Ours carries the order `Par. return` was
                    pressed on, and matches the lines against it. */}
                <FormSelectField
                  control={control}
                  id="orderUuid"
                  name="orderUuid"
                  label="Sales order"
                  options={orderOptions}
                  emptyValue=""
                  disabled
                />

                <div>
                  <FormLabel htmlFor="complaintRef">Complaint</FormLabel>
                  {/* Greyed: set when a complaint raises the return. */}
                  <Input
                    id="complaintRef"
                    value={watch("complaintRef") ?? ""}
                    readOnly
                    disabled
                  />
                </div>

                <div>
                  <FormLabel htmlFor="customerRef">Customer ref.</FormLabel>
                  <Input id="customerRef" {...register("customerRef")} />
                </div>

                <div>
                  <FormLabel htmlFor="ourReference">Our reference</FormLabel>
                  <Input id="ourReference" {...register("ourReference")} />
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-sm font-semibold">Reception</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <FormLabel htmlFor="returnDate">Return date</FormLabel>
                    <Controller
                      name="returnDate"
                      control={control}
                      render={({ field }) => (
                        <DatePicker
                          id="returnDate"
                          value={field.value ?? ""}
                          onChange={field.onChange}
                          disabled={isFinal}
                        />
                      )}
                    />
                  </div>

                  <div className="flex items-end pb-2">
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

                  {/* Both always show, as in the reference: the customer's
                      address the goods are collected from — greyed unless we
                      collect them — and ours they are delivered to. */}
                  <FormSelectField
                    control={control}
                    id="pickupAddress"
                    name="pickupAddress"
                    label="Pick-up"
                    options={pickupOptions}
                    emptyValue=""
                    disabled={!isPickup || pickupOptions.length <= 1}
                  />

                  <FormSelectField
                    control={control}
                    id="deliveryAddressUuid"
                    name="deliveryAddressUuid"
                    label="Delivery address"
                    options={deliveryOptions}
                    emptyValue=""
                  />
                </div>
              </div>

              <div className="max-w-sm space-y-2">
                <h2 className="text-sm font-semibold">Reason</h2>
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
            </div>

            <div className="space-y-6">
              <div className="space-y-1">
                {/* Greyed in the reference: Print… and Send… set them. */}
                {(
                  [
                    ["isPrinted", "Printed"],
                    ["isMailed", "Mailed"],
                    ["isFaxed", "Faxed"],
                  ] as const
                ).map(([name, label]) => (
                  <label
                    key={name}
                    className="flex items-center gap-2 text-sm text-muted-foreground"
                  >
                    <input
                      type="checkbox"
                      checked={watch(name) ?? false}
                      disabled
                      readOnly
                    />
                    {label}
                  </label>
                ))}
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input type="checkbox" {...register("handlingBlocked")} />
                  Handling blocked
                </label>
              </div>

              <section className="space-y-2">
                <h2 className="text-sm font-semibold">Summary</h2>
                <dl className="grid grid-cols-[1fr_auto] gap-x-6 gap-y-1 text-sm">
                  <dt />
                  <dd className="text-right text-xs text-muted-foreground">
                    Revenue
                  </dd>
                  {summaryRows.map(([label, value, rule]) => (
                    <div
                      key={label}
                      className={rule ? "contents *:border-b *:pb-1" : "contents"}
                    >
                      <dt className="text-muted-foreground">{label}</dt>
                      <dd className="text-right tabular-nums">{value}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            </div>
          </fieldset>
        </section>

        {/* The panels under the header, in the sales document's order:
            Workorders · Order lines · Options · Invoice lines · Finances ·
            Complaints · Logistics · Texts · Surcharges · Documents ·
            Communication · PDF Files. Only the lines are open. */}
        <div className="space-y-2">
          {existing ? (
            <WorkordersSection returnOrder={existing} />
          ) : (
            <CollapsibleSection title="Workorders">
              <div className="p-3">
                <PurchaseOrderNewPanels panels={WORK_ORDER_PANELS} />
              </div>
            </CollapsibleSection>
          )}

          <CollapsibleSection
            title="Order lines"
            summary={`${lineCount} ${lineCount === 1 ? "line" : "lines"}`}
            defaultOpen
          >
            {existing ? (
              <ReturnOrderLines returnOrder={existing} returnDate={returnDate} />
            ) : (
              <NewReturnOrderLines
                pendingLines={pendingLines}
                setPendingLines={setPendingLines}
                companyUuid={companyUuid}
                orderUuid={watch("orderUuid") ?? ""}
                returnDate={returnDate}
                disabled={isPending}
              />
            )}
          </CollapsibleSection>

          {existing ? (
            <>
              <OptionsSection items={existing.items} />
              <InvoiceLinesSection returnOrder={existing} />
            </>
          ) : (
            <PurchaseOrderNewPanels
              panels={panelsNamed(["Options", "Invoice lines"])}
            />
          )}

          <FinancesSection
            paymentTermOptions={paymentTermOptions}
            addressOptions={addressOptions}
          />

          {existing ? (
            <ComplaintsSection returnOrder={existing} />
          ) : (
            <PurchaseOrderNewPanels panels={panelsNamed(["Complaints"])} />
          )}

          <LogisticsSection
            transportRegionOptions={transportRegionOptions}
            transportModeOptions={transportModeOptions}
          />

          <CollapsibleSection title="Texts">
            <div className="space-y-4 p-3">
              <TextsSection textCategories={textCategories} />
              <div>
                <FormLabel htmlFor="remarks">Remarks</FormLabel>
                <Textarea
                  id="remarks"
                  rows={4}
                  placeholder="Additional remarks..."
                  {...register("remarks")}
                />
              </div>
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="Surcharges">
            <div className="p-3">
              <SurchargesSection companyOptions={companyOptions} />
            </div>
          </CollapsibleSection>

          <DocumentsSection />

          <PurchaseOrderNewPanels
            panels={panelsNamed(["Communication", "PDF Files"])}
          />
        </div>

        {isReadOnly ? (
          <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            {existing?.status === "cancelled"
              ? "This return order is cancelled."
              : "These goods are back in stock and the stock moved with them. The return can no longer be changed."}
          </p>
        ) : (
          <FormActions
            submitLabel={isEditing ? "Save changes" : "Create Return Order"}
            pendingLabel={isEditing ? "Saving..." : "Creating..."}
            isPending={isPending}
            onCancel={handleCancel}
          />
        )}
      </form>
    </FormProvider>
  );
};
