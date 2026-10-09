"use client";

import { FormProvider, useWatch } from "react-hook-form";
import { usePurchaseOrderSubmit } from "@/app/(dashboard)/purchase-orders/use-purchase-order-submit";
import { YardDeliveryAddress } from "@/app/(dashboard)/purchase-orders/actions";
import { PurchaseOrderFormValues } from "@/app/(dashboard)/purchase-orders/validation";
import { CompanyOption } from "@/app/(dashboard)/companies/actions";
import { FormActions } from "@/components/ui/form-actions";
import { FormError } from "@/components/ui/form-error";
import { PurchaseOrderInformationSection } from "./sections/purchase-order-information-section";
import { PurchaseOrderItemsSection } from "./sections/purchase-order-items-section";
import { PurchaseOrderTypeSection } from "./sections/purchase-order-type-section";
import { PurchaseOrderFinancesSection } from "./sections/purchase-order-finances-section";
import { PurchaseOrderDeliverySection } from "./sections/purchase-order-delivery-section";
import { PurchaseOrderLogisticsSection } from "./sections/purchase-order-logistics-section";
import { PurchaseOrderRemarksSection } from "./sections/purchase-order-remarks-section";
import {
  amountForWeight,
  formatDateValue,
  formatMoney,
  formatNumber,
  todayDateString,
} from "@/lib/helpers";
import { PURCHASE_ORDER_STATUS_LABELS } from "@/lib/labels";
import { ClerkUserOption } from "@/lib/server/clerk";

type Props = {
  companies: CompanyOption[];
  clerkUsers: ClerkUserOption[];
  currentUserId: string;
  yardAddress: YardDeliveryAddress | null;
};

type SummaryProps = {
  items: PurchaseOrderFormValues["items"];
};

/**
 * The reference's `Summary` block, live while the order is typed: `Materials`
 * · `Options` · `Surcharges` · `Tot. excl. VAT` · `VAT` · `Tot. incl. VAT` ·
 * `Total weight`. Options and surcharges are added to a saved order, so here
 * they read € 0,00; VAT is not struck on a purchase order (the supplier's
 * invoice does that), which is why the reference prints € 0,00 for it.
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

  const rows: Array<[string, string]> = [
    ["Materials", formatMoney(totals.materials)],
    ["Options", formatMoney(0)],
    ["Surcharges", formatMoney(0)],
    ["Tot. excl. VAT", formatMoney(totals.materials)],
    ["VAT", formatMoney(0)],
    ["Tot. incl. VAT", formatMoney(totals.materials)],
    ["Total weight", `${formatNumber(totals.weightKg)} Kg`],
  ];

  return (
    <section className="space-y-2">
      <h2 className="border-b pb-2 text-base font-semibold">Summary</h2>
      <dl className="grid max-w-sm grid-cols-[1fr_auto] gap-x-6 gap-y-1 text-sm">
        {rows.map(([label, value]) => (
          <div key={label} className="contents">
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
  });

  const items = useWatch({ control: form.control, name: "items" });

  // The reference's banner: `Purchase order 404355, Holland Stainless Int,
  // Tel: 06 5065 6338, Fax: - Provisional`. The number is handed out on save
  // here, so until then the banner says so.
  const banner = [
    "Purchase order (new)",
    supplierDefaults?.companyName,
    supplierDefaults
      ? `Tel: ${supplierDefaults.telephone ?? "-"}, Fax: ${supplierDefaults.fax ?? "-"}`
      : null,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit} className="space-y-8">
        <FormError>{state.error}</FormError>

        <div className="space-y-1">
          <h1 className="text-lg font-semibold">
            {banner} - {PURCHASE_ORDER_STATUS_LABELS.provisional}
          </h1>
          <p className="text-sm text-muted-foreground">
            Creation date: {formatDateValue(todayDateString())}
          </p>
        </div>

        <PurchaseOrderInformationSection
          supplierOptions={supplierOptions}
          agentOptions={agentOptions}
          contactOptions={contactOptions}
          purchaserOptions={purchaserOptions}
          isLoadingSupplierData={isLoadingSupplierData}
          handleSupplierChange={handleSupplierChange}
          handleAgentChange={handleAgentChange}
        />

        <PurchaseOrderTypeSection
          purchaseOrderTypeOptions={purchaseOrderTypeOptions}
          weightTypeOptions={weightTypeOptions}
        />

        <PurchaseOrderFinancesSection paymentTermOptions={paymentTermOptions} />

        <PurchaseOrderDeliverySection
          arrangeTransport={arrangeTransport}
          deliveryTermOptions={deliveryTermOptions}
          supplierAddressOptions={supplierAddressOptions}
          yardAddress={yardAddress}
          handleDeliveryDateChange={handleDeliveryDateChange}
        />

        <PurchaseOrderSummary items={items ?? []} />

        <PurchaseOrderItemsSection
          itemFields={itemFields}
          appendItem={appendItem}
          removeItem={removeItem}
        />

        <PurchaseOrderLogisticsSection />

        <PurchaseOrderRemarksSection />

        <FormActions
          submitLabel="Create Purchase Order"
          pendingLabel="Creating..."
          isPending={isPending}
          onCancel={handleCancel}
        />
      </form>
    </FormProvider>
  );
};
