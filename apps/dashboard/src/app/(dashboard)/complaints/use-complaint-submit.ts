"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import {
  ComplaintActionResult,
  createComplaint,
} from "./actions";
import {
  ContactOption,
  getContactsForCompany,
} from "@/app/(dashboard)/contacts/actions";
import {
  complaintSchema,
  ComplaintFormValues,
  DEFAULT_COMPLAINT,
} from "./validation";
import { CompanyOption } from "@/app/(dashboard)/companies/actions";
import { ProductOption } from "@/app/(dashboard)/products/actions";
import { SelectOption } from "@/components/shadcn/select";
import {
  complaintCategories,
  complaintReports,
  complaintTypes,
  ComplaintCategory,
  ComplaintReport,
  ComplaintType,
} from "@/lib/enums";
import {
  COMMON_TEXT,
  COMPLAINT_CATEGORY_LABELS,
  COMPLAINT_REPORT_LABELS,
  COMPLAINT_TYPE_LABELS,
} from "@/lib/labels";

type UseComplaintSubmitParams = {
  companies: CompanyOption[];
  products: ProductOption[];
};

const emptyOption = { value: "", label: COMMON_TEXT.emptyOption };

const makeOptions = <T extends string>(
  values: readonly T[],
  labels: Record<T, string>,
): SelectOption[] => [
  emptyOption,
  ...values.map((v) => ({ value: v, label: labels[v] })),
];

export const useComplaintSubmit = ({
  companies,
  products,
}: UseComplaintSubmitParams) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState<ComplaintActionResult>({});
  const [contacts, setContacts] = useState<ContactOption[]>([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);

  const form = useForm<ComplaintFormValues, unknown>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(complaintSchema) as any,
    defaultValues: DEFAULT_COMPLAINT,
  });

  const companyOptions: SelectOption[] = [
    emptyOption,
    ...companies.map((c) => ({
      value: c.uuid,
      label: c.companyName ?? c.searchCode1 ?? c.uuid,
    })),
  ];

  const contactOptions: SelectOption[] = [
    emptyOption,
    ...contacts.map((c) => ({
      value: c.uuid,
      label: [c.firstName, c.lastName].filter(Boolean).join(" ") || c.uuid,
    })),
  ];

  const productOptions: SelectOption[] = [
    emptyOption,
    ...products.map((p) => ({
      value: p.uuid,
      label: `${p.productCode} — ${p.name}`,
    })),
  ];

  const complaintTypeOptions = makeOptions(
    complaintTypes,
    COMPLAINT_TYPE_LABELS as Record<ComplaintType, string>,
  );

  const complaintReportOptions = makeOptions(
    complaintReports,
    COMPLAINT_REPORT_LABELS as Record<ComplaintReport, string>,
  );

  const complaintCategoryOptions = makeOptions(
    complaintCategories,
    COMPLAINT_CATEGORY_LABELS as Record<ComplaintCategory, string>,
  );

  const handleCompanyChange = (uuid: string) => {
    form.setValue("companyUuid", uuid);
    form.setValue("contactUuid", "");
    setContacts([]);
    if (!uuid) return;
    setIsLoadingContacts(true);
    getContactsForCompany(uuid).then((result) => {
      setContacts(result);
      setIsLoadingContacts(false);
    });
  };

  const handleCancel = () => router.push("/complaints");

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = await createComplaint({
        companyUuid: values.companyUuid,
        contactUuid: values.contactUuid || null,
        complaintType: values.complaintType || null,
        report: values.report || null,
        reportDate: values.reportDate ? new Date(values.reportDate) : null,
        description: values.description || null,
        category: values.category || null,
        productUuid: values.productUuid || null,
        qty: values.qty,
        amount: values.amount,
        weight: values.weight,
      });

      setState(result);
      if (result.success) {
        router.push("/complaints");
      }
    });
  });

  return {
    form,
    isPending,
    onSubmit,
    state,
    companyOptions,
    contactOptions,
    productOptions,
    complaintTypeOptions,
    complaintReportOptions,
    complaintCategoryOptions,
    isLoadingContacts,
    handleCompanyChange,
    handleCancel,
  };
};
