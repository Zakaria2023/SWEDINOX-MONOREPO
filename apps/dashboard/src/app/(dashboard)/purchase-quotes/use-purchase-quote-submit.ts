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
import { SelectOption } from "@/components/shadcn/select";
import {
  DeliveryTerm,
  deliveryTerms,
  InvoicePaymentTerm,
  invoicePaymentTerms,
  OrderWeightType,
  orderWeightTypes,
  PurchaseOrderType,
  purchaseOrderTypes,
} from "@/lib/enums";
import {
  COMMON_TEXT,
  DELIVERY_TERM_LABELS,
  INVOICE_PAYMENT_TERM_LABELS,
  ORDER_WEIGHT_TYPE_LABELS,
  PURCHASE_ORDER_TYPE_LABELS,
} from "@/lib/labels";
import { ClerkUserOption } from "@/lib/server/clerk";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { createPurchaseQuote, PurchaseQuoteActionResult } from "./actions";
import {
  DEFAULT_PURCHASE_QUOTE,
  PurchaseQuoteFormValues,
  purchaseQuoteSchema,
} from "./validation";

type UsePurchaseQuoteSubmitParams = {
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

export const usePurchaseQuoteSubmit = ({
  companies,
  clerkUsers,
}: UsePurchaseQuoteSubmitParams) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState<PurchaseQuoteActionResult>({});
  const [contacts, setContacts] = useState<ContactOption[]>([]);
  const [addresses, setAddresses] = useState<AddressOption[]>([]);
  const [isLoadingCompanyData, setIsLoadingCompanyData] = useState(false);

  const form = useForm<PurchaseQuoteFormValues>({
    resolver: zodResolver(purchaseQuoteSchema),
    defaultValues: DEFAULT_PURCHASE_QUOTE,
  });

  const arrangeTransport = form.watch("arrangeTransport");
  const deliveryType = form.watch("deliveryType");

  const supplierCompanies = companies.filter((c) =>
    c.roles?.includes("supplier"),
  );
  const agentCompanies = companies.filter((c) => c.roles?.includes("agent"));

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
    ...addresses.map((a) => ({ value: a.uuid, label: addressLabel(a) })),
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

  const purchaserOptions: SelectOption[] = [emptyOpt, ...clerkUsers];

  const loadCompanyData = (uuid: string) => {
    setContacts([]);
    setAddresses([]);
    if (!uuid) return;
    setIsLoadingCompanyData(true);
    Promise.all([
      getContactsForCompany(uuid),
      getAddressesForCompany(uuid),
    ]).then(([newContacts, newAddresses]) => {
      setContacts(newContacts);
      setAddresses(newAddresses);
      setIsLoadingCompanyData(false);
    });
  };

  const handleSupplierChange = (uuid: string) => {
    form.setValue("supplierUuid", uuid);
    form.setValue("agentUuid", "");
    form.setValue("contactUuid", "");
    form.setValue("supplierAddressUuid", "");
    loadCompanyData(uuid);
  };

  const handleAgentChange = (uuid: string) => {
    form.setValue("agentUuid", uuid);
    form.setValue("supplierUuid", "");
    form.setValue("contactUuid", "");
    form.setValue("supplierAddressUuid", "");
    loadCompanyData(uuid);
  };

  const handleCancel = () => router.push("/purchase-quotes");

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = await createPurchaseQuote({
        companyUuid: values.supplierUuid || values.agentUuid || null,
        contactUuid: values.contactUuid || null,
        purchaser: values.purchaser || null,
        reference: values.reference || null,
        ourReference: values.ourReference || null,
        orderCategory: values.orderCategory || null,

        quoteNumber: values.quoteNumber || null,
        quoteDate: values.quoteDate ? new Date(values.quoteDate) : null,
        validUntil: values.validUntil ? new Date(values.validUntil) : null,

        purchaseOrderType: values.purchaseOrderType || null,
        weightType: values.weightType || null,
        isOverlength: values.isOverlength,
        isConsignment: values.isConsignment,

        paymentTerms: values.paymentTerms || null,

        deliveryTerms: values.deliveryTerms || null,
        deliveryAddressUuid: values.deliveryAddressUuid || null,
        arrangeTransport: values.arrangeTransport,
        pickupDropoffCdPurchases: values.arrangeTransport
          ? values.pickupDropoffCdPurchases
          : false,
        supplierAddressUuid: values.supplierAddressUuid || null,
        deliveryType: values.deliveryType,
        deliveryDate: values.deliveryDate
          ? new Date(values.deliveryDate)
          : null,
        deliveryWeek: values.deliveryWeek ? Number(values.deliveryWeek) : null,
        deliveryYear: values.deliveryYear ? Number(values.deliveryYear) : null,
        deliveryRemark: values.deliveryRemark || null,

        documents: values.documents?.length ? values.documents : null,
      });

      setState(result);
      if (result.success) {
        router.push("/purchase-quotes");
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
    purchaserOptions,
    isLoadingCompanyData,
    handleSupplierChange,
    handleAgentChange,
    handleCancel,
  };
};
