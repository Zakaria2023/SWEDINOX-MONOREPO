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
import { DELIVERY_TERM_LABELS, INVOICE_PAYMENT_TERM_LABELS, ORDER_WEIGHT_TYPE_LABELS, PURCHASE_ORDER_TYPE_LABELS } from "@/lib/labels";
import {
  addLeadTime,
  isoWeekOf,
  toDateInput,
  todayDateString,
} from "@/lib/helpers";
import { ClerkUserOption } from "@/lib/server/clerk";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import {
  createPurchaseOrder,
  getPurchaseSupplierDefaults,
  PurchaseOrderActionResult,
  PurchaseOrderDetail,
  PurchaseOrderFields,
  PurchaseSupplierDefaults,
  updatePurchaseOrder,
  YardDeliveryAddress,
} from "./actions";
import {
  DEFAULT_PURCHASE_ORDER,
  PurchaseOrderFormValues,
  purchaseOrderSchema,
} from "./validation";

type UsePurchaseOrderSubmitParams = {
  companies: CompanyOption[];
  clerkUsers: ClerkUserOption[];
  /** The signed-in user — the reference's default `Purchaser`. */
  currentUserId: string;
  yardAddress: YardDeliveryAddress | null;
  /** The saved order, when this is the Edit screen rather than New. */
  existing?: PurchaseOrderDetail | null;
};

const emptyOpt = { value: "", label: "Empty" };

const makeOptions = <T extends string>(
  values: readonly T[],
  labels: Record<T, string>,
): SelectOption[] => [
  emptyOpt,
  ...values.map((v) => ({ value: v, label: labels[v] })),
];

// `11692 — Holland Stainless Int`: the reference's Supplier field takes the
// code and prints the name beside it, so a buyer who knows the code finds it.
const companyLabel = (c: CompanyOption) =>
  [c.searchCode1, c.companyName].filter(Boolean).join(" — ") || c.uuid;

const addressLabel = (a: AddressOption) =>
  [a.altName, a.streetAndNo, a.postalCode, a.city].filter(Boolean).join(", ") ||
  a.uuid;

const text = (value: string | number | null | undefined) =>
  value === null || value === undefined ? "" : String(value);

/**
 * The saved order as the form holds it — the Edit screen is the New screen
 * prefilled, so every header field maps across, and each line comes back
 * with what the stock dialog would have handed over.
 */
const valuesOf = (
  order: PurchaseOrderDetail,
): PurchaseOrderFormValues => ({
  supplierUuid: order.supplierUuid ?? "",
  agentUuid: order.agentUuid ?? "",
  contactUuid: order.contactUuid ?? "",
  purchaser: order.purchaser ?? "",
  reference: order.reference ?? "",
  ourReference: order.ourReference ?? "",
  orderCategory: order.orderCategory ?? "",

  items: order.items.map((item) => {
    const quantity = Number(item.orderedQuantity ?? 0);
    const kg = Number(item.kgPurchased ?? 0);
    const size = [item.lengthMm, item.widthMm, item.thicknessMm]
      .filter((value) => value !== null && Number(value) > 0)
      .map((value) => String(Number(value)))
      .join("x");
    return {
      productUuid: item.productUuid,
      quantity: text(item.orderedQuantity),
      netPrice: text(item.netPrice),
      priceUnit: item.priceUnit ?? "",
      sourceType: item.sourceType ?? "",
      productLabel: item.productCode,
      description: [item.productName, size ? `${size}mm` : null]
        .filter(Boolean)
        .join("  "),
      unit: item.unit ?? "",
      qualityCode: item.qualityCode ?? "",
      lengthMm: text(item.lengthMm),
      widthMm: text(item.widthMm),
      thicknessMm: item.thicknessMm === null ? "" : String(Number(item.thicknessMm)),
      pieceWeightKg: quantity > 0 && kg > 0 ? String(kg / quantity) : "",
    };
  }),

  purchaseOrderType: order.purchaseOrderType ?? undefined,
  weightType: order.weightType ?? undefined,
  isOverlength: order.isOverlength ?? false,
  isPrinted: order.isPrinted ?? false,
  isMailed: order.isMailed ?? false,
  isFaxed: order.isFaxed ?? false,
  messageSentViaStaalWeb: order.messageSentViaStaalWeb ?? false,
  deliberatelyNotSent: order.deliberatelyNotSent ?? false,
  doNotPrintPrices: order.doNotPrintPrices ?? false,

  paymentTerms: order.paymentTerms ?? undefined,

  deliveryTerms: order.deliveryTerms ?? undefined,
  deliveryAddressUuid: order.deliveryAddressUuid ?? "",
  arrangeTransport: order.arrangeTransport ?? false,
  pickupDropoffCdPurchases: order.pickupDropoffCdPurchases ?? false,
  supplierAddressUuid: order.supplierAddressUuid ?? "",
  deliveryType: order.deliveryType ?? "date",
  deliveryDate: toDateInput(order.deliveryDate),
  deliveryWeek: text(order.deliveryWeek),
  deliveryYear: text(order.deliveryYear),
  deliveryRemark: order.deliveryRemark ?? "",

  completeDelivery: order.completeDelivery ?? false,
  transportBlockage: order.transportBlockage ?? false,
  vehicleWithCrane: order.vehicleWithCrane ?? false,
  vehicleWithCanopy: order.vehicleWithCanopy ?? false,
  bundlingSeparate: order.bundlingSeparate ?? false,
  transportRegion: order.transportRegion ?? "",
  maxLengthMm: text(order.maxLengthMm),
  maxBundleWeightKg: text(order.maxBundleWeightKg),
  deliveryAfterTime: order.deliveryAfterTime ?? "",
  deliverForTime: order.deliverForTime ?? "",
  transportMode: order.transportMode ?? "",

  remarks: order.remarks ?? "",
});

/** What the form says, in the shape the header is written with. */
const fieldsOf = (
  values: PurchaseOrderFormValues,
): Omit<PurchaseOrderFields, "status"> => ({
  supplierUuid: values.supplierUuid,
  agentUuid: values.agentUuid || null,
  contactUuid: values.contactUuid || null,
  purchaser: values.purchaser || null,
  reference: values.reference || null,
  ourReference: values.ourReference || null,
  orderCategory: values.orderCategory || null,

  purchaseOrderType: values.purchaseOrderType || null,
  weightType: values.weightType || null,
  isOverlength: values.isOverlength,
  isPrinted: values.isPrinted,
  isMailed: values.isMailed,
  isFaxed: values.isFaxed,
  messageSentViaStaalWeb: values.messageSentViaStaalWeb,
  deliberatelyNotSent: values.deliberatelyNotSent,
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

export const usePurchaseOrderSubmit = ({
  companies,
  clerkUsers,
  currentUserId,
  yardAddress,
  existing = null,
}: UsePurchaseOrderSubmitParams) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState<PurchaseOrderActionResult>({});
  const [contacts, setContacts] = useState<ContactOption[]>([]);
  const [supplierAddresses, setSupplierAddresses] = useState<AddressOption[]>(
    [],
  );
  const [supplierDefaults, setSupplierDefaults] =
    useState<PurchaseSupplierDefaults | null>(null);
  const [isLoadingSupplierData, setIsLoadingSupplierData] = useState(false);

  const form = useForm<PurchaseOrderFormValues>({
    resolver: zodResolver(purchaseOrderSchema),
    defaultValues: existing
      ? valuesOf(existing)
      : {
          ...DEFAULT_PURCHASE_ORDER,
          purchaser: currentUserId,
          deliveryAddressUuid: yardAddress?.uuid ?? "",
        },
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
      label: companyLabel(c),
    })),
  ];

  const agentOptions: SelectOption[] = [
    emptyOpt,
    ...agentCompanies.map((c) => ({
      value: c.uuid,
      label: companyLabel(c),
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
    ...supplierAddresses.map((a) => ({
      value: a.uuid,
      label: addressLabel(a),
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

  // `Week` and `Year` are greyed beside a chosen `Date` and follow it.
  const handleDeliveryDateChange = (date: string) => {
    form.setValue("deliveryDate", date);
    const week = isoWeekOf(date);
    if (week !== null) {
      form.setValue("deliveryWeek", String(week));
      form.setValue("deliveryYear", date.slice(0, 4));
    }
  };

  // What the supplier's record holds: contacts, addresses, terms, telephone.
  // Sequential rather than concurrent: this database caps connections.
  const loadSupplierData = async (uuid: string) => {
    setIsLoadingSupplierData(true);
    try {
      setContacts(await getContactsForCompany(uuid));
      setSupplierAddresses(await getAddressesForCompany(uuid));
      const defaults = await getPurchaseSupplierDefaults(uuid);
      setSupplierDefaults(defaults);
      return defaults;
    } finally {
      setIsLoadingSupplierData(false);
    }
  };

  // The Edit screen opens on the saved supplier, so its contacts and banner
  // are read without touching what the order already says.
  useEffect(() => {
    if (existing?.supplierUuid) {
      void loadSupplierData(existing.supplierUuid);
    }
  }, [existing?.supplierUuid]);

  // ⚠️ Changing the supplier used to wipe every line, because the lines could
  // only name that supplier's own articles. They name the catalogue now, so the
  // lines survive — a buyer who has typed out five lines and then realises the
  // order is going to the other mill does not retype them.
  const handleSupplierChange = (uuid: string) => {
    form.setValue("supplierUuid", uuid);
    form.setValue("contactUuid", "");
    form.setValue("supplierAddressUuid", "");
    setContacts([]);
    setSupplierAddresses([]);
    setSupplierDefaults(null);
    if (!uuid) {
      return;
    }
    void loadSupplierData(uuid).then((defaults) => {
      // The supplier brings the terms with it. Watched on 9-10-2026: typing
      // `11692` into a blank order filled the contact, `Prepayment`, `(CPT)`
      // and a delivery date before a line existed.
      if (defaults) {
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
      }
      // The date goes from the `1-1-0001` sentinel to the next working day:
      // a Friday order (9-10-2026) read Monday 12-10-2026, week 42.
      if (!form.getValues("deliveryDate")) {
        handleDeliveryDateChange(
          addLeadTime(todayDateString(), 1, "working_days") ?? "",
        );
      }
    });
  };

  const handleAgentChange = (uuid: string) => {
    form.setValue("agentUuid", uuid);
  };

  const handleCancel = () =>
    router.push(existing ? `/purchase-orders/${existing.uuid}` : "/purchase-orders");

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      // On success either action lands on the order itself, server-side.
      const result = existing
        ? await updatePurchaseOrder(existing.uuid, fieldsOf(values))
        : await createPurchaseOrder(fieldsOf(values), values.items);
      setState(result);
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
    yardAddress,
    handleSupplierChange,
    handleAgentChange,
    handleDeliveryDateChange,
    handleCancel,
  };
};
