"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { useForm, Resolver } from "react-hook-form";
import {
  ComplaintActionResult,
  createComplaint,
  updateComplaint,
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
import { DashboardUserOption } from "@/lib/server/clerk";
import {
  complaintCategories,
  complaintCauses,
  complaintReports,
  complaintSolutions,
  complaintStatuses,
  complaintTypes,
  ComplaintCategory,
  ComplaintCause,
  ComplaintReport,
  ComplaintSolution,
  ComplaintType,
} from "@/lib/enums";
import {
  COMPLAINT_CATEGORY_LABELS,
  COMPLAINT_CAUSE_LABELS,
  COMPLAINT_REPORT_LABELS,
  COMPLAINT_SOLUTION_LABELS,
  COMPLAINT_STATUS_LABELS,
  COMPLAINT_TYPE_LABELS,
} from "@/lib/labels";

type UseComplaintSubmitParams = {
  companies: CompanyOption[];
  products: ProductOption[];
  responsibleUsers: DashboardUserOption[];
  /** Set when editing an existing complaint; omitted when creating one. */
  complaintUuid?: string;
  defaultValues?: ComplaintFormValues;
};

const emptyOption = { value: "", label: "Empty" };

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
  responsibleUsers,
  complaintUuid,
  defaultValues,
}: UseComplaintSubmitParams) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState<ComplaintActionResult>({});
  const [contacts, setContacts] = useState<ContactOption[]>([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);

  const form = useForm<ComplaintFormValues>({
    resolver: zodResolver(complaintSchema) as Resolver<ComplaintFormValues>,
    defaultValues: defaultValues ?? DEFAULT_COMPLAINT,
  });

  // An existing complaint already has a company picked, so its contacts have to
  // be fetched before the form can show which one is selected.
  const loadContacts = useCallback((uuid: string) => {
    setIsLoadingContacts(true);
    getContactsForCompany(uuid).then((result) => {
      setContacts(result);
      setIsLoadingContacts(false);
    });
  }, []);

  const editingCompanyUuid = defaultValues?.companyUuid;
  useEffect(() => {
    if (!editingCompanyUuid) {
      return;
    }
    loadContacts(editingCompanyUuid);
  }, [editingCompanyUuid, loadContacts]);

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

  const statusOptions: SelectOption[] = complaintStatuses.map((v) => ({
    value: v,
    label: COMPLAINT_STATUS_LABELS[v],
  }));

  const causeOptions = makeOptions(
    complaintCauses,
    COMPLAINT_CAUSE_LABELS as Record<ComplaintCause, string>,
  );

  const solutionOptions = makeOptions(
    complaintSolutions,
    COMPLAINT_SOLUTION_LABELS as Record<ComplaintSolution, string>,
  );

  const responsibleOptions: SelectOption[] = [
    emptyOption,
    ...responsibleUsers.map((u) => ({ value: u.id, label: u.label })),
  ];

  const handleCompanyChange = (uuid: string) => {
    form.setValue("companyUuid", uuid);
    form.setValue("contactUuid", "");
    setContacts([]);
    if (!uuid) {
      return;
    }
    loadContacts(uuid);
  };

  const handleCancel = () =>
    router.push(complaintUuid ? `/complaints/${complaintUuid}` : "/complaints");

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const fields = {
        companyUuid: values.companyUuid,
        contactUuid: values.contactUuid || null,
        complaintType: values.complaintType,
        report: values.report,
        reportDate: values.reportDate ? new Date(values.reportDate) : null,
        description: values.description,
        category: values.category,
        productUuid: values.productUuid || null,
        qty: values.qty,
        amount: values.amount,
        weight: values.weight,
        status: values.status,
        responsibleUserId: values.responsibleUserId,
        deadline: values.deadline,
        cause: values.cause,
        explanationOfCause: values.explanationOfCause,
        solution: values.solution,
        explanationOfSolution: values.explanationOfSolution,
        costsCustomer: values.costsCustomer,
        costsCustomerNote: values.costsCustomerNote,
        internalCosts: values.internalCosts,
        internalCostsNote: values.internalCostsNote,
        extraCosts: values.extraCosts,
        extraCostsNote: values.extraCostsNote,
        toBeReclaimed: values.toBeReclaimed,
        toBeReclaimedNote: values.toBeReclaimedNote,
        documents: values.documents,
      };

      // Updating redirects from inside the action, so only the create path has
      // a result worth navigating on.
      if (complaintUuid) {
        setState(await updateComplaint(complaintUuid, fields));
        return;
      }

      const result = await createComplaint(fields);
      setState(result);
      if (result.success && result.complaintUuid) {
        router.push(`/complaints/${result.complaintUuid}`);
      }
    });
  });

  return {
    form,
    isPending,
    isEditing: Boolean(complaintUuid),
    onSubmit,
    state,
    companyOptions,
    contactOptions,
    productOptions,
    complaintTypeOptions,
    complaintReportOptions,
    complaintCategoryOptions,
    statusOptions,
    causeOptions,
    solutionOptions,
    responsibleOptions,
    isLoadingContacts,
    handleCompanyChange,
    handleCancel,
  };
};
