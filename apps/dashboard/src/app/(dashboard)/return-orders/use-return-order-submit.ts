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
  getOrdersForCompany,
  OrderOption,
} from "@/app/(dashboard)/orders/actions";
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
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import {
  createReturnOrder,
  updateReturnOrder,
  ReturnOrderActionResult,
  ReturnOrderExtras,
} from "./actions";
import {
  DEFAULT_RETURN_ORDER,
  ReturnOrderFormValues,
  returnOrderSchema,
} from "./validation";
import { toDecimal } from "@/lib/helpers";

type UseReturnOrderSubmitParams = {
  companies: CompanyOption[];
  /** Set when editing an existing return order; omitted when creating one. */
  returnOrderUuid?: string;
  defaultValues?: ReturnOrderFormValues;
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

export const useReturnOrderSubmit = ({
  companies,
  returnOrderUuid,
  defaultValues,
}: UseReturnOrderSubmitParams) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState<ReturnOrderActionResult>({});
  const [contacts, setContacts] = useState<ContactOption[]>([]);
  const [addresses, setAddresses] = useState<AddressOption[]>([]);
  const [orders, setOrders] = useState<OrderOption[]>([]);
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

  const handleCompanyChange = (uuid: string) => {
    form.setValue("companyUuid", uuid);
    form.setValue("contactUuid", "");
    form.setValue("orderUuid", "");
    form.setValue("deliveryAddressUuid", "");
    form.setValue("billingAddressUuid", "");
    setContacts([]);
    setOrders([]);
    setAddresses([]);
    if (!uuid) return;
    setIsLoadingCompanyData(true);
    Promise.all([
      getContactsForCompany(uuid),
      getOrdersForCompany(uuid),
      getAddressesForCompany(uuid),
    ]).then(([newContacts, newOrders, newAddresses]) => {
      setContacts(newContacts);
      setOrders(newOrders);
      setAddresses(newAddresses);
      setIsLoadingCompanyData(false);
    });
  };

  const handleCancel = () =>
    router.push(
      returnOrderUuid ? `/return-orders/${returnOrderUuid}` : "/return-orders",
    );

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
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

      const fields = {
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
        pickupAddress: values.isPickup ? values.pickupAddress || null : null,
        deliveryAddressUuid: values.isPickup
          ? null
          : values.deliveryAddressUuid || null,

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

      // Updating redirects from inside the action, so only the create path has
      // a result worth navigating on.
      if (returnOrderUuid) {
        setState(await updateReturnOrder(returnOrderUuid, fields, extras));
        return;
      }

      const result = await createReturnOrder(fields, extras);
      setState(result);
      if (result.success && result.returnOrderUuid) {
        router.push(`/return-orders/${result.returnOrderUuid}`);
      }
    });
  });

  return {
    form,
    isPending,
    isEditing: Boolean(returnOrderUuid),
    onSubmit,
    state,
    isPickup,
    companyOptions,
    contactOptions,
    orderOptions,
    addressOptions,
    returnReasonOptions,
    paymentTermOptions,
    transportRegionOptions,
    transportModeOptions,
    isLoadingCompanyData,
    handleCompanyChange,
    handleCancel,
  };
};
