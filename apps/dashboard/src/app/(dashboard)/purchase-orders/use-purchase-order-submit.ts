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
import { addLeadTime, isoWeekOf, todayDateString } from "@/lib/helpers";
import { ClerkUserOption } from "@/lib/server/clerk";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import {
  createPurchaseOrder,
  getPurchaseSupplierDefaults,
  PurchaseOrderActionResult,
  PurchaseSupplierDefaults,
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

export const usePurchaseOrderSubmit = ({
  companies,
  clerkUsers,
  currentUserId,
  yardAddress,
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
    defaultValues: {
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
    setIsLoadingSupplierData(true);
    // Sequential rather than concurrent: this database caps connections.
    getContactsForCompany(uuid)
      .then(async (newContacts) => {
        setContacts(newContacts);
        setSupplierAddresses(await getAddressesForCompany(uuid));
        const defaults = await getPurchaseSupplierDefaults(uuid);
        setSupplierDefaults(defaults);

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
      })
      .finally(() => setIsLoadingSupplierData(false));
  };

  const handleAgentChange = (uuid: string) => {
    form.setValue("agentUuid", uuid);
  };

  const handleCancel = () => router.push("/purchase-orders");

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = await createPurchaseOrder(
        {
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
          deliveryDate: values.deliveryDate
            ? new Date(values.deliveryDate)
            : null,
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
        },
        values.items,
      );

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
