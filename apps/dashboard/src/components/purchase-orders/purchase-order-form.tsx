"use client";

import { FormProvider, useWatch } from "react-hook-form";
import { usePurchaseOrderSubmit } from "@/app/(dashboard)/purchase-orders/use-purchase-order-submit";
import {
  PurchaseOrderDetail,
  YardDeliveryAddress,
} from "@/app/(dashboard)/purchase-orders/actions";
import { PurchaseOrderFormValues } from "@/app/(dashboard)/purchase-orders/validation";
import { CompanyOption } from "@/app/(dashboard)/companies/actions";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { FormActions } from "@/components/ui/form-actions";
import { FormError } from "@/components/ui/form-error";
import { PurchaseOrderInformationSection } from "./sections/purchase-order-information-section";
import { PurchaseOrderItemsSection } from "./sections/purchase-order-items-section";
import { PurchaseOrderTypeSection } from "./sections/purchase-order-type-section";
import { PurchaseOrderFinancesSection } from "./sections/purchase-order-finances-section";
import { PurchaseOrderDeliverySection } from "./sections/purchase-order-delivery-section";
import { PurchaseOrderLogisticsSection } from "./sections/purchase-order-logistics-section";
import {
  NEW_ORDER_PANELS_AFTER_LOGISTICS,
  NEW_ORDER_PANELS_BEFORE_LOGISTICS,
  PurchaseOrderNewPanels,
  WORK_ORDER_PANELS,
} from "./purchase-order-new-panels";
import { PurchaseOrderRemarksSection } from "./sections/purchase-order-remarks-section";
import {
  amountForWeight,
  formatDateValue,
  formatMoney,
  formatNumber,
  todayDateString,
  VAT_CODE_RATE,
} from "@/lib/helpers";
import { PURCHASE_ORDER_STATUS_LABELS } from "@/lib/labels";
import { ClerkUserOption } from "@/lib/server/clerk";

type Props = {
  companies: CompanyOption[];
  clerkUsers: ClerkUserOption[];
  currentUserId: string;
  yardAddress: YardDeliveryAddress | null;
  /** The saved order: the Edit screen is this same screen, prefilled. */
  existing?: PurchaseOrderDetail | null;
};

type SummaryProps = {
  items: PurchaseOrderFormValues["items"];
};

/**
 * The reference's `Summary` block, live while the order is typed: `Materials`
 * · `Options` · `Surcharges` · `Tot. excl. VAT` · `VAT` · `Tot. incl. VAT` ·
 * `Total weight`. Options and surcharges are added to a saved order, so here
 * they read € 0,00.
 *
 * VAT is struck at the standard rate: 10 plates at € 2.500/TN came to
 * € 785,00, VAT € 164,85, € 949,85 in all (404355, 9-10-2026).
 */
const PurchaseOrderSummary = ({ items }: SummaryProps) => {
  const totals = items.reduce(
    (acc, line) => {
      const quantity = Number(line.quantity ?? 0);
      const pieceWeightKg = Number(line.pieceWeightKg ?? 0);
      const netPrice = Number(line.netPrice ?? 0);
      const weightKg = pieceWeightKg > 0 ? pieceWeightKg * quantity : 0;
      const amount =
        quantity > 0 && netPrice > 0
          ? amountForWeight(netPrice, line.priceUnit ?? null, weightKg, {
              quantity,
            })
          : 0;
      return {
        materials: acc.materials + amount,
        weightKg: acc.weightKg + weightKg,
      };
    },
    { materials: 0, weightKg: 0 },
  );
  const vat = (totals.materials * VAT_CODE_RATE.vat_high_21) / 100;

  const rows: Array<[string, string, boolean?]> = [
    ["Materials", formatMoney(totals.materials)],
    ["Options", formatMoney(0)],
    ["Surcharges", formatMoney(0), true],
    ["Tot. excl. VAT", formatMoney(totals.materials)],
    ["VAT", formatMoney(vat), true],
    ["Tot. incl. VAT", formatMoney(totals.materials + vat)],
    ["Total weight", `${formatNumber(totals.weightKg)} Kg`],
  ];

  return (
    <section className="space-y-2">
      <h2 className="text-sm font-semibold">Summary</h2>
      <dl className="grid grid-cols-[1fr_auto] gap-x-6 gap-y-1 text-sm">
        <dt />
        <dd className="text-right text-xs text-muted-foreground">Revenue</dd>
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

export const PurchaseOrderForm = ({
  companies,
  clerkUsers,
  currentUserId,
  yardAddress,
  existing = null,
}: Props) => {
  const {
    form,
    isPending,
    onSubmit,
    state,
    arrangeTransport,
    supplierOptions,
    agentOptions,
    contactOptions,
    supplierAddressOptions,
    itemFields,
    appendItem,
    removeItem,
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
  } = usePurchaseOrderSubmit({
    companies,
    clerkUsers,
    currentUserId,
    yardAddress,
    existing,
  });

  const items = useWatch({ control: form.control, name: "items" });
  // Once a line exists the reference greys the supplier, the order type, the
  // weight type, Overlength and the delivery date (404355, 9-10-2026): a line
  // was priced and weighed on them, so they are no longer the header's to
  // change.
  const locked = itemFields.length > 0;

  // The reference's banner: `Purchase order 404355, Holland Stainless Int,
  // Tel: 06 5065 6338, Fax: - Provisional`. The number is handed out on save
  // here, so until then the banner says so.
  const banner = [
    existing ? `Purchase order ${existing.id}` : "Purchase order (new)",
    supplierDefaults?.companyName,
    supplierDefaults
      ? `Tel: ${supplierDefaults.telephone ?? "-"}, Fax: ${supplierDefaults.fax ?? "-"}`
      : null,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit} className="space-y-6">
        <FormError>{state.error}</FormError>

        {/* The reference's header: the document on the left, its type and
            summary on the right. */}
        <section className="space-y-4 rounded-lg border p-4">
          <div className="space-y-1">
            <h1 className="text-lg font-semibold">
              {banner} -{" "}
              {PURCHASE_ORDER_STATUS_LABELS[existing?.status ?? "provisional"]}
              {existing?.isPrinted ? ", Printed" : ""}
              {existing?.isMailed ? ", Mailed" : ""}
            </h1>
            <p className="text-sm text-muted-foreground">
              Creation date:{" "}
              {formatDateValue(existing?.orderDate ?? todayDateString())}
            </p>
          </div>

          <div className="grid gap-x-10 gap-y-6 lg:grid-cols-[3fr_2fr]">
            <div className="space-y-6">
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
              <PurchaseOrderFinancesSection
                paymentTermOptions={paymentTermOptions}
              />
              <PurchaseOrderDeliverySection
                arrangeTransport={arrangeTransport}
                deliveryTermOptions={deliveryTermOptions}
                supplierAddressOptions={supplierAddressOptions}
                yardAddress={yardAddress}
                handleDeliveryDateChange={handleDeliveryDateChange}
                locked={locked}
              />
            </div>
            <div className="space-y-8">
              <PurchaseOrderTypeSection
                purchaseOrderTypeOptions={purchaseOrderTypeOptions}
                weightTypeOptions={weightTypeOptions}
                locked={locked}
              />
              <PurchaseOrderSummary items={items ?? []} />
            </div>
          </div>
        </section>

        {/* On a saved order the work orders, the lines and the panels are
            the order page's own, under this header; here they are typed. */}
        {!existing && (
          <>
        <section className="space-y-2">
          <h2 className="border-b pb-2 text-base font-semibold">Workorders</h2>
          <PurchaseOrderNewPanels panels={WORK_ORDER_PANELS} />
        </section>

        {/* Lines are typed on a new order; on a saved one they are the order
            page's, where each has its receipts and stock behind it. */}
        <PurchaseOrderItemsSection
          itemFields={itemFields}
          appendItem={appendItem}
          removeItem={removeItem}
          readOnly={existing !== null}
        />

        {/* Everything the reference stacks under the lines, in its order, empty
            and with its actions greyed until the order exists. */}
        <div className="space-y-2">
          <PurchaseOrderNewPanels panels={NEW_ORDER_PANELS_BEFORE_LOGISTICS} />
          <CollapsibleSection title="Logistics">
            <div className="p-3">
              <PurchaseOrderLogisticsSection />
            </div>
          </CollapsibleSection>
          <PurchaseOrderNewPanels panels={NEW_ORDER_PANELS_AFTER_LOGISTICS} />
        </div>
          </>
        )}

        <PurchaseOrderRemarksSection />

        <FormActions
          submitLabel={existing ? "Save changes" : "Create Purchase Order"}
          pendingLabel={existing ? "Saving..." : "Creating..."}
          isPending={isPending}
          onCancel={handleCancel}
        />
      </form>
    </FormProvider>
  );
};
