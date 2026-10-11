"use client";

import { FormProvider } from "react-hook-form";
import { usePurchaseRequestSubmit } from "@/app/(dashboard)/purchase-requests/use-purchase-request-submit";
import { CompanyOption } from "@/app/(dashboard)/companies/actions";
import { PurchaseRequestFormValues } from "@/app/(dashboard)/purchase-requests/validation";
import {
  NewOrderPanel,
  panelsNamed,
  PurchaseOrderNewPanels,
} from "@/components/purchase-orders/purchase-order-new-panels";
import { PurchaseOrderInformationSection } from "@/components/purchase-orders/sections/purchase-order-information-section";
import { FormActions } from "@/components/ui/form-actions";
import { FormError } from "@/components/ui/form-error";
import { FormSelectField } from "@/components/ui/form-select-field";
import { ClerkUserOption } from "@/lib/server/clerk";
import { formatDateValue, todayDateString } from "@/lib/helpers";
import { PURCHASE_REQUEST_STATUS_LABELS } from "@/lib/labels";
import { PurchaseRequestLines } from "./purchase-request-lines";
import {
  PurchaseRequestHeader,
  PurchaseRequestToolbar,
} from "./purchase-request-toolbar";
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

type Props = {
  companies: CompanyOption[];
  clerkUsers: ClerkUserOption[];
  /** The saved request when editing; omitted when creating one. */
  existing?: PurchaseRequestHeader | null;
  defaultValues?: PurchaseRequestFormValues;
  /**
   * False once the request has left draft: its lines are the question the
   * quotes on file are answering, so they are shown but no longer editable.
   */
  canEditLines?: boolean;
};

/**
 * The reference's `Purchase request` window (blank, 11-10-2026): the toolbar,
 * the header — the document on the left, its type, stamps, follow-up and
 * deadline on the right — then `Lines`, `Texts`, `Documents` and `PDF Files`.
 */
export const PurchaseRequestForm = ({
  companies,
  clerkUsers,
  existing = null,
  defaultValues,
  canEditLines = true,
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

  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit} className="space-y-6">
        <FormError>{state.error}</FormError>

        <PurchaseRequestToolbar existing={existing} isPending={isPending} />

        <section className="space-y-4 rounded-lg border p-4">
          <h1 className="text-lg font-semibold">
            {banner}
            {existing
              ? ` - ${PURCHASE_REQUEST_STATUS_LABELS[existing.status ?? "draft"]}`
              : ""}
          </h1>

          <div className="grid gap-x-10 gap-y-6 lg:grid-cols-[3fr_2fr]">
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
          </div>
        </section>

        <div className="space-y-2">
          <PurchaseRequestLines
            itemFields={itemFields}
            appendItem={appendItem}
            removeItem={removeItem}
            readOnly={!canEditLines}
            isPending={isPending}
            requestUuid={existing?.uuid ?? null}
          />

          <PurchaseOrderNewPanels
            panels={[
              ...panelsNamed(["Texts"]),
              REQUEST_DOCUMENTS_PANEL,
              ...panelsNamed(["PDF Files"]),
            ]}
          />
        </div>

        <FormActions
          submitLabel={
            isEditing ? "Save Purchase Request" : "Create Purchase Request"
          }
          pendingLabel={isEditing ? "Saving..." : "Creating..."}
          isPending={isPending}
          onCancel={handleCancel}
        />
      </form>
    </FormProvider>
  );
};
