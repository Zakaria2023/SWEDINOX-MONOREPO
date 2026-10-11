"use client";

import Link from "next/link";
import { FormProvider, useWatch } from "react-hook-form";
import { usePurchaseQuoteSubmit } from "@/app/(dashboard)/purchase-quotes/use-purchase-quote-submit";
import { AddressOption } from "@/app/(dashboard)/addresses/actions";
import { CompanyOption } from "@/app/(dashboard)/companies/actions";
import { PurchaseQuoteDetail } from "@/app/(dashboard)/purchase-quotes/actions";
import { purchaseQuoteToFormValues } from "@/app/(dashboard)/purchase-quotes/mappers";
import { PurchaseQuoteFormValues } from "@/app/(dashboard)/purchase-quotes/validation";
import {
  NewOrderPanel,
  panelsNamed,
  PurchaseOrderNewPanels,
} from "@/components/purchase-orders/purchase-order-new-panels";
import { PurchaseOrderInformationSection } from "@/components/purchase-orders/sections/purchase-order-information-section";
import { DocumentUploader } from "@/components/document-uploader";
import { Input } from "@/components/shadcn/input";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { FormActions } from "@/components/ui/form-actions";
import { FormError } from "@/components/ui/form-error";
import { FormLabel } from "@/components/ui/form-field";
import { FormSelectField } from "@/components/ui/form-select-field";
import {
  amountForWeight,
  formatDateValue,
  formatMoney,
  formatNumber,
  isPurchaseQuoteEditable,
  netPriceAfterDiscounts,
  todayDateString,
  VAT_CODE_RATE,
} from "@/lib/helpers";
import { PURCHASE_QUOTE_STATUS_LABELS } from "@/lib/labels";
import { ClerkUserOption } from "@/lib/server/clerk";
import { PurchaseQuoteLines } from "./purchase-quote-lines";
import { PurchaseQuoteToolbar } from "./purchase-quote-toolbar";
import { PurchaseQuoteDeliverySection } from "./sections/purchase-quote-delivery-section";
import { PurchaseQuoteFollowUpSection } from "./sections/purchase-quote-follow-up-section";
import { PurchaseQuoteTypeSection } from "./sections/purchase-quote-type-section";

// The `Options` grid that opened below a quote's lines when `K320` was pressed
// (900000): its own table, each option with its own pricing basis (`Per`).
const QUOTE_OPTIONS_PANEL: NewOrderPanel = {
  title: "Options",
  columns: [
    "Seq.",
    "Option",
    "Qty",
    "U",
    "Gross price",
    "Per",
    "Discount",
    "U",
    "Amount",
    "Reference factor",
    "Net price",
    "Specification",
  ],
  empty: "Options on a quote line are not built yet.",
};

type Props = {
  companies: CompanyOption[];
  clerkUsers: ClerkUserOption[];
  internalAddresses: AddressOption[];
  /** The saved quote: its own page is this same screen, prefilled. */
  existing?: PurchaseQuoteDetail | null;
};

type SummaryProps = {
  items: PurchaseQuoteFormValues["items"];
  existing: PurchaseQuoteDetail | null;
};

/**
 * The reference's `Summary` block, identical to the purchase order's:
 * `Materials · Options · Surcharges · Tot. excl. VAT · VAT · Tot. incl. VAT ·
 * Total weight`, live while the lines are typed.
 *
 * VAT is struck at the standard rate — 10 plates at € 1.930/TN came to
 * € 606,02, VAT € 127,26, € 733,28 in all (900000) — unless the saved quote
 * was struck without it, for a supplier that calculates none.
 */
const PurchaseQuoteSummary = ({ items, existing }: SummaryProps) => {
  const totals = items.reduce(
    (acc, line) => {
      const quantity = Number(line.quantity ?? 0);
      const pieceWeightKg = Number(line.pieceWeightKg ?? 0);
      const weightKg =
        pieceWeightKg > 0 ? pieceWeightKg * quantity : Number(line.kg ?? 0);
      const grossPrice = Number(line.grossPrice ?? 0);
      const netPrice =
        grossPrice > 0
          ? netPriceAfterDiscounts(
              grossPrice,
              Number(line.groupDiscountPercent ?? 0),
              Number(line.lineDiscountPercent ?? 0),
            )
          : Number(line.netPrice ?? 0);
      const amount =
        netPrice > 0
          ? amountForWeight(netPrice, line.priceUnit ?? null, weightKg, {
              quantity,
              lengthMm: Number(line.lengthMm ?? 0) || null,
              widthMm: Number(line.widthMm ?? 0) || null,
              thicknessMm: Number(line.thicknessMm ?? 0) || null,
            })
          : 0;
      return {
        materials: acc.materials + amount,
        weightKg: acc.weightKg + weightKg,
      };
    },
    { materials: 0, weightKg: 0 },
  );
  const options = Number(existing?.optionsAmount ?? 0);
  const surcharges = Number(existing?.surcharges ?? 0);
  const totalExclVat = totals.materials + options + surcharges;
  const struckWithoutVat =
    existing !== null &&
    Number(existing.totalExclVat ?? 0) > 0 &&
    Number(existing.vatAmount ?? 0) === 0;
  const vatRate = struckWithoutVat ? 0 : VAT_CODE_RATE.vat_high_21;
  const vat = (totalExclVat * vatRate) / 100;

  const rows: Array<[string, string, boolean?]> = [
    ["Materials", formatMoney(totals.materials)],
    ["Options", formatMoney(options)],
    ["Surcharges", formatMoney(surcharges), true],
    ["Tot. excl. VAT", formatMoney(totalExclVat)],
    ["VAT", formatMoney(vat), true],
    ["Tot. incl. VAT", formatMoney(totalExclVat + vat)],
    ["Total weight", `${formatNumber(totals.weightKg)} Kg`],
  ];

  return (
    <section className="space-y-2">
      <h2 className="text-sm font-semibold">Summary</h2>
      <dl className="grid grid-cols-[1fr_auto] gap-x-6 gap-y-1 text-sm">
        {rows.map(([label, value, rule]) => (
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
  );
};

/**
 * The reference's `Purchase quote` window. A new quote and a saved one are
 * the same screen: the toolbar, the header — the document on the left, its
 * type, the quote's own dates, follow-up and summary on the right — then
 * `Lines`, `Options`, `Texts`, `Documents` and `PDF Files`.
 */
export const PurchaseQuoteForm = ({
  companies,
  clerkUsers,
  internalAddresses,
  existing = null,
}: Props) => {
  const {
    form,
    isPending,
    isEditing,
    onSubmit,
    state,
    arrangeTransport,
    pickupDropoffCdPurchases,
    hasSupplier,
    supplierOptions,
    agentOptions,
    contactOptions,
    supplierAddressOptions,
    deliveryAddressOptions,
    purchaseOrderTypeOptions,
    weightTypeOptions,
    deliveryTermOptions,
    paymentTermOptions,
    purchaserOptions,
    isLoadingSupplierData,
    supplierDefaults,
    handleSupplierChange,
    handleAgentChange,
    handleDeliveryDateChange,
    handleCancel,
    itemFields,
    appendItem,
    removeItem,
  } = usePurchaseQuoteSubmit({
    companies,
    clerkUsers,
    internalAddresses,
    purchaseQuoteUuid: existing?.uuid,
    defaultValues: existing ? purchaseQuoteToFormValues(existing) : undefined,
  });

  const { register, setValue } = form;
  const items = useWatch({ control: form.control, name: "items" });
  const documents = useWatch({ control: form.control, name: "documents" });

  // An awarded quote is what its order is priced on; a lost or expired one is
  // closed. Either way its terms are shown, no longer edited.
  const isReadOnly =
    existing !== null && !isPurchaseQuoteEditable(existing.status);
  // Once a line exists the supplier, the order type, the weight type and
  // Overlength grey, as on the purchase order: the line was priced and
  // weighed on them.
  const locked = itemFields.length > 0 || isReadOnly;
  const statusLabel = PURCHASE_QUOTE_STATUS_LABELS[existing?.status ?? "open"];

  // The reference's banner: `Purchase quote 900000, Holland Stainless Int,
  // Tel: 06 50 65 63 38, Fax: - Expired`. No fax prints as nothing before the
  // dash; the number is ours, handed out on save.
  const companyName = supplierDefaults?.companyName ?? existing?.companyName;
  const banner = [
    existing ? `Purchase quote ${existing.id}` : "Purchase quote (new)",
    companyName,
    supplierDefaults
      ? `Tel: ${supplierDefaults.telephone ?? "-"}, Fax:${supplierDefaults.fax ? ` ${supplierDefaults.fax}` : ""}`
      : null,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit} className="space-y-6">
        <FormError>{state.error}</FormError>

        <PurchaseQuoteToolbar existing={existing} isSaving={isPending} />

        <section className="space-y-4 rounded-lg border p-4">
          <div className="space-y-1">
            <h1 className="text-lg font-semibold">
              {banner} - {statusLabel}
            </h1>
            <p className="text-sm text-muted-foreground">
              Creation date:{" "}
              {formatDateValue(existing?.createdAt ?? todayDateString())}
              {existing?.purchaseRequestUuid && (
                <>
                  {" · "}
                  <Link
                    href={`/purchase-requests/${existing.purchaseRequestUuid}`}
                    className="underline underline-offset-2 hover:text-foreground"
                  >
                    Quoted against its purchase request
                  </Link>
                </>
              )}
            </p>
          </div>

          <fieldset
            disabled={isReadOnly}
            className="grid gap-x-10 gap-y-6 lg:grid-cols-[3fr_2fr]"
          >
            <div className="space-y-6">
              <div className="space-y-3">
                {/* Supplier · Agent · Contact + Reference · Purchaser · Order
                    category — the purchase order's own block, field for
                    field. */}
                <PurchaseOrderInformationSection
                  supplierOptions={supplierOptions}
                  agentOptions={agentOptions}
                  contactOptions={contactOptions}
                  purchaserOptions={purchaserOptions}
                  isLoadingSupplierData={isLoadingSupplierData}
                  handleSupplierChange={handleSupplierChange}
                  handleAgentChange={handleAgentChange}
                  locked={locked}
                />
                {/* `Onze referentie` beside the supplier's `Reference`. */}
                <div className="grid grid-cols-2 gap-x-6">
                  <div>
                    <FormLabel htmlFor="ourReference">Our reference</FormLabel>
                    <Input id="ourReference" {...register("ourReference")} />
                  </div>
                </div>
              </div>

              {/* Greyed until a company is chosen, which then fills it. */}
              <section className="space-y-4">
                <h2 className="text-sm font-semibold">Finances</h2>
                <div className="max-w-sm">
                  <FormSelectField
                    control={form.control}
                    id="paymentTerms"
                    name="paymentTerms"
                    label="Payment Terms"
                    options={paymentTermOptions}
                    emptyValue=""
                    disabled={!hasSupplier}
                  />
                </div>
              </section>

              <PurchaseQuoteDeliverySection
                arrangeTransport={arrangeTransport}
                pickupDropoffCdPurchases={pickupDropoffCdPurchases}
                deliveryTermOptions={deliveryTermOptions}
                deliveryAddressOptions={deliveryAddressOptions}
                supplierAddressOptions={supplierAddressOptions}
                handleDeliveryDateChange={handleDeliveryDateChange}
              />
            </div>

            <div className="space-y-6">
              <PurchaseQuoteTypeSection
                purchaseOrderTypeOptions={purchaseOrderTypeOptions}
                weightTypeOptions={weightTypeOptions}
                locked={locked}
              />
              <PurchaseQuoteFollowUpSection existing={existing} />
              <PurchaseQuoteSummary items={items ?? []} existing={existing} />
            </div>
          </fieldset>
        </section>

        <div className="space-y-2">
          <PurchaseQuoteLines
            itemFields={itemFields}
            appendItem={appendItem}
            removeItem={removeItem}
            readOnly={isReadOnly}
            isPending={isPending}
            statusLabel={statusLabel}
          />

          <PurchaseOrderNewPanels
            panels={[QUOTE_OPTIONS_PANEL, ...panelsNamed(["Texts"])]}
          />

          <CollapsibleSection
            title="Documents"
            summary={`${documents?.length ?? 0} Documents`}
          >
            <div className="space-y-2 p-3">
              {documents?.map((doc, index) => (
                <div key={doc.id} className="flex items-center gap-3 text-sm">
                  <span className="flex-1">{doc.fileName}</span>
                  {!isReadOnly && (
                    <button
                      type="button"
                      onClick={async () => {
                        await fetch(`/api/documents/${doc.id}/delete`, {
                          method: "DELETE",
                        });
                        setValue(
                          "documents",
                          (documents ?? []).filter((_, i) => i !== index),
                        );
                      }}
                      className="text-muted-foreground hover:text-destructive"
                      aria-label="Remove"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              {!isReadOnly && (
                <DocumentUploader
                  onSuccess={(uploads) => {
                    setValue("documents", [
                      ...(form.getValues("documents") ?? []),
                      ...uploads.map((u) => ({
                        id: u.documentId,
                        fileName: u.fileName,
                      })),
                    ]);
                  }}
                />
              )}
            </div>
          </CollapsibleSection>

          <PurchaseOrderNewPanels panels={panelsNamed(["PDF Files"])} />
        </div>

        {isReadOnly ? (
          <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            This quote has already been decided ({statusLabel}). An awarded
            quote is what the purchase order raised from it is priced on, and
            an expired or lost one is closed, so its terms can no longer be
            changed.
          </p>
        ) : (
          <FormActions
            submitLabel={isEditing ? "Save changes" : "Create Purchase Quote"}
            pendingLabel={isEditing ? "Saving..." : "Creating..."}
            isPending={isPending}
            onCancel={handleCancel}
          />
        )}
      </form>
    </FormProvider>
  );
};
