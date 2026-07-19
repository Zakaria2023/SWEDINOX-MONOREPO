"use client";

import {
  AddressOption,
  getAddressesForCompany,
} from "@/app/(dashboard)/addresses/actions";
import { CompanyOption } from "@/app/(dashboard)/companies/actions";
import {
  ContactOption,
  getContactsForCompany,
} from "@/app/(dashboard)/contacts/actions";
import {
  getPurchaseOrdersForCompany,
  PurchaseOrderOption,
} from "@/app/(dashboard)/purchase-orders/actions";
import { SelectOption } from "@/components/shadcn/select";
import {
  InvoicePaymentTerm,
  invoicePaymentTerms,
  PurchaseOrderType,
  purchaseOrderTypes,
  PurchaseReturnOrderReason,
  purchaseReturnOrderReasons,
  TransportMode,
  transportModes,
  WarehouseTransportRegion,
  warehouseTransportRegions,
} from "@/lib/enums";
import {
  COMMON_TEXT,
  INVOICE_PAYMENT_TERM_LABELS,
  PURCHASE_ORDER_TYPE_LABELS,
  PURCHASE_RETURN_ORDER_REASON_LABELS,
  TRANSPORT_MODE_LABELS,
  WAREHOUSE_TRANSPORT_REGION_LABELS,
} from "@/lib/labels";
import { ClerkUserOption } from "@/lib/server/clerk";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import {
  createPurchaseReturnOrder,
  PurchaseReturnOrderActionResult,
  PurchaseReturnOrderExtras,
} from "./actions";
import {
  DEFAULT_PURCHASE_RETURN_ORDER,
  PurchaseReturnOrderFormValues,
  purchaseReturnOrderSchema,
} from "./validation";
import { toDecimal } from "@/lib/helpers";

type UsePurchaseReturnOrderSubmitParams = {
  companies: CompanyOption[];
  clerkUsers: ClerkUserOption[];
};

const emptyOpt = { value: "", label: COMMON_TEXT.emptyOption };

const makeOptions = <T extends string>(
  values: readonly T[],
  labels: Record<T, string>,
): SelectOption[] => [
  emptyOpt,
  ...values.map((v) => ({ value: v, label: labels[v] })),
];

const addressLabel = (a: AddressOption) =>
  [a.altName, a.streetAndNo, a.postalCode, a.city].filter(Boolean).join(", ") ||
  a.uuid;

export const usePurchaseReturnOrderSubmit = ({
  companies,
  clerkUsers,
}: UsePurchaseReturnOrderSubmitParams) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState<PurchaseReturnOrderActionResult>({});
  const [contacts, setContacts] = useState<ContactOption[]>([]);
  const [addresses, setAddresses] = useState<AddressOption[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrderOption[]>(
    [],
  );
  const [isLoadingSupplierData, setIsLoadingSupplierData] = useState(false);

  const form = useForm<PurchaseReturnOrderFormValues>({
    resolver: zodResolver(purchaseReturnOrderSchema),
    defaultValues: DEFAULT_PURCHASE_RETURN_ORDER,
  });

  const isDropOff = form.watch("isDropOff");

  const supplierCompanies = companies.filter((c) =>
    c.roles?.includes("supplier"),
  );

  const supplierOptions: SelectOption[] = [
    emptyOpt,
    ...supplierCompanies.map((c) => ({
      value: c.uuid,
      label: c.companyName ?? c.searchCode1 ?? c.uuid,
    })),
  ];

  const contactOptions: SelectOption[] = [
    emptyOpt,
    ...contacts.map((c) => ({
      value: c.uuid,
      label: [c.firstName, c.lastName].filter(Boolean).join(" ") || c.uuid,
    })),
  ];

  const addressOptions: SelectOption[] = [
    emptyOpt,
    ...addresses.map((a) => ({ value: a.uuid, label: addressLabel(a) })),
  ];

  const purchaseOrderOptions: SelectOption[] = [
    emptyOpt,
    ...purchaseOrders.map((o) => ({
      value: o.uuid,
      label: o.reference ? `#${o.id} — ${o.reference}` : `#${o.id}`,
    })),
  ];

  const purchaseOrderTypeOptions = makeOptions(
    purchaseOrderTypes,
    PURCHASE_ORDER_TYPE_LABELS as Record<PurchaseOrderType, string>,
  );

  const returnReasonOptions = makeOptions(
    purchaseReturnOrderReasons,
    PURCHASE_RETURN_ORDER_REASON_LABELS as Record<
      PurchaseReturnOrderReason,
      string
    >,
  );

  const paymentTermOptions = makeOptions(
    invoicePaymentTerms,
    INVOICE_PAYMENT_TERM_LABELS as Record<InvoicePaymentTerm, string>,
  );

  const transportRegionOptions = makeOptions(
    warehouseTransportRegions,
    WAREHOUSE_TRANSPORT_REGION_LABELS as Record<
      WarehouseTransportRegion,
      string
    >,
  );

  const transportModeOptions = makeOptions(
    transportModes,
    TRANSPORT_MODE_LABELS as Record<TransportMode, string>,
  );

  const purchaserOptions: SelectOption[] = [emptyOpt, ...clerkUsers];

  const handleSupplierChange = (uuid: string) => {
    form.setValue("supplierUuid", uuid);
    form.setValue("contactUuid", "");
    form.setValue("purchaseOrderUuid", "");
    form.setValue("deliveryAddressUuid", "");
    setContacts([]);
    setPurchaseOrders([]);
    setAddresses([]);
    if (!uuid) return;
    setIsLoadingSupplierData(true);
    Promise.all([
      getContactsForCompany(uuid),
      getPurchaseOrdersForCompany(uuid),
      getAddressesForCompany(uuid),
    ]).then(([newContacts, newPurchaseOrders, newAddresses]) => {
      setContacts(newContacts);
      setPurchaseOrders(newPurchaseOrders);
      setAddresses(newAddresses);
      setIsLoadingSupplierData(false);
    });
  };

  const handleCancel = () => router.push("/purchase-return-orders");

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const extras: PurchaseReturnOrderExtras = {
        surcharges: values.surcharges.map((surcharge) => ({
          companyUuid: surcharge.companyUuid || null,
          order: 0,
          description: surcharge.description || null,
          surcharge: toDecimal(surcharge.surcharge, "0.00"),
          unit: surcharge.unit || null,
          fromValue: toDecimal(surcharge.fromValue, "0.00"),
          unitIndication: surcharge.unitIndication || null,
          tierUnit: surcharge.tierUnit || null,
          amount: toDecimal(surcharge.amount, "0.00"),
          profit: toDecimal(surcharge.profit, "0.00"),
          thirdParties: surcharge.thirdParties,
          companyCode: surcharge.companyCode || null,
        })),
        texts: values.texts.map((text) => ({
          title: text.title,
          textBlock: text.textBlock,
          textCategoryUuid: text.textCategoryUuid || null,
        })),
      };

      const result = await createPurchaseReturnOrder(
        {
          supplierUuid: values.supplierUuid,
          purchaseOrderUuid: values.purchaseOrderUuid || null,
          purchaseOrderReference: values.purchaseOrderReference || null,
          complaintRef: values.complaintRef || null,
          contactUuid: values.contactUuid || null,
          purchaser: values.purchaser || null,
          purchaseOrderType: values.purchaseOrderType || null,
          isPrinted: values.isPrinted,
          isMailed: values.isMailed,
          isFaxed: values.isFaxed,

          paymentTerms: values.paymentTerms || null,

          returnDate: values.returnDate ? new Date(values.returnDate) : null,
          returnReason: values.returnReason,
          isDropOff: values.isDropOff,
          deliveryAddressUuid: values.isDropOff
            ? values.deliveryAddressUuid || null
            : null,
          pickupAddress: values.isDropOff ? null : values.pickupAddress || null,

          completeDelivery: values.completeDelivery,
          vehicleWithCrane: values.vehicleWithCrane,
          vehicleWithCanopy: values.vehicleWithCanopy,
          bundlingSeparate: values.bundlingSeparate,
          unloadingWarehousePerLine: values.unloadingWarehousePerLine,
          transportRegion: values.transportRegion || null,
          transportMode: values.transportMode || null,
          pickupAfterTime: values.pickupAfterTime || null,
          pickupForTime: values.pickupForTime || null,
          maxLengthMm: values.maxLengthMm ? Number(values.maxLengthMm) : null,
          maxBundleWeightKg: values.maxBundleWeightKg || null,

          remarks: values.remarks || null,
          documents: values.documents?.length ? values.documents : null,
        },
        extras,
      );

      setState(result);
      if (result.success) {
        router.push("/purchase-return-orders");
      }
    });
  });

  return {
    form,
    isPending,
    onSubmit,
    state,
    isDropOff,
    supplierOptions,
    contactOptions,
    purchaseOrderOptions,
    addressOptions,
    purchaseOrderTypeOptions,
    returnReasonOptions,
    paymentTermOptions,
    transportRegionOptions,
    transportModeOptions,
    purchaserOptions,
    isLoadingSupplierData,
    handleSupplierChange,
    handleCancel,
  };
};
