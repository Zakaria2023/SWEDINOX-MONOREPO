"use client";

import {
  AddressOption,
  getAddressesForCompany,
} from "@/app/(dashboard)/addresses/actions";
import {
  CompanyOption,
  getProjectsForCompany,
  ProjectOption,
} from "@/app/(dashboard)/companies/actions";
import {
  ContactOption,
  getContactsForCompany,
} from "@/app/(dashboard)/contacts/actions";
import { ContractForProjectOption } from "@/app/(dashboard)/contracts/actions";
import { ProductPricingOption } from "@/app/(dashboard)/products/actions";
import { SelectOption } from "@/components/shadcn/select";
import {
  DeliveryTerm,
  deliveryTerms,
  InvoicePaymentTerm,
  invoicePaymentTerms,
  OrderMethod,
  orderMethods,
  OrderWeightType,
  orderWeightTypes,
} from "@/lib/enums";
import {
  computeQuoteSummary,
  getQuoteVatRatePercent,
  previewQuoteLine,
} from "@/lib/helpers";
import { DELIVERY_TERM_LABELS, INVOICE_PAYMENT_TERM_LABELS, ORDER_METHOD_LABELS, ORDER_WEIGHT_TYPE_LABELS } from "@/lib/labels";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { createQuote, QuoteActionResult, updateQuote } from "./actions";
import { DEFAULT_QUOTE, QuoteFormValues, quoteSchema } from "./validation";

type UseQuoteSubmitParams = {
  companies: CompanyOption[];
  contracts: ContractForProjectOption[];
  products: ProductPricingOption[];
  /** The quote being edited. Omitted when creating a new one. */
  quoteUuid?: string;
  defaultValues?: QuoteFormValues;
};

const emptyOpt = { value: "", label: "Empty" };

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
  products,
  quoteUuid,
  defaultValues,
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
    defaultValues: defaultValues ?? DEFAULT_QUOTE,
  });

  const isPickup = form.watch("isPickup");
  const isConsignment = form.watch("isConsignment");
  const deliveryType = form.watch("deliveryType");
  const items = form.watch("items");
  const calculateVatIfApplicable = form.watch("calculateVatIfApplicable");

  // The summary is never typed in — it is recomputed from the lines on every
  // keystroke here, and again on the server from the prices it actually saves.
  const summary = computeQuoteSummary({
    lines: items.map((item) => {
      const product = products.find((p) => p.uuid === item.productUuid);
      const line = previewQuoteLine({
        quantity: Number(item.quantity),
        lengthMm: item.lengthMm ? Number(item.lengthMm) : null,
        basePrice: Number(product?.basePrice ?? 0),
        replacementPrice: Number(product?.replacementPrice ?? 0),
        purchasePrice: Number(product?.averagePurchasePrice ?? 0),
        theoreticalWeight: Number(product?.theoreticalWeight ?? 0),
        productLengthMm: Number(product?.length ?? 0),
        minProfitMargin: 0,
      });

      return {
        amount: line.amount,
        costAmount: line.costAmount,
        replacementCost: line.replacementCost,
        weightKg: line.weightKg,
        theoreticalWeightKg: line.weightKg,
      };
    }),
    // Only the quote's own flag is known here. Whether the customer is one VAT
    // is calculated for is settled server-side on save, so a VAT-exempt
    // customer can turn this preview's VAT into 0 when the quote is written.
    vatRatePercent: getQuoteVatRatePercent(calculateVatIfApplicable, true),
  });

  // Only show customer/prospect companies
  const customerCompanies = companies.filter(
    (c) => c.roles?.includes("customer") || c.roles?.includes("prospect"),
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

  const loadCompanyData = useCallback((uuid: string) => {
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
  }, []);

  const handleCompanyChange = (uuid: string) => {
    form.setValue("companyUuid", uuid);
    form.setValue("contactUuid", "");
    form.setValue("projectUuid", "");
    form.setValue("deliveryAddressUuid", "");
    form.setValue("billingAddressUuid", "");
    setContacts([]);
    setProjects([]);
    setAddresses([]);
    if (!uuid) {
      return;
    }
    loadCompanyData(uuid);
  };

  // An existing quote already has a customer picked, so its contacts, projects
  // and addresses have to be fetched before the form can show what is selected.
  const editingCompanyUuid = defaultValues?.companyUuid;
  useEffect(() => {
    if (!editingCompanyUuid) {
      return;
    }
    loadCompanyData(editingCompanyUuid);
  }, [editingCompanyUuid, loadCompanyData]);

  const handleCancel = () =>
    router.push(quoteUuid ? `/quotes/${quoteUuid}` : "/quotes");

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const fields = {
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
        isCustomerMaterial: values.isCustomerMaterial,
        weightType: values.weightType || null,
        isOverlength: values.isOverlength,
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
      };

      const lines = values.items.map((item) => ({
        productUuid: item.productUuid,
        quantity: item.quantity,
        unit: item.unit,
        lengthMm: item.lengthMm ? Number(item.lengthMm) : null,
        widthMm: item.widthMm ? Number(item.widthMm) : null,
        thicknessMm: item.thicknessMm || null,
        options: item.options || null,
      }));

      // Updating redirects from inside the action, so only the create path has
      // a result worth navigating on.
      if (quoteUuid) {
        setState(await updateQuote(quoteUuid, fields, lines));
        return;
      }

      const result = await createQuote(fields, lines);
      setState(result);
      if (result.success && result.quoteUuid) {
        router.push(`/quotes/${result.quoteUuid}`);
      }
    });
  });

  return {
    form,
    isPending,
    onSubmit,
    state,
    summary,
    isEditing: Boolean(quoteUuid),
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
