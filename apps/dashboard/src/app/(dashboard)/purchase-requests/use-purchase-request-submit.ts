"use client";

import {
  AddressOption,
  getAddressesForCompany,
  getInternalAddressesForSelect,
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
import { dateStringInDays, isoWeekOf, onWorkingDay } from "@/lib/helpers";
import { ClerkUserOption } from "@/lib/server/clerk";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import {
  createPurchaseRequest,
  PurchaseRequestActionResult,
  PurchaseRequestItemInput,
  updatePurchaseRequest,
} from "./actions";
import {
  DEFAULT_PURCHASE_REQUEST,
  DEFAULT_PURCHASE_REQUEST_ITEM,
  PurchaseRequestFormValues,
  purchaseRequestSchema,
} from "./validation";

type UsePurchaseRequestSubmitParams = {
  companies: CompanyOption[];
  clerkUsers: ClerkUserOption[];
  /** Set when editing an existing request; omitted when creating one. */
  purchaseRequestUuid?: string;
  defaultValues?: PurchaseRequestFormValues;
};

const optionalNumber = (value: string | undefined): number | null =>
  value && Number.isFinite(Number(value)) ? Number(value) : null;

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

export const usePurchaseRequestSubmit = ({
  companies,
  clerkUsers,
  purchaseRequestUuid,
  defaultValues,
}: UsePurchaseRequestSubmitParams) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState<PurchaseRequestActionResult>({});
  const [contacts, setContacts] = useState<ContactOption[]>([]);
  const [supplierAddresses, setSupplierAddresses] = useState<AddressOption[]>(
    [],
  );
  const [isLoadingSupplierData, setIsLoadingSupplierData] = useState(false);
  // The supplier's record, for the banner's `Tel: …, Fax:` and its terms.
  const [supplierDefaults, setSupplierDefaults] =
    useState<PurchaseSupplierDefaults | null>(null);
  const [ownAddresses, setOwnAddresses] = useState<AddressOption[]>([]);

  const form = useForm<PurchaseRequestFormValues>({
    resolver: zodResolver(purchaseRequestSchema),
    defaultValues: defaultValues ?? DEFAULT_PURCHASE_REQUEST,
  });

  const {
    fields: itemFields,
    append: appendItem,
    remove: removeItem,
  } = useFieldArray({ control: form.control, name: "items" });

  const arrangeTransport = form.watch("arrangeTransport");
  const pickupDropoffCdPurchases = form.watch("pickupDropoffCdPurchases");
  const deliveryType = form.watch("deliveryType");
  // Payment terms stay greyed until a supplier is chosen, as in the reference.
  const hasSupplier = Boolean(form.watch("supplierUuid"));

  const supplierCompanies = companies.filter((c) =>
    c.roles?.includes("supplier"),
  );
  const agentCompanies = companies.filter((c) => c.roles?.includes("agent"));

  // `11692 — Holland Stainless Int`: the code beside the name, as the
  // reference prints it next to the field.
  const supplierOptions: SelectOption[] = [
    emptyOpt,
    ...supplierCompanies.map((c) => ({
      value: c.uuid,
      label:
        [c.searchCode1, c.companyName].filter(Boolean).join(" — ") || c.uuid,
    })),
  ];

  const agentOptions: SelectOption[] = [
    emptyOpt,
    ...agentCompanies.map((c) => ({
      value: c.uuid,
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

  const supplierAddressOptions: SelectOption[] = [
    emptyOpt,
    ...supplierAddresses.map((a) => ({
      value: a.uuid,
      label: addressLabel(a),
    })),
  ];

  // Where the goods are delivered: one of our own addresses.
  const deliveryAddressOptions: SelectOption[] = [
    emptyOpt,
    ...ownAddresses.map((a) => ({
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

  // Sequential rather than concurrent: this database caps connections.
  const loadSupplierData = useCallback(
    async (uuid: string): Promise<PurchaseSupplierDefaults | null> => {
      setContacts([]);
      setSupplierAddresses([]);
      setSupplierDefaults(null);
      if (!uuid) {
        return null;
      }
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
    },
    [],
  );

  // An existing request already names a company, so its contacts and addresses
  // have to be fetched before the form can show which ones are selected.
  const editingCompanyUuid =
    defaultValues?.supplierUuid || defaultValues?.agentUuid;
  useEffect(() => {
    if (!editingCompanyUuid) {
      return;
    }
    void loadSupplierData(editingCompanyUuid);
  }, [editingCompanyUuid, loadSupplierData]);

  // Saving filled the reference's greyed `Supplier address` with the
  // supplier's own (`Brigadier Aad de Jonghof 2, 3069 RR, ROTTERDAM` on
  // 11692, 12-10-2026): its first address stands in until one is chosen.
  useEffect(() => {
    const [first] = supplierAddresses;
    if (first && !form.getValues("supplierAddressUuid")) {
      form.setValue("supplierAddressUuid", first.uuid);
    }
  }, [supplierAddresses, form]);

  useEffect(() => {
    const subscription = { cancelled: false };
    void getInternalAddressesForSelect().then((rows) => {
      if (!subscription.cancelled) {
        setOwnAddresses(rows);
      }
    });
    return () => {
      subscription.cancelled = true;
    };
  }, []);

  const handleSupplierChange = (uuid: string) => {
    form.setValue("supplierUuid", uuid);
    form.setValue("contactUuid", "");
    form.setValue("supplierAddressUuid", "");
    // Choosing the supplier dates the request: the reference's Date went from
    // blank to the next working day (13-10-2026, opened 12-10-2026), which
    // every new line then reads.
    if (!form.getValues("deliveryDate")) {
      handleDeliveryDateChange(onWorkingDay(dateStringInDays(1)));
    }
    // The supplier brings its terms with it, as on a purchase order: its only
    // contact, its payment and delivery terms and its weight type.
    void loadSupplierData(uuid).then((defaults) => {
      if (!defaults || form.getValues("supplierUuid") !== uuid) {
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

  const handleAgentChange = (uuid: string) => {
    form.setValue("agentUuid", uuid);
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
      purchaseRequestUuid
        ? `/purchase-requests/${purchaseRequestUuid}`
        : "/purchase-requests",
    );

  const onSubmit = form.handleSubmit((values) => {
    // Blank rows are the field array's starting state, not a line someone
    // meant to ask for — drop anything with neither a product nor a
    // description.
    const items: PurchaseRequestItemInput[] = values.items
      .filter((item) => item.productUuid || item.description)
      .map((item, index) => {
        // Kg(p) as the grid showed it: the article's piece weight times the
        // quantity, or the weight already on a saved line.
        const pieceWeightKg = Number(item.pieceWeightKg ?? 0);
        const quantity = Number(item.quantity ?? 0);
        return {
          productUuid: item.productUuid || null,
          // Which sales order line this material is being bought for. Dropping
          // it would leave the request unable to say what it is for, which is
          // the whole reason the column exists.
          forOrderItemUuid: item.forOrderItemUuid || null,
          description: item.description || null,
          lineNumber: index + 1,
          stockCategory: item.stockCategory || null,
          qualityCode: item.qualityCode || null,
          quantity: item.quantity || "0.000",
          unit: item.unit ?? "st",
          kg:
            pieceWeightKg > 0
              ? (pieceWeightKg * quantity).toFixed(2)
              : item.kg || "0.00",
          lengthMm: optionalNumber(item.lengthMm),
          widthMm: optionalNumber(item.widthMm),
          thicknessMm: item.thicknessMm || null,
          requiredDate: item.requiredDate || null,
          remark: item.remark || null,
        };
      });

    startTransition(async () => {
      const fields = {
        companyUuid: values.supplierUuid || values.agentUuid || null,
        contactUuid: values.contactUuid || null,
        purchaser: values.purchaser || null,
        orderCategory: values.orderCategory || null,
        reference: values.reference || null,
        ourReference: values.ourReference || null,

        purchaseOrderType: values.purchaseOrderType || null,
        weightType: values.weightType || null,
        isOverlength: values.isOverlength,
        isPrinted: values.isPrinted,
        isMailed: values.isMailed,
        isFaxed: values.isFaxed,
        messageSentViaStaalWeb: values.messageSentViaStaalWeb,

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

        deadline: values.deadline ? new Date(values.deadline) : null,

        documents: null,
      };

      // Updating redirects from inside the action, so only the create path has
      // a result worth navigating on.
      if (purchaseRequestUuid) {
        setState(await updatePurchaseRequest(purchaseRequestUuid, fields, items));
        return;
      }

      const result = await createPurchaseRequest(fields, items);
      setState(result);
      if (result.success) {
        router.push("/purchase-requests");
      }
    });
  });

  return {
    form,
    isPending,
    isEditing: Boolean(purchaseRequestUuid),
    onSubmit,
    state,
    arrangeTransport,
    pickupDropoffCdPurchases,
    deliveryType,
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
    appendItem: () => appendItem(DEFAULT_PURCHASE_REQUEST_ITEM),
    removeItem,
  };
};
