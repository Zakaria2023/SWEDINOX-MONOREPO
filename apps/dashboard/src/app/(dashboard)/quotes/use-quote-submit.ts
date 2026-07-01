"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import {
  AddressOption,
  createQuote,
  getAddressesForCompany,
  QuoteActionResult,
} from "./actions";
import { DEFAULT_QUOTE, quoteSchema, QuoteFormValues } from "./validation";
import {
  CompanyOption,
  getProjectsForCompany,
  ProjectOption,
} from "@/app/(dashboard)/companies/actions";
import { ContractForProjectOption } from "@/app/(dashboard)/contracts/actions";
import {
  ContactOption,
  getContactsForCompany,
} from "@/app/(dashboard)/contacts/actions";
import { SelectOption } from "@/components/shadcn/select";
import {
  deliveryTerms,
  invoicePaymentTerms,
  orderMethods,
  orderWeightTypes,
  DeliveryTerm,
  InvoicePaymentTerm,
  OrderMethod,
  OrderWeightType,
} from "@/lib/enums";
import {
  COMMON_TEXT,
  DELIVERY_TERM_LABELS,
  INVOICE_PAYMENT_TERM_LABELS,
  ORDER_METHOD_LABELS,
  ORDER_WEIGHT_TYPE_LABELS,
} from "@/lib/labels";

type UseQuoteSubmitParams = {
  companies: CompanyOption[];
  contracts: ContractForProjectOption[];
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

export const useQuoteSubmit = ({
  companies,
  contracts,
}: UseQuoteSubmitParams) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState<QuoteActionResult>({});
  const [contacts, setContacts] = useState<ContactOption[]>([]);
  const [addresses, setAddresses] = useState<AddressOption[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [isLoadingCompanyData, setIsLoadingCompanyData] = useState(false);

  const form = useForm<QuoteFormValues>({
    resolver: zodResolver(quoteSchema),
    defaultValues: DEFAULT_QUOTE,
  });

  const isPickup = form.watch("isPickup");
  const isConsignment = form.watch("isConsignment");
  const deliveryType = form.watch("deliveryType");

  // Only show customer/prospect companies
  const customerCompanies = companies.filter(
    (c) => c.roles.includes("customer") || c.roles.includes("prospect"),
  );

  const companyOptions: SelectOption[] = [
    emptyOpt,
    ...customerCompanies.map((c) => ({
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

  const projectOptions: SelectOption[] = [
    emptyOpt,
    ...projects.map((p) => ({
      value: p.uuid,
      label: p.projectName ?? p.uuid,
    })),
  ];

  const contractOptions: SelectOption[] = [
    emptyOpt,
    ...contracts.map((c) => ({
      value: c.uuid,
      label: `${c.code}${c.description ? ` — ${c.description}` : ""}`,
    })),
  ];

  const requestMethodOptions = makeOptions(
    orderMethods,
    ORDER_METHOD_LABELS as Record<OrderMethod, string>,
  );

  const deliveryTermOptions = makeOptions(
    deliveryTerms,
    DELIVERY_TERM_LABELS as Record<DeliveryTerm, string>,
  );

  const weightTypeOptions = makeOptions(
    orderWeightTypes,
    ORDER_WEIGHT_TYPE_LABELS as Record<OrderWeightType, string>,
  );

  const paymentTermOptions = makeOptions(
    invoicePaymentTerms,
    INVOICE_PAYMENT_TERM_LABELS as Record<InvoicePaymentTerm, string>,
  );

  const handleCompanyChange = (uuid: string) => {
    form.setValue("companyUuid", uuid);
    form.setValue("contactUuid", "");
    form.setValue("projectUuid", "");
    form.setValue("deliveryAddressUuid", "");
    form.setValue("billingAddressUuid", "");
    setContacts([]);
    setProjects([]);
    setAddresses([]);
    if (!uuid) return;
    setIsLoadingCompanyData(true);
    Promise.all([
      getContactsForCompany(uuid),
      getProjectsForCompany(uuid),
      getAddressesForCompany(uuid),
    ]).then(([newContacts, newProjects, newAddresses]) => {
      setContacts(newContacts);
      setProjects(newProjects);
      setAddresses(newAddresses);
      setIsLoadingCompanyData(false);
    });
  };

  const handleCancel = () => router.push("/quotes");

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = await createQuote({
        companyUuid: values.companyUuid,
        contactUuid: values.contactUuid || null,
        customerRef: values.customerRef || null,
        leaveCustomerRef: values.leaveCustomerRef,
        requestMethod: values.requestMethod || null,
        ourReference: values.ourReference || null,
        seller: values.seller || null,
        projectUuid: values.projectUuid || null,
        contractUuid: values.contractUuid || null,
        priceDate: values.priceDate ? new Date(values.priceDate) : null,
        decisionDate: values.decisionDate
          ? new Date(values.decisionDate)
          : null,
        quoteDate: values.quoteDate ? new Date(values.quoteDate) : null,
        validityPeriodDays: values.validityPeriodDays
          ? Number(values.validityPeriodDays)
          : null,
        validUntil: values.validUntil ? new Date(values.validUntil) : null,
        handlingBlocked: values.handlingBlocked,

        isPickup: values.isPickup,
        isIncidental: values.isIncidental,
        isConsignment: values.isConsignment,
        consignmentDuration: values.isConsignment
          ? values.consignmentDuration || null
          : null,
        consignmentDurationUnit: values.isConsignment
          ? values.consignmentDurationUnit || null
          : null,
        isInternalProduction: values.isInternalProduction,
        isKlantMateriaal: values.isKlantMateriaal,
        weightType: values.weightType || null,
        isOverlengte: values.isOverlengte,
        isPrinted: values.isPrinted,
        isMailed: values.isMailed,
        isFaxed: values.isFaxed,

        showNetPrice: values.showNetPrice,
        scrapSurchargeSeparate: values.scrapSurchargeSeparate,
        calculateVatIfApplicable: values.calculateVatIfApplicable,
        financialBlockage: values.financialBlockage,
        onlyTotalAmountOnInvoice: values.onlyTotalAmountOnInvoice,
        doNotShowTotalAmount: values.doNotShowTotalAmount,
        includeOptionPricesInMaterialPrices:
          values.includeOptionPricesInMaterialPrices,
        paymentTerms: values.paymentTerms || null,
        billingAddressUuid: values.billingAddressUuid || null,
        blockingReason: values.blockingReason || null,

        deliveryTerms: values.isPickup ? null : values.deliveryTerms || null,
        deliveryAddressUuid: values.isPickup
          ? null
          : values.deliveryAddressUuid || null,
        deliveryType: values.deliveryType,
        deliveryDate: values.deliveryDate
          ? new Date(values.deliveryDate)
          : null,
        deliveryWeek: values.deliveryWeek ? Number(values.deliveryWeek) : null,
        deliveryYear: values.deliveryYear ? Number(values.deliveryYear) : null,
        deliveryRemark: values.deliveryRemark || null,

        expired: values.expired,

        remarks: values.remarks || null,
        documents: values.documents?.length ? values.documents : null,
      });

      setState(result);
      if (result.success) {
        router.push("/quotes");
      }
    });
  });

  return {
    form,
    isPending,
    onSubmit,
    state,
    isPickup,
    isConsignment,
    deliveryType,
    companyOptions,
    contactOptions,
    projectOptions,
    contractOptions,
    addressOptions,
    requestMethodOptions,
    deliveryTermOptions,
    weightTypeOptions,
    paymentTermOptions,
    isLoadingCompanyData,
    handleCompanyChange,
    handleCancel,
  };
};
