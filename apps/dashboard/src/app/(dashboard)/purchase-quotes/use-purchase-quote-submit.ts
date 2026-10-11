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
  getPurchaseSupplierDefaults,
  PurchaseSupplierDefaults,
} from "@/app/(dashboard)/purchase-orders/actions";
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
import { DELIVERY_TERM_LABELS, INVOICE_PAYMENT_TERM_LABELS, ORDER_WEIGHT_TYPE_LABELS, PURCHASE_ORDER_TYPE_LABELS } from "@/lib/labels";
import { isoWeekOf } from "@/lib/helpers";
import { ClerkUserOption } from "@/lib/server/clerk";
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
import { PurchaseQuoteItemInput, savePurchaseQuote } from "./actions";
import {
  DEFAULT_PURCHASE_QUOTE,
  DEFAULT_PURCHASE_QUOTE_ITEM,
  PurchaseQuoteFormValues,
  purchaseQuoteSchema,
} from "./validation";

const emptyOpt = { value: "", label: "Empty" };

type UsePurchaseQuoteSubmitParams = {
  companies: CompanyOption[];
  clerkUsers: ClerkUserOption[];
  /** Our own addresses — where a purchase is delivered. */
  internalAddresses: AddressOption[];
  /** Set when editing an existing quote; omitted when creating one. */
  purchaseQuoteUuid?: string;
  defaultValues?: PurchaseQuoteFormValues;
};

const optionalNumber = (value: string | undefined): number | null =>
  value && Number.isFinite(Number(value)) ? Number(value) : null;

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

// `11692 — Holland Stainless Int`: the code beside the name, as the reference
// prints it next to the field.
const companyLabel = (c: CompanyOption) =>
  [c.searchCode1, c.companyName].filter(Boolean).join(" — ") || c.uuid;

export const usePurchaseQuoteSubmit = ({
  companies,
  clerkUsers,
  internalAddresses,
  purchaseQuoteUuid,
  defaultValues,
}: UsePurchaseQuoteSubmitParams) => {
  const router = useRouter();
  const [state, dispatch, isPending] = useActionState(savePurchaseQuote, {});
  const [contacts, setContacts] = useState<ContactOption[]>([]);
  const [addresses, setAddresses] = useState<AddressOption[]>([]);
  const [isLoadingSupplierData, setIsLoadingSupplierData] = useState(false);
  // The supplier's record, for the banner's `Tel: …, Fax:` and its terms.
  const [supplierDefaults, setSupplierDefaults] =
    useState<PurchaseSupplierDefaults | null>(null);

  const form = useForm<PurchaseQuoteFormValues>({
    resolver: zodResolver(purchaseQuoteSchema),
    defaultValues: defaultValues ?? DEFAULT_PURCHASE_QUOTE,
  });

  const {
    fields: itemFields,
    append: appendItem,
    remove: removeItem,
  } = useFieldArray({ control: form.control, name: "items" });

  const arrangeTransport = form.watch("arrangeTransport");
  const pickupDropoffCdPurchases = form.watch("pickupDropoffCdPurchases");
  // Payment terms stay greyed until a company is chosen, as in the reference.
  const hasSupplier = Boolean(
    form.watch("supplierUuid") || form.watch("agentUuid"),
  );

  const supplierOptions: SelectOption[] = [
    emptyOpt,
    ...companies
      .filter((c) => c.roles?.includes("supplier"))
      .map((c) => ({ value: c.uuid, label: companyLabel(c) })),
  ];

  const agentOptions: SelectOption[] = [
    emptyOpt,
    ...companies
      .filter((c) => c.roles?.includes("agent"))
      .map((c) => ({ value: c.uuid, label: companyLabel(c) })),
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

  // A purchase comes to us, so its delivery address is one of ours — never
  // one of the supplier's.
  const deliveryAddressOptions: SelectOption[] = [
    emptyOpt,
    ...internalAddresses.map((a) => ({ value: a.uuid, label: addressLabel(a) })),
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

  // Sequential rather than concurrent: this database caps connections.
  const loadCompanyData = useCallback(
    async (uuid: string): Promise<PurchaseSupplierDefaults | null> => {
      setContacts([]);
      setAddresses([]);
      setSupplierDefaults(null);
      if (!uuid) {
        return null;
      }
      setIsLoadingSupplierData(true);
      try {
        setContacts(await getContactsForCompany(uuid));
        setAddresses(await getAddressesForCompany(uuid));
        const defaults = await getPurchaseSupplierDefaults(uuid);
        setSupplierDefaults(defaults);
        return defaults;
      } finally {
        setIsLoadingSupplierData(false);
      }
    },
    [],
  );

  // An existing quote already names a company, so its contacts and addresses
  // have to be fetched before the form can show which ones are selected.
  const editingCompanyUuid =
    defaultValues?.supplierUuid || defaultValues?.agentUuid;
  useEffect(() => {
    if (!editingCompanyUuid) {
      return;
    }
    void loadCompanyData(editingCompanyUuid);
  }, [editingCompanyUuid, loadCompanyData]);

  // The supplier brings its terms with it, as on a purchase order: its only
  // contact, its payment and delivery terms and its weight type.
  const applySupplierDefaults = (uuid: string) => {
    void loadCompanyData(uuid).then((defaults) => {
      const current =
        form.getValues("supplierUuid") || form.getValues("agentUuid");
      if (!defaults || current !== uuid) {
        return;
      }
      if (defaults.contactUuid) {
        form.setValue("contactUuid", defaults.contactUuid);
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
    });
  };

  // A quote comes from a supplier or through an agent, never both.
  const handleSupplierChange = (uuid: string) => {
    form.setValue("supplierUuid", uuid);
    form.setValue("agentUuid", "");
    form.setValue("contactUuid", "");
    form.setValue("supplierAddressUuid", "");
    applySupplierDefaults(uuid);
  };

  const handleAgentChange = (uuid: string) => {
    form.setValue("agentUuid", uuid);
    form.setValue("supplierUuid", "");
    form.setValue("contactUuid", "");
    form.setValue("supplierAddressUuid", "");
    applySupplierDefaults(uuid);
  };

  // The week and year follow a chosen date, as on a purchase order.
  const handleDeliveryDateChange = (date: string) => {
    form.setValue("deliveryDate", date);
    const week = isoWeekOf(date);
    if (week !== null) {
      form.setValue("deliveryWeek", String(week));
      form.setValue("deliveryYear", date.slice(0, 4));
    }
  };

  const handleCancel = () =>
    router.push(
      purchaseQuoteUuid
        ? `/purchase-quotes/${purchaseQuoteUuid}`
        : "/purchase-quotes",
    );

  const onSubmit = form.handleSubmit((values) => {
    // A blank row is what `New` adds, not a line somebody meant to quote —
    // drop anything with neither a product nor a description.
    const items: PurchaseQuoteItemInput[] = values.items
      .filter((item) => item.productUuid || item.description)
      .map((item, index) => {
        // Kg(p) as the grid showed it: the article's piece weight times the
        // quantity, or the weight typed for an article that cannot be weighed.
        const pieceWeightKg = Number(item.pieceWeightKg ?? 0);
        const quantity = Number(item.quantity ?? 0);
        return {
          productUuid: item.productUuid || null,
          forOrderItemUuid: item.forOrderItemUuid || null,
          description: item.description || null,
          lineNumber: (index + 1) * 10,
          quantity: item.quantity || "0.000",
          unit: item.unit ?? "st",
          kg:
            pieceWeightKg > 0
              ? (pieceWeightKg * quantity).toFixed(2)
              : item.kg || "0.00",
          lengthMm: optionalNumber(item.lengthMm),
          widthMm: optionalNumber(item.widthMm),
          thicknessMm: item.thicknessMm || null,
          grossPrice: item.grossPrice || "0.0000",
          groupDiscountPercent: item.groupDiscountPercent || "0.00",
          lineDiscountPercent: item.lineDiscountPercent || "0.00",
          netPrice: item.netPrice || "0.00",
          priceUnit: item.priceUnit || null,
          internalText: item.internalText || null,
          purchaser: values.purchaser || null,
          ourReference: values.ourReference || null,
          purchaseReference: values.reference || null,
          isConsignment: values.isConsignment,
        };
      });

    const fields = {
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
      deliveryDate: values.deliveryDate ? new Date(values.deliveryDate) : null,
      deliveryWeek: values.deliveryWeek ? Number(values.deliveryWeek) : null,
      deliveryYear: values.deliveryYear ? Number(values.deliveryYear) : null,
      deliveryRemark: values.deliveryRemark || null,

      documents: values.documents?.length ? values.documents : null,
    };

    // Both paths redirect from inside the action: a new quote opens on its
    // own page, a saved one reloads there.
    startTransition(() => {
      dispatch({
        purchaseQuoteUuid: purchaseQuoteUuid ?? null,
        fields,
        items,
      });
    });
  });

  return {
    form,
    isPending,
    isEditing: Boolean(purchaseQuoteUuid),
    onSubmit,
    state,
    arrangeTransport,
    pickupDropoffCdPurchases,
    hasSupplier,
    supplierOptions,
    agentOptions,
    contactOptions,
    supplierAddressOptions,
    deliveryAddressOptions,
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
    itemFields,
    appendItem: () => appendItem(DEFAULT_PURCHASE_QUOTE_ITEM),
    removeItem,
  };
};
