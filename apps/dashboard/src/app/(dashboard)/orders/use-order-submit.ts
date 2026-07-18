"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import {
  ContractOption,
  createOrder,
  getContractsByCompanyUuid,
  OrderActionResult,
  OrderExtras,
} from "./actions";
import {
  AddressOption,
  getAddressesForCompany,
} from "@/app/(dashboard)/addresses/actions";
import { DEFAULT_ORDER, orderSchema, OrderFormValues } from "./validation";
import {
  CompanyOption,
  getProjectsForCompany,
  ProjectOption,
} from "@/app/(dashboard)/companies/actions";
import {
  ContactOption,
  getContactsForCompany,
} from "@/app/(dashboard)/contacts/actions";
import {
  AvailableStockOption,
  getAvailableStockForSelect,
} from "@/app/(dashboard)/stock/actions";
import { SelectOption } from "@/components/shadcn/select";
import {
  deliveryTerms,
  invoicePaymentTerms,
  orderMethods,
  orderWeightTypes,
  DeliveryTerm,
  InvoicePaymentTerm,
  OrderMethod,
  OrderWeightType,
} from "@/lib/enums";
import {
  COMMON_TEXT,
  DELIVERY_TERM_LABELS,
  INVOICE_PAYMENT_TERM_LABELS,
  ORDER_METHOD_LABELS,
  ORDER_WEIGHT_TYPE_LABELS,
} from "@/lib/labels";
import { toDecimal } from "@/lib/helpers";

type UseOrderSubmitParams = {
  companies: CompanyOption[];
};

const emptyOpt = { value: "", label: COMMON_TEXT.emptyOption };

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

export const useOrderSubmit = ({ companies }: UseOrderSubmitParams) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState<OrderActionResult>({});
  const [contacts, setContacts] = useState<ContactOption[]>([]);
  const [addresses, setAddresses] = useState<AddressOption[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [contracts, setContracts] = useState<ContractOption[]>([]);
  const [isLoadingCompanyData, setIsLoadingCompanyData] = useState(false);
  const [availableStock, setAvailableStock] = useState<AvailableStockOption[]>(
    [],
  );

  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderSchema),
    defaultValues: DEFAULT_ORDER,
  });

  const {
    fields: itemFields,
    append: appendItem,
    remove: removeItem,
  } = useFieldArray({ control: form.control, name: "items" });

  useEffect(() => {
    getAvailableStockForSelect().then(setAvailableStock);
  }, []);

  const stockOptions: SelectOption[] = [
    emptyOpt,
    ...availableStock.map((s) => ({
      value: s.uuid,
      label: `${[s.productCode, s.productName].filter(Boolean).join(" — ")} (${s.quantity} available)`,
    })),
  ];

  const isPickup = form.watch("isPickup");
  const isConsignment = form.watch("isConsignment");
  const deliveryType = form.watch("deliveryType");

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

  const paymentTermOptions = makeOptions(
    invoicePaymentTerms,
    INVOICE_PAYMENT_TERM_LABELS as Record<InvoicePaymentTerm, string>,
  );

  const handleCompanyChange = (uuid: string) => {
    form.setValue("companyUuid", uuid);
    form.setValue("contactUuid", "");
    form.setValue("projectUuid", "");
    form.setValue("deliveryAddressUuid", "");
    form.setValue("billingAddressUuid", "");
    form.setValue("contractUuids", []);
    setContacts([]);
    setProjects([]);
    setAddresses([]);
    setContracts([]);
    if (!uuid) {
      return;
    }
    setIsLoadingCompanyData(true);
    Promise.all([
      getContactsForCompany(uuid),
      getProjectsForCompany(uuid),
      getAddressesForCompany(uuid),
      getContractsByCompanyUuid(uuid),
    ]).then(([newContacts, newProjects, newAddresses, newContracts]) => {
      setContacts(newContacts);
      setProjects(newProjects);
      setAddresses(newAddresses);
      setContracts(newContracts);
      setIsLoadingCompanyData(false);
    });
  };

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
        title: text.title,
        textBlock: text.textBlock,
        textCategoryUuid: text.textCategoryUuid || null,
      })),
      contractUuids: values.contractUuids,
    };

    startTransition(async () => {
      const result = await createOrder(
        {
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
          isKlantMateriaal: values.isKlantMateriaal,
          weightType: values.weightType,
          isOverlengte: values.isOverlengte,
          isPrinted: values.isPrinted,
          isMailed: values.isMailed,
          isFaxed: values.isFaxed,

          deliveryTerms: values.isPickup ? null : values.deliveryTerms,
          deliveryAddressUuid: values.isPickup
            ? null
            : values.deliveryAddressUuid,
          deliveryType: values.deliveryType,
          deliveryDate: values.deliveryDate
            ? new Date(values.deliveryDate)
            : null,
          deliveryWeek: values.deliveryWeek ?? null,
          deliveryYear: values.deliveryYear ?? null,
          deliveryRemark: values.deliveryRemark,

          completeDelivery: values.completeDelivery,
          transportBlockage: values.transportBlockage,
          vehicleWithCrane: values.vehicleWithCrane,
          vehicleWithCanopy: values.vehicleWithCanopy,
          bundlingSeparate: values.bundlingSeparate,
          transportRegion: values.transportRegion,
          maxLengthMm: values.maxLengthMm ? Number(values.maxLengthMm) : null,
          maxBundleWeightKg: values.maxBundleWeightKg,
          deliveryAfterTime: values.deliveryAfterTime,
          deliverForTime: values.deliverForTime,
          transportMode: values.transportMode,

          showNetPrice: values.showNetPrice,
          scrapSurchargeSeparate: values.scrapSurchargeSeparate,
          calculateVatIfApplicable: values.calculateVatIfApplicable,
          financialBlockage: values.financialBlockage,
          invoiceBlockage: values.invoiceBlockage,
          onlyTotalAmountOnInvoice: values.onlyTotalAmountOnInvoice,
          includeOptionPricesInMaterialPrices:
            values.includeOptionPricesInMaterialPrices,
          paymentTerms: values.paymentTerms,
          billingAddressUuid: values.billingAddressUuid,
          blockingReason: values.blockingReason,

          remarks: values.remarks || null,
          documents: values.documents.length > 0 ? values.documents : null,
        },
        values.items ?? [],
        extras,
      );

      setState(result);
      if (result.success) {
        router.push("/orders");
      }
    });
  });

  return {
    form,
    isPending,
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
    weightTypeOptions,
    paymentTermOptions,
    contracts,
    isLoadingCompanyData,
    handleCompanyChange,
    handleCancel,
    stockOptions,
    itemFields,
    appendItem,
    removeItem,
  };
};
