"use client";

import { useEffect, useRef, useState } from "react";
import { FormProvider } from "react-hook-form";
import { CompanyOption } from "@/app/(dashboard)/companies/actions";
import { ContractForProjectOption } from "@/app/(dashboard)/contracts/actions";
import { ProductPricingOption } from "@/app/(dashboard)/products/actions";
import { QuoteDetail } from "@/app/(dashboard)/quotes/actions";
import { quoteDetailToFormValues } from "@/app/(dashboard)/quotes/mappers";
import { useQuoteSubmit } from "@/app/(dashboard)/quotes/use-quote-submit";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { FormActions } from "@/components/ui/form-actions";
import { FormError } from "@/components/ui/form-error";
import { QuoteLinePanels } from "@/components/quotes/quote-line-panels";
import { QuoteLines } from "@/components/quotes/quote-lines";
import {
  QuoteCustomerPanels,
  QuoteOptionsPanel,
} from "@/components/quotes/quote-related-panels";
import { QuoteSummaryPanel } from "@/components/quotes/quote-summary";
import { QuoteTabs } from "@/components/quotes/quote-tabs";
import { QuoteToolbar } from "@/components/quotes/quote-toolbar";
import { QuoteDeliverySection } from "@/components/quotes/sections/quote-delivery-section";
import { QuoteFinancesSection } from "@/components/quotes/sections/quote-finances-section";
import { QuoteIdentitySection } from "@/components/quotes/sections/quote-identity-section";
import { QuoteOrderTypeSection } from "@/components/quotes/sections/quote-order-type-section";
import { QuoteSurchargesSection } from "@/components/quotes/sections/surcharges-section";
import { formatDateValue, pluralize, todayDateString } from "@/lib/helpers";
import {
  INVOICE_PAYMENT_TERM_LABELS,
  ORDER_STATUS_LABELS,
} from "@/lib/labels";
import { ClerkUserOption } from "@/lib/server/clerk";

type Props = {
  companies: CompanyOption[];
  clerkUsers: ClerkUserOption[];
  contracts: ContractForProjectOption[];
  products: ProductPricingOption[];
  /** The saved quote: its own page is this same screen, prefilled. */
  existing?: QuoteDetail | null;
  /** The signed-in user; a new quote's Seller starts as them (#392). */
  defaultSeller?: string;
};

/**
 * A sales quote, in the reference's document window — the same window a sales
 * order opens in. A new quote and a saved one are this one screen: the
 * toolbar, the header (who and when on the left; the order type, the
 * sent-stamps and the money on the right), the lines, the panels that follow
 * the selected line, and the Texts / Documents / PDF files tabs.
 */
export const QuoteForm = ({
  companies,
  clerkUsers,
  contracts,
  products,
  existing = null,
  defaultSeller,
}: Props) => {
  const {
    form,
    isPending,
    onSubmit,
    state,
    summary,
    lineFigures,
    isEditing,
    companyOptions,
    contactOptions,
    projectOptions,
    contractOptions,
    addressOptions,
    requestMethodOptions,
    deliveryTermOptions,
    weightTypeOptions,
    consignmentDurationOptions,
    consignmentDurationUnitOptions,
    paymentTermOptions,
    isLoadingCompanyData,
    handleCompanyChange,
    handleCancel,
  } = useQuoteSubmit({
    companies,
    contracts,
    products,
    existing,
    defaultValues: existing ? quoteDetailToFormValues(existing) : undefined,
    defaultSeller,
  });
  const { control, register, reset, watch } = form;
  const [selectedLine, setSelectedLine] = useState<number | null>(null);

  // Saving re-prices the lines and Finalize stamps the quote date, Valid u/i
  // and Printed — both on the server, which then re-renders this page. The
  // screen follows what was saved rather than holding (and saving back) what
  // it opened with. Neither runs with unsaved edits, so nothing typed is lost.
  const savedAt = existing ? new Date(existing.updatedAt).getTime() : null;
  const syncedAt = useRef(savedAt);
  useEffect(() => {
    if (!existing || savedAt === syncedAt.current) {
      return;
    }
    syncedAt.current = savedAt;
    reset(quoteDetailToFormValues(existing));
  }, [existing, savedAt, reset]);

  // An expired or converted quote is read-only (#395): updateQuote refuses it,
  // so the screen does not pretend otherwise.
  const isConverted =
    existing?.status === "converted" ||
    (existing?.items.some((item) => item.convertedToOrderUuid) ?? false);
  const isExpired = existing?.status === "expired" || Boolean(existing?.expired);
  const isReadOnly = existing !== null && (isConverted || isExpired);

  // The reference's banner: `Quote 300009, Stappert Intramet S.A., Tel: 4275
  // 8211, Fax: 4275 8290 - Expired, Printed, Mailed` (#395).
  const banner = existing
    ? `${[
        `Quote ${existing.id}`,
        existing.companyName,
        `Tel: ${existing.companyTelephone ?? "-"}`,
        `Fax: ${existing.companyFax ?? "-"}`,
      ]
        .filter(Boolean)
        .join(", ")} - ${[
        ORDER_STATUS_LABELS[existing.status],
        existing.isPrinted && "Printed",
        existing.isMailed && "Mailed",
        existing.isFaxed && "Faxed",
      ]
        .filter(Boolean)
        .join(", ")}`
    : "Quote (new) - Provisional";
  const deliveryDate = watch("deliveryDate");
  const paymentTerms = watch("paymentTerms");

  const selectedFigures =
    selectedLine === null ? undefined : lineFigures[selectedLine];
  const selectedSavedLine =
    selectedLine !== null && selectedFigures?.saved
      ? existing?.items[selectedLine]
      : undefined;

  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit} className="space-y-6">
        <FormError>{state.error}</FormError>

        <QuoteToolbar quote={existing} />

        <section className="space-y-4 rounded-lg border p-4">
          <div className="space-y-1">
            <h1 className="text-lg font-semibold">{banner}</h1>
            <p className="text-sm text-muted-foreground">
              Creation date:{" "}
              {formatDateValue(existing?.createdAt ?? todayDateString())} -
              Delivery planned: {formatDateValue(deliveryDate || null)}
            </p>
          </div>

          <fieldset
            disabled={isReadOnly}
            className="grid gap-x-10 gap-y-6 xl:grid-cols-2"
          >
            <div className="space-y-6">
              <QuoteIdentitySection
                companyOptions={companyOptions}
                contactOptions={contactOptions}
                projectOptions={projectOptions}
                contractOptions={contractOptions}
                requestMethodOptions={requestMethodOptions}
                clerkUsers={clerkUsers}
                isLoadingCompanyData={isLoadingCompanyData}
                handleCompanyChange={handleCompanyChange}
              />
              <QuoteDeliverySection
                deliveryTermOptions={deliveryTermOptions}
                addressOptions={addressOptions}
              />
            </div>
            <div className="min-w-0 space-y-8">
              <QuoteOrderTypeSection
                weightTypeOptions={weightTypeOptions}
                consignmentDurationOptions={consignmentDurationOptions}
                consignmentDurationUnitOptions={consignmentDurationUnitOptions}
              />
              <QuoteSummaryPanel
                summary={summary}
                note={
                  lineFigures.some((figures) => !figures.saved)
                    ? "An estimate from list prices. The saved quote is recalculated with the customer's contract terms."
                    : undefined
                }
              />
            </div>
          </fieldset>
        </section>

        {/* The panels the reference stacks under the header, in its order.
            Only Lines is open. */}
        <div className="space-y-2">
          <CollapsibleSection
            title="Lines"
            summary={pluralize(lineFigures.length, "line")}
            defaultOpen
          >
            <QuoteLines
              products={products}
              lineFigures={lineFigures}
              savedItems={existing?.items ?? []}
              selectedLine={selectedLine}
              onSelectLine={setSelectedLine}
              readOnly={isReadOnly}
            />
          </CollapsibleSection>

          <QuoteOptionsPanel
            quote={existing}
            selectedLine={selectedLine}
            readOnly={isReadOnly}
          />

          <CollapsibleSection
            title="Surcharges"
            summary={pluralize(watch("surcharges").length, "surcharge")}
          >
            <fieldset disabled={isReadOnly} className="p-3">
              <QuoteSurchargesSection
                control={control}
                register={register}
                companyOptions={companyOptions}
              />
            </fieldset>
          </CollapsibleSection>

          <QuoteLinePanels
            selectedLine={selectedLine}
            savedLine={selectedSavedLine}
            figures={selectedFigures}
          />

          <CollapsibleSection
            title="Finances"
            summary={`Payment terms: ${
              paymentTerms ? INVOICE_PAYMENT_TERM_LABELS[paymentTerms] : "—"
            }`}
          >
            <fieldset disabled={isReadOnly} className="p-3">
              <QuoteFinancesSection
                paymentTermOptions={paymentTermOptions}
                addressOptions={addressOptions}
              />
            </fieldset>
          </CollapsibleSection>

          {existing && <QuoteCustomerPanels quote={existing} />}
        </div>

        <QuoteTabs readOnly={isReadOnly} />

        {isReadOnly ? (
          <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            {isConverted
              ? "This quote has been turned into an order. Its lines are the order's now, so the quote can no longer be changed."
              : "This quote has expired. Its header is read-only."}
          </p>
        ) : (
          <FormActions
            submitLabel={isEditing ? "Save changes" : "Create Quote"}
            pendingLabel={isEditing ? "Saving..." : "Creating..."}
            isPending={isPending}
            onCancel={handleCancel}
          />
        )}
      </form>
    </FormProvider>
  );
};
