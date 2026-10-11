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
  getOrdersForCompany,
  OrderOption,
} from "@/app/(dashboard)/orders/actions";
import { getYardDeliveryAddress } from "@/app/(dashboard)/purchase-orders/actions";
import { SelectOption } from "@/components/shadcn/select";
import {
  InvoicePaymentTerm,
  invoicePaymentTerms,
  ReturnOrderReason,
  returnOrderReasons,
  TransportMode,
  transportModes,
  WarehouseTransportRegion,
  warehouseTransportRegions,
} from "@/lib/enums";
import {
  INVOICE_PAYMENT_TERM_LABELS,
  RETURN_ORDER_REASON_LABELS,
  TRANSPORT_MODE_LABELS,
  WAREHOUSE_TRANSPORT_REGION_LABELS,
} from "@/lib/labels";
import {
  formatAddressLine,
  isPlaceholderAddress,
  toDecimal,
} from "@/lib/helpers";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import {
  startTransition,
  useActionState,
  useCallback,
  useEffect,
  useState,
} from "react";
import { useForm } from "react-hook-form";
import {
  ReturnableLine,
  ReturnOrderExtras,
  ReturnOrderFields,
  saveReturnOrder,
} from "./actions";
import {
  DEFAULT_RETURN_ORDER,
  ReturnOrderFormValues,
  returnOrderSchema,
} from "./validation";

const emptyOpt = { value: "", label: "Empty" };

type UseReturnOrderSubmitParams = {
  companies: CompanyOption[];
  /** Set on a saved return; omitted on a new one. */
  returnOrderUuid?: string;
  defaultValues?: ReturnOrderFormValues;
  /**
   * The saved return's delivery address as stored, offered even when it is not
   * one of our own addresses (returns written before the reference's layout
   * kept the customer's address there).
   */
  savedDeliveryAddress?: SelectOption | null;
};

/** A line on a return not saved yet — blank until its `…` picks a product. */
export type PendingReturnLine = {
  line: ReturnableLine | null;
  returnQty: string;
};

const makeOptions = <T extends string>(
  values: readonly T[],
  labels: Record<T, string>,
): SelectOption[] => [
  emptyOpt,
  ...values.map((v) => ({ value: v, label: labels[v] })),
];

const addressLabel = (a: AddressOption) =>
  [a.altName, formatAddressLine(a)].filter(Boolean).join(", ") || a.uuid;

export const useReturnOrderSubmit = ({
  companies,
  returnOrderUuid,
  defaultValues,
  savedDeliveryAddress = null,
}: UseReturnOrderSubmitParams) => {
  const router = useRouter();
  const [state, dispatch, isPending] = useActionState(saveReturnOrder, {});
  // Said before anything reaches the server: a line with no product yet.
  const [clientError, setClientError] = useState<string | undefined>();
  // Lines added on a return not saved yet; written with it on Create.
  const [pendingLines, setPendingLines] = useState<PendingReturnLine[]>([]);
  const [contacts, setContacts] = useState<ContactOption[]>([]);
  const [addresses, setAddresses] = useState<AddressOption[]>([]);
  const [orders, setOrders] = useState<OrderOption[]>([]);
  const [ownAddresses, setOwnAddresses] = useState<AddressOption[]>([]);
  const [isLoadingCompanyData, setIsLoadingCompanyData] = useState(false);

  const form = useForm<ReturnOrderFormValues>({
    resolver: zodResolver(returnOrderSchema),
    defaultValues: defaultValues ?? DEFAULT_RETURN_ORDER,
  });

  const isPickup = form.watch("isPickup");

  const customerCompanies = companies.filter(
    (c) => c.roles?.includes("customer") || c.roles?.includes("prospect"),
  );

  const companyOptions: SelectOption[] = [
    emptyOpt,
    ...customerCompanies.map((c) => ({
      value: c.uuid,
      // `12368 — Mercainox Componentes Industriais`: the code beside the name.
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

  // The customer's own addresses — what the return is billed to.
  const addressOptions: SelectOption[] = [
    emptyOpt,
    ...addresses.map((a) => ({ value: a.uuid, label: addressLabel(a) })),
  ];

  // 🔑 The reference inverts a sales order's two addresses on a return: the
  // goods are picked up at the customer's address and delivered to ours
  // (return 290247, 29-9-2026). Pick-up is stored as the address written out.
  const currentPickup = form.watch("pickupAddress") ?? "";
  const customerAddressLines = addresses
    .map((a) => formatAddressLine(a))
    .filter(Boolean);
  const pickupOptions: SelectOption[] = [
    emptyOpt,
    ...[
      ...(currentPickup && !customerAddressLines.includes(currentPickup)
        ? [currentPickup]
        : []),
      ...customerAddressLines,
    ].map((line) => ({ value: line, label: line })),
  ];

  const deliveryOptions: SelectOption[] = [
    emptyOpt,
    ...(savedDeliveryAddress &&
    !ownAddresses.some((a) => a.uuid === savedDeliveryAddress.value)
      ? [savedDeliveryAddress]
      : []),
    ...ownAddresses.map((a) => ({ value: a.uuid, label: addressLabel(a) })),
  ];

  const orderOptions: SelectOption[] = [
    emptyOpt,
    ...orders.map((o) => ({ value: o.uuid, label: `#${o.id}` })),
  ];

  const returnReasonOptions = makeOptions(
    returnOrderReasons,
    RETURN_ORDER_REASON_LABELS as Record<ReturnOrderReason, string>,
  );

  const paymentTermOptions = makeOptions(
    invoicePaymentTerms,
    INVOICE_PAYMENT_TERM_LABELS as Record<InvoicePaymentTerm, string>,
  );

  const transportRegionOptions = makeOptions(
    warehouseTransportRegions,
    WAREHOUSE_TRANSPORT_REGION_LABELS as Record<
      WarehouseTransportRegion,
      string
    >,
  );

  const transportModeOptions = makeOptions(
    transportModes,
    TRANSPORT_MODE_LABELS as Record<TransportMode, string>,
  );

  const loadCompanyData = useCallback(
    (uuid: string) => {
      setContacts([]);
      setOrders([]);
      setAddresses([]);
      if (!uuid) {
        return;
      }
      setIsLoadingCompanyData(true);
      void Promise.all([
        getContactsForCompany(uuid),
        getOrdersForCompany(uuid),
        getAddressesForCompany(uuid),
      ]).then(([newContacts, newOrders, newAddresses]) => {
        setContacts(newContacts);
        setOrders(newOrders);
        setAddresses(newAddresses);
        setIsLoadingCompanyData(false);
        // Pick-up fills from the customer record — the customer's own
        // address, `Rua A no 365` for Mercainox.
        const customerAddress =
          newAddresses.find((address) => !isPlaceholderAddress(address)) ??
          newAddresses[0];
        if (!form.getValues("pickupAddress") && customerAddress) {
          form.setValue("pickupAddress", formatAddressLine(customerAddress));
        }
        // With only one contact, that is the return's contact.
        if (!form.getValues("contactUuid") && newContacts.length === 1) {
          form.setValue("contactUuid", newContacts[0].uuid);
        }
      });
    },
    [form],
  );

  // A return that opens on a customer — a saved one, or `Par. return` on a
  // sales order — needs that customer's contacts, orders and addresses offered
  // straight away, not only after the customer is picked again.
  const initialCompanyUuid = defaultValues?.companyUuid;
  useEffect(() => {
    if (initialCompanyUuid) {
      loadCompanyData(initialCompanyUuid);
    }
  }, [initialCompanyUuid, loadCompanyData]);

  useEffect(() => {
    const subscription = { cancelled: false };
    void getInternalAddressesForSelect().then(async (rows) => {
      if (subscription.cancelled) {
        return;
      }
      setOwnAddresses(rows);
      // A new return is delivered to our yard — `Bolderweg 10, 1332AT,
      // Almere` in the reference's Delivery address before anything is typed.
      if (!returnOrderUuid && !form.getValues("deliveryAddressUuid")) {
        const yard = await getYardDeliveryAddress();
        if (yard && !subscription.cancelled) {
          form.setValue("deliveryAddressUuid", yard.uuid);
        }
      }
    });
    return () => {
      subscription.cancelled = true;
    };
  }, [form, returnOrderUuid]);

  const handleCompanyChange = (uuid: string) => {
    form.setValue("companyUuid", uuid);
    form.setValue("contactUuid", "");
    form.setValue("orderUuid", "");
    form.setValue("pickupAddress", "");
    form.setValue("billingAddressUuid", "");
    // The lines were the old customer's invoiced lines.
    setPendingLines([]);
    loadCompanyData(uuid);
  };

  // A saved return is edited on its own page, so leaving goes to the list.
  const handleCancel = () => router.push("/return-orders");

  const onSubmit = form.handleSubmit((values) => {
    setClientError(undefined);
    if (!returnOrderUuid && pendingLines.some((line) => !line.line)) {
      setClientError(
        "A line has no product yet — pick one with its … button, or delete the line.",
      );
      return;
    }

    const extras: ReturnOrderExtras = {
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
        title: text.title,
        textBlock: text.textBlock,
        textCategoryUuid: text.textCategoryUuid || null,
      })),
    };

    const fields: ReturnOrderFields = {
      companyUuid: values.companyUuid,
      orderUuid: values.orderUuid || null,
      complaintRef: values.complaintRef || null,
      contactUuid: values.contactUuid || null,
      customerRef: values.customerRef || null,
      ourReference: values.ourReference || null,
      handlingBlocked: values.handlingBlocked,
      isPrinted: values.isPrinted,
      isMailed: values.isMailed,
      isFaxed: values.isFaxed,

      returnDate: values.returnDate ? new Date(values.returnDate) : null,
      isPickup: values.isPickup,
      // Both are kept, as the reference shows both: the customer's address
      // the goods are collected from and ours they are delivered to.
      pickupAddress: values.pickupAddress || null,
      deliveryAddressUuid: values.deliveryAddressUuid || null,

      returnReason: values.returnReason,

      calculateVatIfApplicable: values.calculateVatIfApplicable,
      invoiceBlockage: values.invoiceBlockage,
      onlyTotalAmountOnInvoice: values.onlyTotalAmountOnInvoice,
      includeOptionPricesInMaterialPrices:
        values.includeOptionPricesInMaterialPrices,
      paymentTerms: values.paymentTerms || null,
      billingAddressUuid: values.billingAddressUuid || null,
      blockingReason: values.blockingReason || null,

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
      documents: values.documents?.length ? values.documents : null,
    };

    startTransition(() => {
      dispatch({
        returnOrderUuid,
        fields,
        extras,
        // The lines added under `Lines → New` go in with a new return; a saved
        // one saves its lines as they are typed.
        items: returnOrderUuid
          ? []
          : pendingLines.flatMap(({ line, returnQty }) =>
              line
                ? [
                    {
                      orderItemUuid: line.orderItemUuid,
                      returnQty,
                      returnReason: values.returnReason || null,
                    },
                  ]
                : [],
            ),
      });
    });
  });

  return {
    form,
    isPending,
    isEditing: Boolean(returnOrderUuid),
    onSubmit,
    error: clientError ?? state.error,
    pendingLines,
    setPendingLines,
    isPickup,
    companyOptions,
    contactOptions,
    orderOptions,
    addressOptions,
    pickupOptions,
    deliveryOptions,
    returnReasonOptions,
    paymentTermOptions,
    transportRegionOptions,
    transportModeOptions,
    isLoadingCompanyData,
    handleCompanyChange,
    handleCancel,
  };
};
