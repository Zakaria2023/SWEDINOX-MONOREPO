"use client";

import Link from "next/link";
import { Controller, FormProvider } from "react-hook-form";
import {
  BadgeCheck,
  Building2,
  ClipboardList,
  Mail,
  MessageSquareWarning,
  Printer,
  ShoppingCart,
  Warehouse,
} from "lucide-react";
import { usePurchaseReturnOrderSubmit } from "@/app/(dashboard)/purchase-return-orders/use-purchase-return-order-submit";
import { CompanyOption } from "@/app/(dashboard)/companies/actions";
import { PurchaseReturnOrderFormValues } from "@/app/(dashboard)/purchase-return-orders/validation";
import { TextCategoryOption } from "@/app/(dashboard)/text-categories/actions";
import { ClerkUserOption } from "@/lib/server/clerk";
import { DatePicker } from "@/components/shadcn/date-picker";
import { Input } from "@/components/shadcn/input";
import { TimePicker } from "@/components/shadcn/time-picker";
import { Textarea } from "@/components/shadcn/textarea";
import { Select } from "@/components/shadcn/select";
import { Button } from "@/components/shadcn/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import {
  panelsNamed,
  PurchaseOrderNewPanels,
  WORK_ORDER_PANELS,
} from "@/components/purchase-orders/purchase-order-new-panels";
import {
  cn,
  formatDateColumn,
  formatMoney,
  formatNumber,
  onWorkingDay,
  orDash,
  VAT_CODE_RATE,
} from "@/lib/helpers";
import { useState } from "react";
import { getReturnablePurchaseLines } from "@/app/(dashboard)/purchase-return-orders/actions";
import { PickedReturnLine } from "@/app/(dashboard)/purchase-return-orders/use-purchase-return-order-submit";
import {
  StockSearchChoice,
  StockSearchDialog,
} from "@/components/orders/stock-search-dialog";
import { DocumentUploader } from "@/components/document-uploader";
import { FormActions } from "@/components/ui/form-actions";
import { FormError } from "@/components/ui/form-error";
import { FormFieldError, FormLabel } from "@/components/ui/form-field";
import { FormSelectField } from "@/components/ui/form-select-field";
import { FormCheckboxCard } from "@/components/ui/form-checkbox-card";
import { SurchargesSection } from "./sections/surcharges-section";
import { TextsSection } from "./sections/texts-section";

const SAVE_FIRST = "Save the return order first";

// The return's `Lines` grid, column for column (blank return, 11-10-2026).
const RETURN_LINE_COLUMNS = [
  "Code",
  "Order line",
  "Product",
  "Description",
  "Qty(p)",
  "Qty(a)",
  "U",
  "Length",
  "Width",
  "Delivery date",
  "Kg(p)",
  "Kg(a)",
  "Gross Price",
  "U",
  "Line Discount",
  "U",
  "Group Discount",
  "U",
  "Amount",
  "Status",
];


type Props = {
  companies: CompanyOption[];
  clerkUsers: ClerkUserOption[];
  textCategories: TextCategoryOption[];
  /** Set when editing an existing return order; omitted when creating one. */
  purchaseReturnOrderUuid?: string;
  defaultValues?: PurchaseReturnOrderFormValues;
  currentUserId?: string;
};

export const PurchaseReturnOrderForm = ({
  companies,
  clerkUsers,
  textCategories,
  purchaseReturnOrderUuid,
  defaultValues,
  currentUserId,
}: Props) => {
  const {
    form,
    isPending,
    isEditing,
    onSubmit,
    pendingLines,
    setPendingLines,
    state,
    isDropOff,
    supplierOptions,
    contactOptions,
    purchaseOrderLabel,
    addressOptions,
    pickupOptions,
    purchaseOrderTypeOptions,
    returnReasonOptions,
    paymentTermOptions,
    transportRegionOptions,
    transportModeOptions,
    purchaserOptions,
    isLoadingSupplierData,
    handleSupplierChange,
    handleCancel,
  } = usePurchaseReturnOrderSubmit({
    companies,
    clerkUsers,
    purchaseReturnOrderUuid,
    defaultValues,
    currentUserId,
  });

  const {
    register,
    control,
    watch,
    setValue,
    formState: { errors },
  } = form;

  // The line whose `…` opened the stock window, or null when it is shut.
  const [pickingLine, setPickingLine] = useState<number | null>(null);
  const [selectedLine, setSelectedLine] = useState<number | null>(null);
  const [lineError, setLineError] = useState<string | undefined>();
  const supplierUuid = watch("supplierUuid");

  // Each picked parcel's share of the line's weight, and what it is worth.
  const lineFigures = pendingLines.map(({ lot, returnQty }) => {
    const quantity = Number(returnQty || 0);
    const planned = Number(lot?.plannedQuantity ?? lot?.receivedQuantity ?? 0);
    const weightKg =
      planned > 0 ? (Number(lot?.kgPurchased ?? 0) * quantity) / planned : 0;
    // The reference leaves a picked return line at `Gross price € 0,00`, so
    // it is worth nothing until somebody prices it (950034, 11-10-2026).
    const amount = 0;
    return { quantity, weightKg, amount };
  });
  const materials = lineFigures.reduce((sum, line) => sum + line.amount, 0);
  const totalKg = lineFigures.reduce((sum, line) => sum + line.weightKg, 0);
  const vat = (materials * VAT_CODE_RATE.vat_high_21) / 100;
  const summaryRows: Array<[string, string, boolean?]> = [
    ["Materials", formatMoney(materials)],
    ["Options", formatMoney(0)],
    ["Surcharges", formatMoney(0), true],
    ["Tot. excl. VAT", formatMoney(materials)],
    ["VAT", formatMoney(vat), true],
    ["Tot. incl. VAT", formatMoney(materials + vat)],
    ["Total weight", `${formatNumber(totalKg)} Kg`],
  ];

  // The reference's `…` on a return line opens `Voorraad`, the stock window
  // every document line picks from (950034, 11-10-2026). The lot chosen
  // there has to be one this supplier delivered, or there is nothing to send
  // back to it.
  const chooseLot = (index: number, choice: StockSearchChoice) => {
    const lot = choice.lot;
    setLineError(undefined);
    if (!lot || !supplierUuid) {
      setLineError("Pick a lot, not just an article: a return sends a parcel back.");
      return;
    }
    void getReturnablePurchaseLines(supplierUuid).then((returnable) => {
      const match = returnable.find((line) => line.stockUuid === lot.uuid);
      if (!match) {
        setLineError(
          `Lot ${lot.internalCharge ?? lot.charge ?? ""} did not come from this supplier, or is no longer on the shelf.`,
        );
        return;
      }
      setPendingLines((current: PickedReturnLine[]) =>
        current.some(
          (line, at) => at !== index && line.lot?.stockUuid === match.stockUuid,
        )
          ? current
          : current.map((line, at) =>
              at === index ? { ...line, lot: match } : line,
            ),
      );
    });
  };

  // `New` adds a blank line — Code 10, Qty(p) 0, `Provisional` — and greys
  // until that line has a product (950034, 11-10-2026).
  const addBlankLine = () => {
    setLineError(undefined);
    setSelectedLine(pendingLines.length);
    setPendingLines((current: PickedReturnLine[]) => [
      ...current,
      { lot: null, returnQty: "0" },
    ]);
  };

  const setReturnQty = (index: number, returnQty: string) =>
    setPendingLines((current: PickedReturnLine[]) =>
      current.map((line, at) => (at === index ? { ...line, returnQty } : line)),
    );

  const deleteSelectedLine = () => {
    if (selectedLine === null) {
      return;
    }
    setPendingLines((current) =>
      current.filter((_, index) => index !== selectedLine),
    );
    setSelectedLine(null);
  };

  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit} className="space-y-6">
        <FormError>{state.error}</FormError>

        {/* The reference's toolbar on a return: `Make final · Print… · Send… ·
            Show company · Show purchase order · Show complaint · Order lines ·
            Stock on location` (blank return, 11-10-2026). The document ones
            wait for the return to exist. */}
        <div className="flex flex-wrap gap-2 border-b pb-4">
          <Button type="button" disabled title={SAVE_FIRST}>
            <BadgeCheck className="me-1.5 size-4" />
            Make final
          </Button>
          <Button type="button" variant="outline" disabled title={SAVE_FIRST}>
            <Printer className="me-1.5 size-4" />
            Print…
          </Button>
          <Button type="button" variant="outline" disabled title={SAVE_FIRST}>
            <Mail className="me-1.5 size-4" />
            Send…
          </Button>
          <Button type="button" variant="outline" disabled title={SAVE_FIRST}>
            <Building2 className="me-1.5 size-4" />
            Show company
          </Button>
          <Button type="button" variant="outline" disabled title={SAVE_FIRST}>
            <ShoppingCart className="me-1.5 size-4" />
            Show purchase order
          </Button>
          <Button type="button" variant="outline" disabled title={SAVE_FIRST}>
            <MessageSquareWarning className="me-1.5 size-4" />
            Show complaint
          </Button>
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href="/purchase-lines" />}
          >
            <ClipboardList className="me-1.5 size-4" />
            Order lines
          </Button>
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href="/stock-on-location" />}
          >
            <Warehouse className="me-1.5 size-4" />
            Stock on location
          </Button>
        </div>

        {/* The reference's header: the document on the left, its type, the
            sent flags and the summary on the right. */}
        <section className="space-y-4 rounded-lg border p-4">
          <h1 className="text-lg font-semibold">Purchase return order</h1>

          <div className="grid gap-x-10 gap-y-6 lg:grid-cols-[3fr_2fr]">
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
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

                <div>
                  <FormLabel htmlFor="purchaseOrderLabel">
                    Purchase order
                  </FormLabel>
                  {/* Greyed in the reference: set by `Par. return` on the
                      order. */}
                  <Input
                    id="purchaseOrderLabel"
                    value={purchaseOrderLabel}
                    readOnly
                    disabled
                  />
                </div>

                <div>
                  <FormLabel htmlFor="complaintRef">Complaint</FormLabel>
                  {/* Greyed in the reference: `Par. return` raises the
                      complaint. */}
                  <Input
                    id="complaintRef"
                    value={watch("complaintRef") ?? ""}
                    readOnly
                    disabled
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
              </div>

              <div className="space-y-2">
                <h2 className="text-sm font-semibold">Invoicing</h2>
                <FormSelectField
                  control={control}
                  id="paymentTerms"
                  name="paymentTerms"
                  label="Payment terms"
                  options={paymentTermOptions}
                  emptyValue=""
                />
              </div>

              <div className="space-y-4">
                <h2 className="text-sm font-semibold">Delivery</h2>
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
                        />
                      )}
                    />
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
                </div>

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

                {/* Both always show, as in the reference: the supplier's
                    address is greyed unless we drop the goods off ourselves,
                    and Pick-up picks one of our own addresses. */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormSelectField
                    control={control}
                    id="deliveryAddressUuid"
                    name="deliveryAddressUuid"
                    label="Delivery address"
                    options={addressOptions}
                    emptyValue=""
                    disabled={!isDropOff || addressOptions.length <= 1}
                  />

                  <FormSelectField
                    control={control}
                    id="pickupAddress"
                    name="pickupAddress"
                    label="Pick-up"
                    options={pickupOptions}
                    emptyValue=""
                  />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {/* Greyed and fixed in the reference: a return is `Materials`. */}
              <FormSelectField
                control={control}
                id="purchaseOrderType"
                name="purchaseOrderType"
                label="Purchase order type"
                options={purchaseOrderTypeOptions}
                emptyValue=""
                disabled
              />

              {/* Greyed in the reference: Print… and Send… set them. */}
              <div className="space-y-1">
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
          </div>
        </section>

        {/* Every panel the reference stacks under the header, in its order:
            Workorders · Lines · Surcharges · Invoice lines · Complaints ·
            Logistics · Texts · Documents · PDF Files. Only Lines is open. */}
        <div className="space-y-2">
          <CollapsibleSection title="Workorders">
            <div className="space-y-2 p-3">
              <PurchaseOrderNewPanels panels={WORK_ORDER_PANELS} />
            </div>
          </CollapsibleSection>

          <CollapsibleSection
            title="Lines"
            summary={`${pendingLines.length} ${pendingLines.length === 1 ? "line" : "lines"}`}
            defaultOpen
          >
            <div className="space-y-2 p-3">
              {/* `New` wakes once there is a supplier, as the reference's
                  does, and offers the parcels that supplier delivered. Nothing
                  is saved until Create; a return being edited takes its lines
                  on its own page. */}
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addBlankLine}
                  disabled={
                    isPending ||
                    isEditing ||
                    !supplierUuid ||
                    pendingLines.some((line) => !line.lot)
                  }
                >
                  New
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={deleteSelectedLine}
                  disabled={isPending || selectedLine === null}
                >
                  Delete
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled
                  title="Not built yet"
                >
                  Sawing specifications
                </Button>
              </div>
              <StockSearchDialog
                open={pickingLine !== null}
                onOpenChange={(open) => {
                  if (!open) {
                    setPickingLine(null);
                  }
                }}
                onChoose={(choice) => {
                  if (pickingLine !== null) {
                    chooseLot(pickingLine, choice);
                  }
                  setPickingLine(null);
                }}
              />
              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {RETURN_LINE_COLUMNS.map((column, index) => (
                        <TableHead key={`${column}-${index}`}>{column}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingLines.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={RETURN_LINE_COLUMNS.length}
                          className="text-muted-foreground"
                        >
                          No lines.
                        </TableCell>
                      </TableRow>
                    ) : (
                      pendingLines.map(({ lot, returnQty }, index) => (
                        <TableRow
                          key={index}
                          onClick={() => setSelectedLine(index)}
                          className={cn(
                            "cursor-pointer",
                            index === selectedLine && "bg-accent",
                          )}
                        >
                          <TableCell className="text-right tabular-nums">
                            {(index + 1) * 10}
                          </TableCell>
                          {/* `0`: a line picked from stock is not one of the
                              order's lines; `Par. return` fills it. */}
                          <TableCell className="text-right tabular-nums">
                            0
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <div className="flex items-center gap-1">
                              <span>{lot?.productCode ?? ""}</span>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                aria-label="Choose the product from stock"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setPickingLine(index);
                                }}
                                disabled={isPending}
                              >
                                …
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>{lot?.productName ?? ""}</TableCell>
                          <TableCell className="text-right">
                            <Input
                              type="text"
                              inputMode="decimal"
                              className="w-20 text-right"
                              value={returnQty}
                              onClick={(event) => event.stopPropagation()}
                              onChange={(event) =>
                                setReturnQty(index, event.target.value)
                              }
                            />
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            0
                          </TableCell>
                          <TableCell>
                            {orDash(lot?.unit ? lot.unit.toUpperCase() : null)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {lot?.lengthMm ? `${lot.lengthMm} mm` : "0 mm"}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {lot?.widthMm ? `${lot.widthMm} mm` : "0 mm"}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {formatDateColumn(
                              watch("returnDate")
                                ? onWorkingDay(watch("returnDate") ?? "")
                                : null,
                            )}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatNumber(lineFigures[index]?.weightKg ?? 0)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            0
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatMoney(0)}
                          </TableCell>
                          <TableCell>{orDash(lot?.priceUnit ?? null)}</TableCell>
                          <TableCell className="text-right tabular-nums">
                            0
                          </TableCell>
                          <TableCell />
                          <TableCell className="text-right tabular-nums">
                            0
                          </TableCell>
                          <TableCell />
                          <TableCell className="text-right tabular-nums">
                            {formatMoney(lineFigures[index]?.amount ?? 0)}
                          </TableCell>
                          <TableCell>Provisional</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              <FormError>{lineError}</FormError>
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="Surcharges">
            <div className="p-3">
              <SurchargesSection companyOptions={supplierOptions} />
            </div>
          </CollapsibleSection>

          <PurchaseOrderNewPanels
            panels={panelsNamed(["Invoice lines", "Complaints"])}
          />

          <CollapsibleSection title="Logistics">
            <div className="space-y-4 p-3">
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
                  <Controller
                    name="pickupAfterTime"
                    control={control}
                    render={({ field }) => (
                      <TimePicker
                        id="pickupAfterTime"
                        value={field.value ?? ""}
                        onChange={field.onChange}
                      />
                    )}
                  />
                </div>
                <div>
                  <FormLabel htmlFor="pickupForTime">Pick up for</FormLabel>
                  <Controller
                    name="pickupForTime"
                    control={control}
                    render={({ field }) => (
                      <TimePicker
                        id="pickupForTime"
                        value={field.value ?? ""}
                        onChange={field.onChange}
                      />
                    )}
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
            </div>
          </CollapsibleSection>

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

          <CollapsibleSection
            title="Documents"
            summary={`${watch("documents")?.length ?? 0} Documents`}
          >
            <div className="space-y-2 p-3">
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
            </div>
          </CollapsibleSection>

          <PurchaseOrderNewPanels panels={panelsNamed(["PDF Files"])} />
        </div>

        <FormActions
          submitLabel={
            isEditing
              ? "Save Purchase Return Order"
              : "Create Purchase Return Order"
          }
          pendingLabel={isEditing ? "Saving..." : "Creating..."}
          isPending={isPending}
          onCancel={handleCancel}
        />
      </form>
    </FormProvider>
  );
};
