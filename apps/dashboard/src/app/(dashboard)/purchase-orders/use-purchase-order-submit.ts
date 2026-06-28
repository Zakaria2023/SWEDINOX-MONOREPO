"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import {
  AddressOption,
  createPurchaseOrder,
  getAddressesForCompany,
  PurchaseOrderActionResult,
} from "./actions";
import {
  DEFAULT_PURCHASE_ORDER,
  purchaseOrderSchema,
  PurchaseOrderFormValues,
} from "./validation";
import { CompanyOption } from "@/app/(dashboard)/companies/actions";
import {
  ContactOption,
  getContactsForCompany,
} from "@/app/(dashboard)/contacts/actions";
import { SelectOption } from "@/components/shadcn/select";
import {
  deliveryTerms,
  invoicePaymentTerms,
  orderWeightTypes,
  purchaseOrderTypes,
  DeliveryTerm,
  InvoicePaymentTerm,
  OrderWeightType,
  PurchaseOrderType,
} from "@/lib/enums";
import {
  COMMON_TEXT,
  DELIVERY_TERM_LABELS,
  INVOICE_PAYMENT_TERM_LABELS,
  ORDER_WEIGHT_TYPE_LABELS,
  PURCHASE_ORDER_TYPE_LABELS,
} from "@/lib/labels";

type UsePurchaseOrderSubmitParams = {
  companies: CompanyOption[];
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
  [a.altName, a.streetAndNo, a.postalCode, a.city]
    .filter(Boolean)
    .join(", ") || a.uuid;

export const usePurchaseOrderSubmit = ({
  companies,
}: UsePurchaseOrderSubmitParams) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState<PurchaseOrderActionResult>({});
  const [contacts, setContacts] = useState<ContactOption[]>([]);
  const [supplierAddresses, setSupplierAddresses] = useState<AddressOption[]>([]);
  const [isLoadingSupplierData, setIsLoadingSupplierData] = useState(false);

  const form = useForm<PurchaseOrderFormValues>({
    resolver: zodResolver(purchaseOrderSchema),
    defaultValues: DEFAULT_PURCHASE_ORDER,
  });

  const arrangeTransport = form.watch("arrangeTransport");
  const deliveryType = form.watch("deliveryType");

  const supplierCompanies = companies.filter((c) =>
    c.roles.includes("supplier"),
  );
  const agentCompanies = companies.filter((c) => c.roles.includes("agent"));

  const supplierOptions: SelectOption[] = [
    emptyOpt,
    ...supplierCompanies.map((c) => ({
      value: c.uuid,
      label: c.companyName ?? c.searchCode1 ?? c.uuid,
    })),
  ];

  const agentOptions: SelectOption[] = [
    emptyOpt,
    ...agentCompanies.map((c) => ({
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

  const supplierAddressOptions: SelectOption[] = [
    emptyOpt,
    ...supplierAddresses.map((a) => ({ value: a.uuid, label: addressLabel(a) })),
  ];

  const purchaseOrderTypeOptions = makeOptions(
    purchaseOrderTypes,
    PURCHASE_ORDER_TYPE_LABELS as Record<PurchaseOrderType, string>,
  );

  const weightTypeOptions = makeOptions(
    orderWeightTypes,
    ORDER_WEIGHT_TYPE_LABELS as Record<OrderWeightType, string>,
  );

  const deliveryTermOptions = makeOptions(
    deliveryTerms,
    DELIVERY_TERM_LABELS as Record<DeliveryTerm, string>,
  );

  const paymentTermOptions = makeOptions(
    invoicePaymentTerms,
    INVOICE_PAYMENT_TERM_LABELS as Record<InvoicePaymentTerm, string>,
  );

  const handleSupplierChange = (uuid: string) => {
    form.setValue("supplierUuid", uuid);
    form.setValue("contactUuid", "");
    form.setValue("supplierAddressUuid", "");
    setContacts([]);
    setSupplierAddresses([]);
    if (!uuid) return;
    setIsLoadingSupplierData(true);
    Promise.all([
      getContactsForCompany(uuid),
      getAddressesForCompany(uuid),
    ]).then(([newContacts, newAddresses]) => {
      setContacts(newContacts);
      setSupplierAddresses(newAddresses);
      setIsLoadingSupplierData(false);
    });
  };

  const handleCancel = () => router.push("/purchase-orders");

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = await createPurchaseOrder({
        supplierUuid: values.supplierUuid,
        agentUuid: values.agentUuid || null,
        contactUuid: values.contactUuid || null,
        purchaser: values.purchaser || null,
        reference: values.reference || null,
        ourReference: values.ourReference || null,
        orderCategory: values.orderCategory || null,

        purchaseOrderType: values.purchaseOrderType || null,
        weightType: values.weightType || null,
        isOverlengte: values.isOverlengte,
        isPrinted: values.isPrinted,
        isMailed: values.isMailed,
        isFaxed: values.isFaxed,
        messageSentViaStaalWeb: values.messageSentViaStaalWeb,
        doNotPrintPrices: values.doNotPrintPrices,

        paymentTerms: values.paymentTerms || null,

        deliveryTerms: values.deliveryTerms || null,
        deliveryAddressUuid: values.deliveryAddressUuid || null,
        arrangeTransport: values.arrangeTransport,
        pickupDropoffCdPurchases: values.arrangeTransport
          ? values.pickupDropoffCdPurchases
          : false,
        supplierAddressUuid: values.supplierAddressUuid || null,
        deliveryType: values.deliveryType,
        deliveryDate: values.deliveryDate ? new Date(values.deliveryDate) : null,
        deliveryWeek: values.deliveryWeek ? Number(values.deliveryWeek) : null,
        deliveryYear: values.deliveryYear ? Number(values.deliveryYear) : null,
        deliveryRemark: values.deliveryRemark || null,

        completeDelivery: values.completeDelivery,
        transportBlockage: values.transportBlockage,
        vehicleWithCrane: values.vehicleWithCrane,
        vehicleWithCanopy: values.vehicleWithCanopy,
        bundlingSeparate: values.bundlingSeparate,
        transportRegion: values.transportRegion || null,
        maxLengthMm: values.maxLengthMm ? Number(values.maxLengthMm) : null,
        maxBundleWeightKg: values.maxBundleWeightKg || null,
        deliveryAfterTime: values.deliveryAfterTime || null,
        deliverForTime: values.deliverForTime || null,
        transportMode: values.transportMode || null,

        remarks: values.remarks || null,
        documents: null,
      });

      setState(result);
      if (result.success) {
        router.push("/purchase-orders");
      }
    });
  });

  return {
    form,
    isPending,
    onSubmit,
    state,
    arrangeTransport,
    deliveryType,
    supplierOptions,
    agentOptions,
    contactOptions,
    supplierAddressOptions,
    purchaseOrderTypeOptions,
    weightTypeOptions,
    deliveryTermOptions,
    paymentTermOptions,
    isLoadingSupplierData,
    handleSupplierChange,
    handleCancel,
  };
};
