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
  DeliveryTimeUnit,
  deliveryTimeUnits,
  InvoicePaymentTerm,
  invoicePaymentTerms,
  OrderMethod,
  orderMethods,
  OrderStatus,
  OrderWeightType,
  orderWeightTypes,
} from "@/lib/enums";
import {
  computeQuoteSummary,
  getQuoteVatRatePercent,
  marginFloorFor,
  previewQuoteLine,
  productPieceWeightKg,
  quoteSummaryFromSnapshot,
} from "@/lib/helpers";
import {
  DELIVERY_TERM_LABELS,
  DELIVERY_TIME_UNIT_LABELS,
  INVOICE_PAYMENT_TERM_LABELS,
  ORDER_METHOD_LABELS,
  ORDER_WEIGHT_TYPE_LABELS,
} from "@/lib/labels";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import {
  startTransition,
  useActionState,
  useCallback,
  useEffect,
  useState,
} from "react";
import { useForm, useWatch } from "react-hook-form";
import { QuoteDetail, QuoteSubmitPayload, submitQuote } from "./actions";
import {
  DEFAULT_QUOTE,
  QuoteFormValues,
  QuoteLineFormValues,
  quoteSchema,
} from "./validation";

// The amounts the consignment's `duration of [..]` dropdown offers; its unit
// sits in the `u/i [..]` dropdown beside it (#392).
const CONSIGNMENT_DURATION_VALUES = Array.from({ length: 52 }, (_, i) =>
  String(i + 1),
);

const EMPTY_OPTION = { value: "", label: "Empty" };

type UseQuoteSubmitParams = {
  companies: CompanyOption[];
  contracts: ContractForProjectOption[];
  products: ProductPricingOption[];
  /** The saved quote; omitted when a new one is being typed. */
  existing: QuoteDetail | null;
  defaultValues?: QuoteFormValues;
  /** The signed-in user, who a new quote's Seller starts as (#392). */
  defaultSeller?: string;
};

/**
 * What one line of the grid reports in money and weight. A line that still
 * reads as it was saved shows the figures the server priced it at (contract
 * terms included); a line typed or changed since is a list-price preview.
 */
export type QuoteLineFigures = {
  saved: boolean;
  weightKg: number;
  theoreticalWeightKg: number;
  m1PerPiece: number;
  netPrice: number;
  priceUnit: string | null;
  amount: number;
  purchasePrice: number;
  costAmount: number;
  replacementCost: number;
  profitMargin: number;
  profit: number;
  profitTooLow: boolean;
};

const makeOptions = <T extends string>(
  values: readonly T[],
  labels: Record<T, string>,
): SelectOption[] => [
  EMPTY_OPTION,
  ...values.map((v) => ({ value: v, label: labels[v] })),
];

// The reference's Customer field is a code, so the code leads the label and
// typing either the code or the name finds the company.
const companyLabel = (c: CompanyOption) =>
  [c.searchCode1, c.companyName].filter(Boolean).join(" — ") || c.uuid;

const addressLabel = (a: AddressOption) =>
  [a.altName, a.streetAndNo, a.postalCode, a.city].filter(Boolean).join(", ") ||
  a.uuid;

/**
 * The rung a quote is saved on. Expiry is a rung of the ladder rather than a
 * flag beside it, so the `Expired` box moves the status — and un-ticking it
 * puts the quote back at `Provisional`. Any other rung (a finalized,
 * `Released` quote) is the toolbar's to move, never the Save button's.
 */
const quoteStatusFor = (
  expired: boolean,
  currentStatus: OrderStatus,
): OrderStatus => {
  if (expired) {
    return "expired";
  }
  return currentStatus === "expired" ? "provisional" : currentStatus;
};

/** Whether a grid line still reads exactly as the saved line it came from. */
const isUnchangedLine = (
  line: QuoteLineFormValues,
  saved: QuoteDetail["items"][number] | undefined,
): saved is QuoteDetail["items"][number] =>
  saved !== undefined &&
  saved.productUuid === line.productUuid &&
  Number(saved.quantity ?? 0) === Number(line.quantity || 0) &&
  String(saved.lengthMm ?? "") === (line.lengthMm ?? "") &&
  (saved.unit ?? "st") === (line.unit ?? "st") &&
  saved.sourceType === (line.sourceType ?? "stock");

export const useQuoteSubmit = ({
  companies,
  contracts,
  products,
  existing,
  defaultValues,
  defaultSeller,
}: UseQuoteSubmitParams) => {
  const router = useRouter();
  const [state, dispatch, isPending] = useActionState(submitQuote, {});
  const [contacts, setContacts] = useState<ContactOption[]>([]);
  const [addresses, setAddresses] = useState<AddressOption[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [isLoadingCompanyData, setIsLoadingCompanyData] = useState(false);

  const form = useForm<QuoteFormValues>({
    resolver: zodResolver(quoteSchema),
    defaultValues: defaultValues ?? {
      ...DEFAULT_QUOTE,
      seller: defaultSeller ?? "",
    },
  });

  const [
    isPickup,
    isConsignment,
    consignmentDuration,
    deliveryType,
    expired,
    items,
    surcharges,
    calculateVatIfApplicable,
  ] = useWatch({
    control: form.control,
    name: [
      "isPickup",
      "isConsignment",
      "consignmentDuration",
      "deliveryType",
      "expired",
      "items",
      "surcharges",
      "calculateVatIfApplicable",
    ],
  });
  const isDirty = form.formState.isDirty;

  const lineFigures: QuoteLineFigures[] = (items ?? []).map((item, index) => {
    const saved = existing?.items[index];
    if (isUnchangedLine(item, saved)) {
      const quantity = Number(saved.quantity ?? 0);
      return {
        saved: true,
        weightKg: Number(saved.weightKg ?? 0),
        theoreticalWeightKg: Number(saved.weightKg ?? 0),
        m1PerPiece: Number(saved.m1PerPiece ?? 0),
        netPrice: Number(saved.netPrice ?? 0),
        priceUnit: saved.priceUnit,
        amount: Number(saved.amount ?? 0),
        purchasePrice: Number(saved.purchasePrice ?? 0),
        costAmount: Number(saved.costAmount ?? 0),
        replacementCost: Number(saved.replacementPrice ?? 0) * quantity,
        profitMargin: Number(saved.profitMargin ?? 0),
        profit: Number(saved.profit ?? 0),
        profitTooLow: saved.profitTooLow ?? false,
      };
    }

    const product = products.find((p) => p.uuid === item.productUuid);
    const preview = previewQuoteLine({
      quantity: Number(item.quantity || 0),
      lengthMm: item.lengthMm ? Number(item.lengthMm) : null,
      basePrice: Number(product?.basePrice ?? 0),
      replacementPrice: Number(product?.replacementPrice ?? 0),
      purchasePrice: Number(product?.averagePurchasePrice ?? 0),
      // The catalogue column is a density when the weight unit says M3, so it
      // is read through the helper that checks the unit.
      theoreticalWeight:
        productPieceWeightKg({
          weightTheoretical: product?.weightTheoretical,
          theoreticalWeight: product?.theoreticalWeight,
          weightUnit: product?.weightUnit,
          lengthMm: Number(product?.length ?? 0),
          widthMm: Number(product?.widthDiameter ?? 0),
          thicknessMm: Number(product?.thickness ?? 0),
        }) ?? 0,
      priceUnit: product?.priceUnit,
      widthMm: Number(product?.widthDiameter ?? 0),
      thicknessMm: Number(product?.thickness ?? 0),
      productLengthMm: Number(product?.length ?? 0),
      minProfitMargin: marginFloorFor(product, item.sourceType ?? "stock"),
    });
    return {
      saved: false,
      weightKg: preview.weightKg,
      theoreticalWeightKg: preview.theoreticalWeightKg,
      m1PerPiece: preview.m1PerPiece,
      netPrice: preview.netPrice,
      priceUnit: product?.priceUnit ?? null,
      amount: preview.amount,
      purchasePrice: preview.purchasePrice,
      costAmount: preview.costAmount,
      replacementCost: preview.replacementCost,
      profitMargin: preview.profitMargin,
      profit: preview.profit,
      profitTooLow: preview.profitTooLow,
    };
  });

  // The summary is never typed in. A saved quote that has not been touched
  // reads the snapshot the server wrote; anything typed since is recomputed
  // here on every keystroke, and again on the server from the prices it saves.
  const summary =
    existing && !isDirty
      ? quoteSummaryFromSnapshot(existing)
      : computeQuoteSummary({
          lines: lineFigures.map((line) => ({
            amount: line.amount,
            costAmount: line.costAmount,
            replacementCost: line.replacementCost,
            weightKg: line.weightKg,
            theoreticalWeightKg: line.theoreticalWeightKg,
          })),
          surcharges: (surcharges ?? []).map((surcharge) => ({
            amount: Number(surcharge.amount ?? 0),
            profit: Number(surcharge.profit ?? 0),
          })),
          transportCosts: Number(existing?.transportCosts ?? 0),
          handlingCosts: Number(existing?.handlingCosts ?? 0),
          // Whether the customer is one VAT is calculated for is settled on
          // save, so a VAT-exempt customer can turn this preview's VAT into 0.
          vatRatePercent: getQuoteVatRatePercent(
            calculateVatIfApplicable,
            existing?.companyCalculatesVat ?? true,
          ),
        });

  // Only customer and prospect companies can be quoted.
  const customerCompanies = companies.filter(
    (c) => c.roles?.includes("customer") || c.roles?.includes("prospect"),
  );

  const companyOptions: SelectOption[] = [
    EMPTY_OPTION,
    ...customerCompanies.map((c) => ({
      value: c.uuid,
      label: companyLabel(c),
    })),
  ];

  const contactOptions: SelectOption[] = [
    EMPTY_OPTION,
    ...contacts.map((c) => ({
      value: c.uuid,
      label: [c.firstName, c.lastName].filter(Boolean).join(" ") || c.uuid,
    })),
  ];

  const addressOptions: SelectOption[] = [
    EMPTY_OPTION,
    ...addresses.map((a) => ({ value: a.uuid, label: addressLabel(a) })),
  ];

  const projectOptions: SelectOption[] = [
    EMPTY_OPTION,
    ...projects.map((p) => ({
      value: p.uuid,
      label: p.projectName ?? p.uuid,
    })),
  ];

  const contractOptions: SelectOption[] = [
    EMPTY_OPTION,
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

  // A value saved before these were dropdowns is kept on offer, so opening an
  // old quote does not silently blank it.
  const consignmentDurationValues =
    consignmentDuration &&
    !CONSIGNMENT_DURATION_VALUES.includes(consignmentDuration)
      ? [consignmentDuration, ...CONSIGNMENT_DURATION_VALUES]
      : CONSIGNMENT_DURATION_VALUES;

  const consignmentDurationOptions: SelectOption[] = [
    EMPTY_OPTION,
    ...consignmentDurationValues.map((v) => ({ value: v, label: v })),
  ];

  const consignmentDurationUnitOptions = makeOptions(
    deliveryTimeUnits,
    DELIVERY_TIME_UNIT_LABELS as Record<DeliveryTimeUnit, string>,
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
    form.setValue("companyUuid", uuid, { shouldDirty: true });
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

  // A saved quote already has a customer picked, so its contacts, projects
  // and addresses have to be fetched before the form can show what is selected.
  const editingCompanyUuid = defaultValues?.companyUuid;
  useEffect(() => {
    if (!editingCompanyUuid) {
      return;
    }
    loadCompanyData(editingCompanyUuid);
  }, [editingCompanyUuid, loadCompanyData]);

  // A saved quote is edited on its own page, so leaving goes to the list.
  const handleCancel = () => router.push("/quotes");

  const onSubmit = form.handleSubmit((values) => {
    const fields: QuoteSubmitPayload["fields"] = {
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
      decisionDate: values.decisionDate ? new Date(values.decisionDate) : null,
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
      deliveryDate: values.deliveryDate ? new Date(values.deliveryDate) : null,
      deliveryWeek: values.deliveryWeek ? Number(values.deliveryWeek) : null,
      deliveryYear: values.deliveryYear ? Number(values.deliveryYear) : null,
      deliveryRemark: values.deliveryRemark || null,

      // `expired` is the box a salesperson ticks; the status is the ladder it
      // sits on. Both are written together so the overview, which filters on
      // each, can never show them disagreeing.
      expired: values.expired,
      expirationReason: values.expired
        ? values.expirationReason || null
        : null,
      status: quoteStatusFor(values.expired, existing?.status ?? "provisional"),

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
      sourceType: item.sourceType ?? "stock",
    }));

    const quoteSurcharges = values.surcharges.map((surcharge) => ({
      description: surcharge.description || null,
      surcharge: surcharge.surcharge || "0.00",
      unit: surcharge.unit || null,
      fromValue: surcharge.fromValue || "0.00",
      unitIndication: surcharge.unitIndication || null,
      tierUnit: surcharge.tierUnit || null,
      amount: surcharge.amount || "0.00",
      profit: surcharge.profit || "0.00",
      thirdParties: surcharge.thirdParties,
      companyCode: surcharge.companyCode || null,
      companyUuid: surcharge.companyUuid || null,
    }));

    // Both paths redirect from inside the action; only an error comes back.
    startTransition(() =>
      dispatch({
        quoteUuid: existing?.uuid,
        fields,
        items: lines,
        surcharges: quoteSurcharges,
      }),
    );
  });

  return {
    form,
    isPending,
    onSubmit,
    state,
    summary,
    lineFigures,
    isEditing: existing !== null,
    isPickup,
    isConsignment,
    deliveryType,
    expired,
    companyOptions,
    contactOptions,
    projectOptions,
    contractOptions,
    addressOptions,
    requestMethodOptions,
    deliveryTermOptions,
    weightTypeOptions,
    consignmentDurationOptions,
    consignmentDurationUnitOptions,
    paymentTermOptions,
    isLoadingCompanyData,
    handleCompanyChange,
    handleCancel,
  };
};
