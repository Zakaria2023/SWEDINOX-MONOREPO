"use client";

import { useState } from "react";
import { FormProvider } from "react-hook-form";
import { usePurchaseRequestSubmit } from "@/app/(dashboard)/purchase-requests/use-purchase-request-submit";
import { CompanyOption } from "@/app/(dashboard)/companies/actions";
import { PurchaseRequestDetail } from "@/app/(dashboard)/purchase-requests/actions";
import { PurchaseRequestFormValues } from "@/app/(dashboard)/purchase-requests/validation";
import {
  NewOrderPanel,
  panelsNamed,
  PurchaseOrderNewPanels,
} from "@/components/purchase-orders/purchase-order-new-panels";
import { PurchaseOrderInformationSection } from "@/components/purchase-orders/sections/purchase-order-information-section";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { DocumentCell } from "@/components/ui/document-cell";
import { FormActions } from "@/components/ui/form-actions";
import { FormError } from "@/components/ui/form-error";
import { FormSelectField } from "@/components/ui/form-select-field";
import { ClerkUserOption } from "@/lib/server/clerk";
import {
  canEditPurchaseRequestLines,
  formatDateValue,
  isPurchaseRequestEditable,
  orDash,
  pluralize,
  todayDateString,
} from "@/lib/helpers";
import { PURCHASE_REQUEST_STATUS_LABELS } from "@/lib/labels";
import {
  PurchaseRequestForLines,
  PurchaseRequestLines,
} from "./purchase-request-lines";
import { PurchaseRequestOrderDialog } from "./purchase-request-order-dialog";
import { PurchaseRequestQuoteDialog } from "./purchase-request-quote-dialog";
import { PurchaseRequestQuotesPanel } from "./purchase-request-quotes-panel";
import { PurchaseRequestToolbar } from "./purchase-request-toolbar";
import { PurchaseRequestDeliverySection } from "./sections/purchase-request-delivery-section";
import { PurchaseRequestTypeSection } from "./sections/purchase-request-type-section";

// What the reference stacks under a request's lines, empty until it is saved.
const REQUEST_DOCUMENTS_PANEL: NewOrderPanel = {
  title: "Documents",
  summary: "0 Documents",
  toolbar: ["New"],
  columns: ["Name", "Type", "Uploaded"],
  empty: "Documents are attached to a saved request.",
};

/** The two windows a saved request's toolbar opens. */
type RequestDialog = "quote" | "order";

type Props = {
  companies: CompanyOption[];
  clerkUsers: ClerkUserOption[];
  /** The saved request; omitted when creating one. */
  existing?: PurchaseRequestDetail | null;
  defaultValues?: PurchaseRequestFormValues;
};

/**
 * The reference's `Purchase request` window (blank, 11-10-2026): the toolbar,
 * the header — the document on the left, its type, stamps, follow-up and
 * deadline on the right — then `Lines`, `Texts`, `Documents` and `PDF Files`.
 *
 * One screen, new or saved: a saved request is the form it was typed on, with
 * the quotes it was answered with under its lines. Once it leaves draft —
 * made final, or asked out — its header and lines are the question asked and
 * grey; once it is awarded or cancelled nothing more is raised from it.
 */
export const PurchaseRequestForm = ({
  companies,
  clerkUsers,
  existing = null,
  defaultValues,
}: Props) => {
  const [dialog, setDialog] = useState<RequestDialog | null>(null);

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
  } = usePurchaseRequestSubmit({
    companies,
    clerkUsers,
    purchaseRequestUuid: existing?.uuid,
    defaultValues,
  });

  // The reference's banner, as on a purchase order: `Purchase request, {supplier},
  // Tel: …, Fax:` — no fax prints as nothing.
  const banner = [
    existing ? `Purchase request ${existing.id}` : "Purchase request",
    supplierDefaults?.companyName,
    supplierDefaults
      ? `Tel: ${supplierDefaults.telephone ?? "-"}, Fax:${supplierDefaults.fax ? ` ${supplierDefaults.fax}` : ""}`
      : null,
  ]
    .filter(Boolean)
    .join(", ");

  // Draft is the only state in which the request can still be changed.
  const isReadOnly =
    existing !== null && !canEditPurchaseRequestLines(existing.status);
  const canAnswer =
    existing !== null && isPurchaseRequestEditable(existing.status);
  const openQuote = canAnswer ? () => setDialog("quote") : null;
  const openOrder = canAnswer ? () => setDialog("order") : null;
  const closeDialog = (open: boolean) => {
    if (!open) {
      setDialog(null);
    }
  };

  // `For line`: the sales order line each saved line is bought for.
  const forLines: PurchaseRequestForLines = {};
  for (const item of existing?.items ?? []) {
    if (item.forOrderItemUuid && item.forOrderUuid) {
      forLines[item.forOrderItemUuid] = {
        orderUuid: item.forOrderUuid,
        label: `${item.forOrderId ?? ""}${item.forOrderLine ? `/${item.forOrderLine}` : ""}`,
      };
    }
  }

  const texts = existing?.texts ?? [];
  const documentCount = existing?.documents?.length ?? 0;

  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit} className="space-y-6">
        <FormError>{state.error}</FormError>

        <PurchaseRequestToolbar
          existing={existing}
          isPending={isPending}
          isDirty={form.formState.isDirty}
          onPurchaseQuote={() => setDialog("quote")}
          onPurchaseOrder={() => setDialog("order")}
        />

        <section className="space-y-4 rounded-lg border p-4">
          <h1 className="text-lg font-semibold">
            {banner}
            {` - ${PURCHASE_REQUEST_STATUS_LABELS[existing?.status ?? "draft"]}`}
          </h1>

          {/* Every header field greys once the request has left draft. */}
          <fieldset
            disabled={isReadOnly}
            className="grid gap-x-10 gap-y-6 lg:grid-cols-[3fr_2fr]"
          >
            <div className="space-y-6">
              <p className="text-sm text-muted-foreground">
                Creation date:{" "}
                {formatDateValue(existing?.createdAt ?? todayDateString())}
              </p>

              {/* Supplier · Agent · Contact + Reference · Purchaser · Order
                  category — the purchase order's own block, field for field. */}
              <PurchaseOrderInformationSection
                supplierOptions={supplierOptions}
                agentOptions={agentOptions}
                contactOptions={contactOptions}
                purchaserOptions={purchaserOptions}
                isLoadingSupplierData={isLoadingSupplierData}
                handleSupplierChange={handleSupplierChange}
                handleAgentChange={handleAgentChange}
                locked={false}
              />

              {/* Greyed until a supplier is chosen, which then fills it. */}
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

              <PurchaseRequestDeliverySection
                arrangeTransport={arrangeTransport}
                pickupDropoffCdPurchases={pickupDropoffCdPurchases}
                deliveryTermOptions={deliveryTermOptions}
                deliveryAddressOptions={deliveryAddressOptions}
                supplierAddressOptions={supplierAddressOptions}
                handleDeliveryDateChange={handleDeliveryDateChange}
              />
            </div>

            <PurchaseRequestTypeSection
              purchaseOrderTypeOptions={purchaseOrderTypeOptions}
              weightTypeOptions={weightTypeOptions}
            />
          </fieldset>
        </section>

        <div className="space-y-2">
          <PurchaseRequestLines
            itemFields={itemFields}
            appendItem={appendItem}
            removeItem={removeItem}
            readOnly={isReadOnly}
            isPending={isPending}
            forLines={forLines}
            onPurchaseOrder={openOrder}
            onPurchaseQuote={openQuote}
          />

          {existing ? (
            <>
              <PurchaseRequestQuotesPanel
                request={existing}
                onAskSuppliers={() => setDialog("quote")}
              />

              <CollapsibleSection
                title="Texts"
                summary={`${texts.length} ${pluralize(texts.length, "text")}`}
              >
                {texts.length === 0 ? (
                  <p className="p-3 text-sm text-muted-foreground">
                    No texts on this purchase request.
                  </p>
                ) : (
                  <ul className="space-y-3 p-3">
                    {texts.map((text) => (
                      <li key={text.uuid} className="text-sm">
                        <p className="font-medium">{orDash(text.title)}</p>
                        <p className="whitespace-pre-wrap text-muted-foreground">
                          {orDash(text.textBlock)}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </CollapsibleSection>

              <CollapsibleSection
                title="Documents"
                summary={`${documentCount} ${pluralize(documentCount, "Document")}`}
              >
                <div className="p-3">
                  <DocumentCell documents={existing.documents} />
                </div>
              </CollapsibleSection>

              <PurchaseOrderNewPanels panels={panelsNamed(["PDF Files"])} />
            </>
          ) : (
            <PurchaseOrderNewPanels
              panels={[
                ...panelsNamed(["Texts"]),
                REQUEST_DOCUMENTS_PANEL,
                ...panelsNamed(["PDF Files"]),
              ]}
            />
          )}
        </div>

        {isReadOnly ? (
          <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            {existing?.status === "cancelled"
              ? "This request is cancelled."
              : existing?.status === "awarded"
                ? "This request has been awarded — a purchase order was raised from it."
                : "This request is final. Ask suppliers to quote, or order it outright, from the toolbar."}
          </p>
        ) : (
          <FormActions
            submitLabel={
              isEditing ? "Save Purchase Request" : "Create Purchase Request"
            }
            pendingLabel={isEditing ? "Saving..." : "Creating..."}
            isPending={isPending}
            onCancel={handleCancel}
          />
        )}
      </form>

      {/* Outside the form, so their own submits never save the request. */}
      {existing && (
        <>
          <PurchaseRequestQuoteDialog
            request={existing}
            companies={companies}
            open={dialog === "quote"}
            onOpenChange={closeDialog}
          />
          <PurchaseRequestOrderDialog
            request={existing}
            companies={companies}
            open={dialog === "order"}
            onOpenChange={closeDialog}
          />
        </>
      )}
    </FormProvider>
  );
};
