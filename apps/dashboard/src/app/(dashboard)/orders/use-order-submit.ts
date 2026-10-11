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
import { SelectOption } from "@/components/shadcn/select";
import {
  DeliveryTerm,
  deliveryTerms,
  InvoicePaymentTerm,
  invoicePaymentTerms,
  OrderMethod,
  orderMethods,
  OrderType,
  orderTypes,
  OrderWeightType,
  orderWeightTypes,
} from "@/lib/enums";
import { toDecimal } from "@/lib/helpers";
import {
  DELIVERY_TERM_LABELS,
  INVOICE_PAYMENT_TERM_LABELS,
  ORDER_METHOD_LABELS,
  ORDER_TYPE_LABELS,
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
import { useFieldArray, useForm } from "react-hook-form";
import {
  ContractOption,
  getContractsByCompanyUuid,
  getOrderCustomerDefaults,
  OrderExtras,
  OrderFields,
  OrderItemInput,
  submitOrder,
} from "./actions";
import { DEFAULT_ORDER, OrderFormValues, orderSchema } from "./validation";

type UseOrderSubmitParams = {
  companies: CompanyOption[];
  /** Set on a saved order: its own page is this same screen, prefilled. */
  orderUuid?: string;
  defaultValues?: OrderFormValues;
  /** The saved order's contracts, so the form can name the ones it holds. */
  initialContracts?: ContractOption[];
  /** The saved order's customer, when it is no longer a customer or prospect. */
  currentCompany?: CompanyOption | null;
  /** Who is signed in — a new order's seller, as the reference fills it. */
  currentUserId?: string;
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

export const useOrderSubmit = ({
  companies,
  orderUuid,
  defaultValues,
  initialContracts = [],
  currentCompany = null,
  currentUserId,
}: UseOrderSubmitParams) => {
  const router = useRouter();
  const [state, dispatch, isPending] = useActionState(submitOrder, {});
  const [contacts, setContacts] = useState<ContactOption[]>([]);
  const [addresses, setAddresses] = useState<AddressOption[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [contracts, setContracts] = useState<ContractOption[]>(initialContracts);
  const [isLoadingCompanyData, setIsLoadingCompanyData] = useState(false);

  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderSchema),
    defaultValues: defaultValues ?? {
      ...DEFAULT_ORDER,
      seller: currentUserId ?? "",
    },
  });

  const {
    fields: itemFields,
    append: appendItem,
    remove: removeItem,
  } = useFieldArray({ control: form.control, name: "items" });

  const isPickup = form.watch("isPickup");
  const isConsignment = form.watch("isConsignment");
  const deliveryType = form.watch("deliveryType");

  // Only customers and prospects are sold to — plus, on a saved order, the
  // company it was sold to, whatever it is now.
  const customerCompanies = [
    ...(currentCompany &&
    !companies.some(
      (c) =>
        c.uuid === currentCompany.uuid &&
        (c.roles?.includes("customer") || c.roles?.includes("prospect")),
    )
      ? [currentCompany]
      : []),
    ...companies.filter(
      (c) => c.roles?.includes("customer") || c.roles?.includes("prospect"),
    ),
  ];

  const companyOptions: SelectOption[] = [
    emptyOpt,
    ...customerCompanies.map((c) => ({
      value: c.uuid,
      // `11686 — Holland Dak Accessoires B.V.`: the code beside the name, as
      // the reference prints it next to the field.
      label:
        [c.searchCode1, c.companyName].filter(Boolean).join(" — ") || c.uuid,
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

  const orderMethodOptions = makeOptions(
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

  // Normal, Call-off, Rush or Ex works — the reference's own dropdown in its
  // order-type block, and not the same field as the `Order type` column on its
  // revenue screens. That one is the line's sourcing.
  const orderTypeOptions = makeOptions(
    orderTypes,
    ORDER_TYPE_LABELS as Record<OrderType, string>,
  ).filter((option) => option.value !== "");

  const paymentTermOptions = makeOptions(
    invoicePaymentTerms,
    INVOICE_PAYMENT_TERM_LABELS as Record<InvoicePaymentTerm, string>,
  );

  // The customer's contacts, projects, addresses and contracts — what the
  // header's dropdowns choose from.
  const loadCompanyData = useCallback(async (uuid: string) => {
    setContacts([]);
    setProjects([]);
    setAddresses([]);
    if (!uuid) {
      setContracts([]);
      return;
    }
    setIsLoadingCompanyData(true);
    // One after another: the shared MySQL instance caps connections.
    setContacts(await getContactsForCompany(uuid));
    setProjects(await getProjectsForCompany(uuid));
    setAddresses(await getAddressesForCompany(uuid));
    const companyContracts = await getContractsByCompanyUuid(uuid);
    // A contract the order already names stays offered even when it is not
    // the customer's own any more.
    setContracts((current) => [
      ...companyContracts,
      ...current.filter(
        (held) =>
          !companyContracts.some((contract) => contract.uuid === held.uuid),
      ),
    ]);
    setIsLoadingCompanyData(false);
  }, []);

  // A saved order already names a customer, so its contacts and addresses are
  // fetched before the form can show which ones are selected.
  const savedCompanyUuid = orderUuid ? defaultValues?.companyUuid : undefined;
  useEffect(() => {
    if (!savedCompanyUuid) {
      return;
    }
    void loadCompanyData(savedCompanyUuid);
  }, [savedCompanyUuid, loadCompanyData]);

  const handleCompanyChange = (uuid: string) => {
    form.setValue("companyUuid", uuid);
    form.setValue("contactUuid", "");
    form.setValue("projectUuid", "");
    form.setValue("deliveryAddressUuid", "");
    form.setValue("billingAddressUuid", "");
    form.setValue("contractUuids", []);
    setContracts([]);
    if (!uuid) {
      void loadCompanyData(uuid);
      return;
    }
    void loadCompanyData(uuid).then(async () => {
      // The customer brings the terms with it. Watched on 21-9-2026: typing a
      // customer into a blank order filled the contact, both addresses, the
      // payment terms, the delivery terms and the weight type before a line
      // existed.
      //
      // 🔴 The weight type is the one that matters — it decides which of the
      // product's densities the line is billed on, so leaving it empty prices
      // the order on the wrong steel.
      const defaults = await getOrderCustomerDefaults(uuid);
      if (!defaults || form.getValues("companyUuid") !== uuid) {
        return;
      }
      if (defaults.paymentTerms) {
        form.setValue("paymentTerms", defaults.paymentTerms);
      }
      if (defaults.deliveryTerms) {
        form.setValue("deliveryTerms", defaults.deliveryTerms);
      }
      if (defaults.weightType) {
        form.setValue("weightType", defaults.weightType);
      }
      if (defaults.contactUuid) {
        form.setValue("contactUuid", defaults.contactUuid);
      }
      if (defaults.deliveryAddressUuid) {
        form.setValue("deliveryAddressUuid", defaults.deliveryAddressUuid);
      }
      if (defaults.billingAddressUuid) {
        form.setValue("billingAddressUuid", defaults.billingAddressUuid);
      }
    });
  };

  // A saved order is edited on its own page, so leaving goes to the list.
  const handleCancel = () => router.push("/orders");

  const onSubmit = form.handleSubmit((values) => {
    const extras: OrderExtras = {
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
        uuid: text.uuid || undefined,
        title: text.title,
        textBlock: text.textBlock,
        textCategoryUuid: text.textCategoryUuid || null,
      })),
      contractUuids: values.contractUuids,
    };

    const fields: OrderFields = {
      companyUuid: values.companyUuid,
      contactUuid: values.contactUuid || null,
      orderMethod: values.orderMethod || null,
      customerRef: values.customerRef || null,
      leaveCustomer: values.leaveCustomer,
      ourReference: values.ourReference || null,
      seller: values.seller || null,
      projectUuid: values.projectUuid || null,
      priceDate: values.priceDate ? new Date(values.priceDate) : null,
      orderCategory: values.orderCategory || null,
      handlingBlocked: values.handlingBlocked,

      isPickup: values.isPickup,
      isIncidental: values.isIncidental,
      isConsignment: values.isConsignment,
      consignmentDuration: values.consignmentDuration,
      isInternalProduction: values.isInternalProduction,
      isCustomerMaterial: values.isCustomerMaterial,
      orderType: values.orderType,
      callOffPeriodFrom:
        values.orderType === "call_off" && values.callOffPeriodFrom
          ? new Date(values.callOffPeriodFrom)
          : null,
      callOffPeriodTo:
        values.orderType === "call_off" && values.callOffPeriodTo
          ? new Date(values.callOffPeriodTo)
          : null,
      weightType: values.weightType || null,
      isOverlength: values.isOverlength,
      isPrinted: values.isPrinted,
      isMailed: values.isMailed,
      isFaxed: values.isFaxed,

      deliveryTerms: values.isPickup ? null : values.deliveryTerms || null,
      deliveryAddressUuid: values.isPickup
        ? null
        : values.deliveryAddressUuid || null,
      deliveryType: values.deliveryType,
      deliveryDate: values.deliveryDate ? new Date(values.deliveryDate) : null,
      deliveryWeek: values.deliveryWeek ?? null,
      deliveryYear: values.deliveryYear ?? null,
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

      showNetPrice: values.showNetPrice,
      scrapSurchargeSeparate: values.scrapSurchargeSeparate,
      calculateVatIfApplicable: values.calculateVatIfApplicable,
      financialBlockage: values.financialBlockage,
      invoiceBlockage: values.invoiceBlockage,
      onlyTotalAmountOnInvoice: values.onlyTotalAmountOnInvoice,
      includeOptionPricesInMaterialPrices:
        values.includeOptionPricesInMaterialPrices,
      paymentTerms: values.paymentTerms || null,
      billingAddressUuid: values.billingAddressUuid || null,
      blockingReason: values.blockingReason || null,

      remarks: values.remarks || null,
      documents: values.documents.length > 0 ? values.documents : null,
    };

    // A new order takes the lines typed under `Order lines → New` with it; a
    // saved one writes its lines from its own grid.
    const items: OrderItemInput[] = orderUuid
      ? []
      : (values.items ?? []).map((item) => ({
          stockUuid: item.stockUuid || null,
          productUuid: item.productUuid || null,
          // `1,5` typed the Dutch way is the same quantity as `1.5`.
          quantity: item.quantity.trim().replace(",", "."),
          sourceType: item.sourceType,
        }));

    startTransition(() => {
      dispatch({ orderUuid, fields, items, extras });
    });
  });

  return {
    form,
    isPending,
    isEditing: Boolean(orderUuid),
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
  };
};
