"use client";

import { useEffect, useState } from "react";
import { FormProvider } from "react-hook-form";
import { CompanyOption } from "@/app/(dashboard)/companies/actions";
import {
  OrderCallOffAddressOption,
  OrderCallOffRow,
  OrderCommunicationRow,
  OrderCompetitorRow,
  OrderFormExtras,
  OrderHeaderInfo,
  OrderInvoiceLineRow,
  OrderLinePanels,
  OrderTextRow,
  OrderWorkOrders,
} from "@/app/(dashboard)/orders/[uuid]/actions";
import { OrderDetail } from "@/app/(dashboard)/orders/actions";
import {
  OrderLinePick,
  orderToFormValues,
} from "@/app/(dashboard)/orders/mappers";
import { useOrderSubmit } from "@/app/(dashboard)/orders/use-order-submit";
import { TextCategoryOption } from "@/app/(dashboard)/text-categories/actions";
import {
  ORDER_CALL_OFFS_PANEL,
  ORDER_COMPLAINTS_PANEL,
  ORDER_LINE_EMPTY_PANELS,
  ORDER_PDF_DOCUMENTS_PANEL,
  ORDER_PURCHASE_LINES_PANEL,
  ORDER_RECEIPTS_PANEL,
  ORDER_RETURN_LINES_PANEL,
  OrderEmptyPanels,
} from "@/components/orders/order-empty-panels";
import { OrderHeaderFields } from "@/components/orders/order-header-fields";
import { OrderLines } from "@/components/orders/order-lines";
import { OrderNewLines } from "@/components/orders/order-new-lines";
import { OrderToolbar } from "@/components/orders/order-toolbar";
import { OrderCallOffsPanel } from "@/components/orders/panels/order-call-offs-panel";
import {
  OrderCommunicationPanel,
  OrderCompetitorsPanel,
} from "@/components/orders/panels/order-communication-panel";
import { OrderInvoiceLinesPanel } from "@/components/orders/panels/order-invoice-lines-panel";
import { OrderLinePanelsView } from "@/components/orders/panels/order-line-panels";
import { OrderWorkOrdersPanel } from "@/components/orders/panels/order-work-orders-panel";
import { ContractsSection } from "@/components/orders/sections/contracts-section";
import { DocumentsSection } from "@/components/orders/sections/documents-section";
import { FinancesSection } from "@/components/orders/sections/finances-section";
import { LogisticsSection } from "@/components/orders/sections/logistics-section";
import { RemarksSection } from "@/components/orders/sections/remarks-section";
import { SurchargesSection } from "@/components/orders/sections/surcharges-section";
import { TextsSection } from "@/components/orders/sections/texts-section";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { FormActions } from "@/components/ui/form-actions";
import { FormError } from "@/components/ui/form-error";
import {
  computeQuoteSummary,
  formatDateColumn,
  orderSummaryFromSnapshot,
  orderTheoreticalWeightKg,
  pluralize,
  todayDateString,
} from "@/lib/helpers";
import { INVOICE_PAYMENT_TERM_LABELS, ORDER_STATUS_LABELS } from "@/lib/labels";
import { ClerkUserOption } from "@/lib/server/clerk";

const SAVE_FIRST = "Save the order first";

const NO_WORK_ORDERS: OrderWorkOrders = {
  warehouse: [],
  production: [],
  transport: [],
};

/** Everything a saved order's page loads for the screen below its form. */
export type SavedOrder = {
  order: OrderDetail;
  header: OrderHeaderInfo | null;
  extras: OrderFormExtras;
  workOrders: OrderWorkOrders;
  invoiceLines: OrderInvoiceLineRow[];
  /** Null only when the order has no lines at all to select from. */
  linePanels: OrderLinePanels | null;
  texts: OrderTextRow[];
  communications: OrderCommunicationRow[];
  competitors: OrderCompetitorRow[];
  /** Saved with `CD` lines just now: ask how each is to be purchased. */
  askPurchasing?: boolean;
  /** Only on a `Call-off` order. */
  callOffs: {
    rows: OrderCallOffRow[];
    addresses: OrderCallOffAddressOption[];
    userNames: Record<string, string>;
  } | null;
};

type Props = {
  companies: CompanyOption[];
  clerkUsers: ClerkUserOption[];
  textCategories: TextCategoryOption[];
  /** Who is signed in — a new order's seller. */
  currentUserId?: string;
  /** The saved order: its own page is this same screen, prefilled. */
  saved?: SavedOrder | null;
};

/**
 * A sales order as the reference draws it — one screen whether the order is
 * new or saved (100742, 10-9-2026; 102191 typed from blank, 21-9-2026). The
 * toolbar on top, the header in its groups with the summary beside it, then
 * the panels in the reference's order: `Workorders · Order lines` and the
 * selected line's own panels, then `Competitors · Contracts · Invoice lines ·
 * Finances · Purchase lines · Complaints · Logistics · Remark · Return lines ·
 * Texts · Surcharges · Documents · Communication · PDF Documents`.
 */
export const OrderForm = ({
  companies,
  clerkUsers,
  textCategories,
  currentUserId,
  saved = null,
}: Props) => {
  const order = saved?.order ?? null;
  const header = saved?.header ?? null;

  const {
    form,
    isPending,
    isEditing,
    onSubmit,
    state,
    isPickup,
    isConsignment,
    deliveryType,
    companyOptions,
    contactOptions,
    projectOptions,
    addressOptions,
    orderMethodOptions,
    deliveryTermOptions,
    orderTypeOptions,
    weightTypeOptions,
    paymentTermOptions,
    contracts,
    isLoadingCompanyData,
    handleCompanyChange,
    handleCancel,
    itemFields,
    appendItem,
    removeItem,
  } = useOrderSubmit({
    companies,
    orderUuid: order?.uuid,
    defaultValues: saved
      ? orderToFormValues(saved.order, saved.extras)
      : undefined,
    initialContracts: saved?.extras.contracts ?? [],
    currentCompany: order
      ? (companies.find((company) => company.uuid === order.companyUuid) ??
        null)
      : null,
    currentUserId,
  });

  const { watch, setValue } = form;

  // What each new line's `…` picked, keyed by the line's field id.
  const [picks, setPicks] = useState<Record<string, OrderLinePick>>({});
  const handlePick = (fieldId: string, pick: OrderLinePick | null) =>
    setPicks((current) => {
      const rest = Object.fromEntries(
        Object.entries(current).filter(([id]) => id !== fieldId),
      );
      return pick ? { ...rest, [fieldId]: pick } : rest;
    });

  // `Make final`, `Send…` and Finance's release change these on the server;
  // the header follows rather than holding (and saving back) what it opened
  // with.
  const serverPrinted = order ? (order.isPrinted ?? false) : undefined;
  const serverMailed = order ? (order.isMailed ?? false) : undefined;
  const serverFaxed = order ? (order.isFaxed ?? false) : undefined;
  const serverBlocked = order ? (order.financialBlockage ?? false) : undefined;
  const serverReason = order ? (order.blockingReason ?? "") : undefined;
  useEffect(() => {
    if (
      serverPrinted === undefined ||
      serverMailed === undefined ||
      serverFaxed === undefined ||
      serverBlocked === undefined ||
      serverReason === undefined
    ) {
      return;
    }
    setValue("isPrinted", serverPrinted);
    setValue("isMailed", serverMailed);
    setValue("isFaxed", serverFaxed);
    setValue("financialBlockage", serverBlocked);
    setValue("blockingReason", serverReason);
  }, [
    serverPrinted,
    serverMailed,
    serverFaxed,
    serverBlocked,
    serverReason,
    setValue,
  ]);

  const items = watch("items") ?? [];
  const orderType = watch("orderType");
  const companyUuid = watch("companyUuid");
  const contractUuids = watch("contractUuids") ?? [];
  const documents = watch("documents") ?? [];
  const paymentTerms = watch("paymentTerms");
  const texts = watch("texts") ?? [];

  // A cancelled order is a record, not a document anybody edits.
  const isReadOnly = order?.status === "cancelled";
  // Surcharges are measured against the lines, which only move while the
  // order is provisional.
  const areSurchargesLocked =
    isReadOnly || (order !== null && order.status !== "provisional");
  const hasLines = order ? order.items.length > 0 : itemFields.length > 0;

  // A saved order prints what it stored; a new one what is typed, with its
  // weight from the lots picked and its money struck when it is created.
  const summary = order
    ? {
        ...orderSummaryFromSnapshot(order),
        theoreticalWeightKg: orderTheoreticalWeightKg(order.items),
      }
    : computeQuoteSummary({
        lines: itemFields.map((field, index) => {
          const quantity = Number(
            (items[index]?.quantity ?? "0").replace(",", "."),
          );
          const weightKg = Number.isFinite(quantity)
            ? quantity * (picks[field.id]?.pieceWeightKg ?? 0)
            : 0;
          return {
            amount: 0,
            costAmount: 0,
            replacementCost: 0,
            weightKg,
            theoreticalWeightKg: weightKg,
          };
        }),
      });

  // The reference's banner: `Order 100785, Allva Edelstahl GmbH, Tel: …,
  // Fax: … - Partially invoiced, Printed, Mailed` — and `Blocked` while a
  // financial block holds it (102191, 21-9-2026).
  const banner = order
    ? `Order ${order.id}, ${order.companyName ?? "—"}, Tel: ${
        header?.telephone ?? ""
      }, Fax: ${header?.fax ?? ""} - ${[
        ORDER_STATUS_LABELS[order.status],
        order.financialBlockage ? "Blocked" : null,
        order.isPrinted ? "Printed" : null,
        order.isMailed ? "Mailed" : null,
        order.isFaxed ? "Faxed" : null,
      ]
        .filter(Boolean)
        .join(", ")}`
    : "Order";
  const datesLine = order
    ? `Creation date: ${formatDateColumn(order.createdAt)} - Delivery planned: ${formatDateColumn(order.deliveryDate)}${
        header?.deliveredOn
          ? ` - Delivered: ${formatDateColumn(header.deliveredOn)}`
          : ""
      }`
    : `Creation date: ${todayDateString()}`;

  const pickingWorkOrderUuid =
    saved?.workOrders.warehouse.find((row) => row.workOrderType === "picking")
      ?.workOrderUuid ?? null;
  const workOrders = saved?.workOrders ?? NO_WORK_ORDERS;
  const workOrderCount =
    workOrders.warehouse.length +
    workOrders.production.length +
    workOrders.transport.length;
  const lineCount = order ? order.items.length : itemFields.length;

  const selectedLine = order?.items.find(
    (item) => item.uuid === saved?.linePanels?.orderItemUuid,
  );
  const selectedLineLabel = [
    selectedLine?.lineNumber ? selectedLine.lineNumber * 10 : null,
    selectedLine?.productCode ?? null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <FormProvider {...form}>
      <form
        onSubmit={(event) => {
          // A dialog's own form (a call-off) bubbles its submit through here;
          // only this form's own submit saves the order.
          if (event.target !== event.currentTarget) {
            return;
          }
          void onSubmit(event);
        }}
        className="space-y-6"
      >
        <FormError>{state.error}</FormError>

        <OrderToolbar
          order={order}
          pickingWorkOrderUuid={pickingWorkOrderUuid}
        />

        <section className="space-y-4 rounded-lg border p-4">
          <div className="space-y-1">
            <h1 className="text-lg font-semibold">{banner}</h1>
            <p className="text-sm text-muted-foreground">{datesLine}</p>
          </div>

          <fieldset disabled={isReadOnly} className="min-w-0">
            <OrderHeaderFields
              companyOptions={companyOptions}
              contactOptions={contactOptions}
              projectOptions={projectOptions}
              addressOptions={addressOptions}
              orderMethodOptions={orderMethodOptions}
              deliveryTermOptions={deliveryTermOptions}
              orderTypeOptions={orderTypeOptions}
              weightTypeOptions={weightTypeOptions}
              clerkUsers={clerkUsers}
              isLoadingCompanyData={isLoadingCompanyData}
              handleCompanyChange={handleCompanyChange}
              isPickup={isPickup}
              isConsignment={isConsignment}
              deliveryType={deliveryType}
              isCustomerLocked={order !== null}
              hasLines={hasLines}
              header={header}
              summary={summary}
              summaryNote={
                order
                  ? undefined
                  : "Weights from the lots picked; prices are struck when the order is created."
              }
            />
          </fieldset>
        </section>

        <div className="space-y-2">
          {orderType === "call_off" &&
            (order && saved?.callOffs ? (
              <OrderCallOffsPanel
                orderUuid={order.uuid}
                rows={saved.callOffs.rows}
                addresses={saved.callOffs.addresses}
                userNames={saved.callOffs.userNames}
              />
            ) : (
              <OrderEmptyPanels
                panels={[ORDER_CALL_OFFS_PANEL]}
                reason={SAVE_FIRST}
              />
            ))}

          {/* Scoped to the ORDER: how it reaches the warehouse, the saw and
              the lorry. */}
          <CollapsibleSection
            title="Workorders"
            summary={`${workOrderCount} ${pluralize(workOrderCount, "line")}`}
            defaultOpen={workOrderCount > 0}
          >
            <OrderWorkOrdersPanel workOrders={workOrders} />
          </CollapsibleSection>

          <CollapsibleSection
            title="Order lines"
            summary={`${lineCount} ${pluralize(lineCount, "line")}`}
            defaultOpen
          >
            {order ? (
              <OrderLines
                order={order}
                selectedLineUuid={saved?.linePanels?.orderItemUuid ?? null}
                companies={companies}
                askPurchasingOnOpen={saved?.askPurchasing ?? false}
              />
            ) : (
              <OrderNewLines
                itemFields={itemFields}
                appendItem={appendItem}
                removeItem={removeItem}
                picks={picks}
                onPick={handlePick}
                canAdd={Boolean(companyUuid)}
              />
            )}
          </CollapsibleSection>

          {/* Scoped to the SELECTED line, the way the reference scopes them:
              a seller picks a line and then asks what stock there is, what
              this customer paid before, and what has shipped. */}
          {saved?.linePanels ? (
            <OrderLinePanelsView
              panels={saved.linePanels}
              lineLabel={selectedLineLabel}
              productCode={selectedLine?.productCode ?? null}
              texts={saved.texts}
              isProvisional={order?.status === "provisional"}
            />
          ) : (
            <OrderEmptyPanels
              panels={ORDER_LINE_EMPTY_PANELS}
              reason={order ? "Add a line first" : SAVE_FIRST}
            />
          )}
          <OrderEmptyPanels
            panels={[ORDER_RECEIPTS_PANEL]}
            reason="Not built yet"
          />

          <OrderCompetitorsPanel rows={saved?.competitors ?? []} />

          {/* `1 company contract(s), 0 project contract(s), 0 order
              contract(s)` (O108309, 16-10-2026). No contract is held on a
              project here, so that count is always 0. */}
          <CollapsibleSection
            title="Contracts"
            summary={`${
              contracts.filter(
                (contract) => !contractUuids.includes(contract.uuid),
              ).length
            } company contract(s), 0 project contract(s), ${
              contractUuids.length
            } order contract(s)`}
          >
            <fieldset disabled={isReadOnly} className="min-w-0">
              <ContractsSection contracts={contracts} />
            </fieldset>
          </CollapsibleSection>

          <OrderInvoiceLinesPanel rows={saved?.invoiceLines ?? []} />

          <CollapsibleSection
            title="Finances"
            summary={
              order?.financialBlockage
                ? "Blocked"
                : paymentTerms
                  ? `Payment terms: ${INVOICE_PAYMENT_TERM_LABELS[paymentTerms]}`
                  : "No payment terms set"
            }
          >
            <fieldset disabled={isReadOnly} className="min-w-0">
              <FinancesSection
                addressOptions={addressOptions}
                paymentTermOptions={paymentTermOptions}
                savedBlock={
                  order
                    ? {
                        orderUuid: order.uuid,
                        blocked: order.financialBlockage ?? false,
                      }
                    : null
                }
              />
            </fieldset>
          </CollapsibleSection>

          <OrderEmptyPanels
            panels={[ORDER_PURCHASE_LINES_PANEL, ORDER_COMPLAINTS_PANEL]}
            reason="Not built yet"
          />

          <CollapsibleSection
            title="Logistics"
            summary={header?.deliveryAddress?.country ?? undefined}
          >
            <fieldset disabled={isReadOnly} className="min-w-0">
              <LogisticsSection />
            </fieldset>
          </CollapsibleSection>

          <CollapsibleSection title="Remark">
            <fieldset disabled={isReadOnly} className="min-w-0">
              <RemarksSection />
            </fieldset>
          </CollapsibleSection>

          <OrderEmptyPanels
            panels={[ORDER_RETURN_LINES_PANEL]}
            reason="Not built yet"
          />

          <CollapsibleSection
            title="Texts"
            summary={`${texts.length} ${pluralize(texts.length, "text")}`}
          >
            <fieldset disabled={isReadOnly} className="min-w-0">
              <TextsSection textCategories={textCategories} />
            </fieldset>
          </CollapsibleSection>

          <CollapsibleSection
            title="Surcharges"
            summary={
              areSurchargesLocked && !isReadOnly
                ? "Fixed once the order is final"
                : undefined
            }
          >
            <fieldset disabled={areSurchargesLocked} className="min-w-0">
              <SurchargesSection companyOptions={companyOptions} />
            </fieldset>
          </CollapsibleSection>

          <CollapsibleSection
            title="Documents"
            summary={`${documents.length} ${pluralize(documents.length, "Document")}`}
          >
            <fieldset disabled={isReadOnly} className="min-w-0">
              <DocumentsSection />
            </fieldset>
          </CollapsibleSection>

          <OrderCommunicationPanel rows={saved?.communications ?? []} />

          <OrderEmptyPanels
            panels={[ORDER_PDF_DOCUMENTS_PANEL]}
            reason="Not built yet"
          />
        </div>

        {isReadOnly ? (
          <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            This order is cancelled, and the stock it held has been released.
            It can no longer be changed.
          </p>
        ) : (
          <FormActions
            submitLabel={isEditing ? "Save changes" : "Create Order"}
            pendingLabel={isEditing ? "Saving..." : "Creating..."}
            isPending={isPending}
            onCancel={handleCancel}
          />
        )}
      </form>
    </FormProvider>
  );
};
