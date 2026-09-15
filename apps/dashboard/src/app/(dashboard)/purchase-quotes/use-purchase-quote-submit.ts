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
import { ProductOption } from "@/app/(dashboard)/products/actions";
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
import { ClerkUserOption } from "@/lib/server/clerk";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import {
  createPurchaseQuote,
  PurchaseQuoteActionResult,
  PurchaseQuoteItemInput,
  updatePurchaseQuote,
} from "./actions";
import {
  DEFAULT_PURCHASE_QUOTE,
  DEFAULT_PURCHASE_QUOTE_ITEM,
  PurchaseQuoteFormValues,
  purchaseQuoteSchema,
} from "./validation";

type UsePurchaseQuoteSubmitParams = {
  companies: CompanyOption[];
  clerkUsers: ClerkUserOption[];
  products: ProductOption[];
  /** Our own addresses — where a purchase is delivered. */
  internalAddresses: AddressOption[];
  /** Set when editing an existing quote; omitted when creating one. */
  purchaseQuoteUuid?: string;
  defaultValues?: PurchaseQuoteFormValues;
};

const emptyOpt = { value: "", label: "Empty" };

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

export const usePurchaseQuoteSubmit = ({
  companies,
  clerkUsers,
  products,
  internalAddresses,
  purchaseQuoteUuid,
  defaultValues,
}: UsePurchaseQuoteSubmitParams) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState<PurchaseQuoteActionResult>({});
  const [contacts, setContacts] = useState<ContactOption[]>([]);
  const [addresses, setAddresses] = useState<AddressOption[]>([]);
  const [isLoadingCompanyData, setIsLoadingCompanyData] = useState(false);

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

  // A purchase comes to us, so its delivery address is one of ours — never
  // one of the supplier's.
  const deliveryAddressOptions: SelectOption[] = [
    emptyOpt,
    ...internalAddresses.map((a) => ({ value: a.uuid, label: addressLabel(a) })),
  ];

  const productOptions: SelectOption[] = [
    emptyOpt,
    ...products.map((p) => ({
      value: p.uuid,
      label: `${p.productCode} — ${p.name}`,
    })),
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

  const loadCompanyData = useCallback((uuid: string) => {
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
  }, []);

  // An existing quote already names a company, so its contacts and addresses
  // have to be fetched before the form can show which ones are selected.
  const editingCompanyUuid =
    defaultValues?.supplierUuid || defaultValues?.agentUuid;
  useEffect(() => {
    if (!editingCompanyUuid) {
      return;
    }
    loadCompanyData(editingCompanyUuid);
  }, [editingCompanyUuid, loadCompanyData]);

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

  const handleCancel = () =>
    router.push(
      purchaseQuoteUuid
        ? `/purchase-quotes/${purchaseQuoteUuid}`
        : "/purchase-quotes",
    );

  const onSubmit = form.handleSubmit((values) => {
    // A blank row is the field array's starting state, not a line somebody
    // meant to quote — drop anything with neither a product nor a description.
    const items: PurchaseQuoteItemInput[] = values.items
      .filter((item) => item.productUuid || item.description)
      .map((item, index) => ({
        productUuid: item.productUuid || null,
        description: item.description || null,
        lineNumber: (index + 1) * 10,
        quantity: item.quantity || "0.000",
        unit: item.unit ?? "st",
        kg: item.kg || "0.00",
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
      }));

    startTransition(async () => {
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
        deliveryDate: values.deliveryDate
          ? new Date(values.deliveryDate)
          : null,
        deliveryWeek: values.deliveryWeek ? Number(values.deliveryWeek) : null,
        deliveryYear: values.deliveryYear ? Number(values.deliveryYear) : null,
        deliveryRemark: values.deliveryRemark || null,

        documents: values.documents?.length ? values.documents : null,
      };

      // Updating redirects from inside the action, so only the create path has
      // a result worth navigating on.
      if (purchaseQuoteUuid) {
        setState(await updatePurchaseQuote(purchaseQuoteUuid, fields, items));
        return;
      }

      const result = await createPurchaseQuote(fields, items);
      setState(result);
      if (result.success) {
        router.push("/purchase-quotes");
      }
    });
  });

  return {
    form,
    isPending,
    isEditing: Boolean(purchaseQuoteUuid),
    onSubmit,
    state,
    arrangeTransport,
    deliveryType,
    supplierOptions,
    agentOptions,
    contactOptions,
    supplierAddressOptions,
    deliveryAddressOptions,
    productOptions,
    purchaseOrderTypeOptions,
    weightTypeOptions,
    deliveryTermOptions,
    paymentTermOptions,
    purchaserOptions,
    isLoadingCompanyData,
    handleSupplierChange,
    handleAgentChange,
    handleCancel,
    itemFields,
    appendItem: () => appendItem(DEFAULT_PURCHASE_QUOTE_ITEM),
    removeItem,
  };
};
