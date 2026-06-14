"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { createVisitReport, type VisitReportActionResult } from "./actions";
import {
  createVisitReportSchema,
  type VisitReportFormValues,
} from "./validation";

export const useVisitReportSubmit = () => {
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState<VisitReportActionResult>({});

  const form = useForm<VisitReportFormValues>({
    resolver: zodResolver(createVisitReportSchema()),
    defaultValues: {
      companyUuid: "",
      representative: "",
      visitedBy: "",
      address: "",
      postalCode: "",
      city: "",
      telephone: "",
      fax: "",
      contact: "",
      contactMethod: "",
      visitDate: "",
      visitTime: "",
      hasTakenPlace: false,
      visitReason: "",
      attentionPoint: "",
      remarks: "",
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = await createVisitReport({
        companyUuid: values.companyUuid,
        representative: values.representative || undefined,
        visitedBy: values.visitedBy || undefined,
        address: values.address || undefined,
        postalCode: values.postalCode || undefined,
        city: values.city || undefined,
        telephone: values.telephone || undefined,
        fax: values.fax || undefined,
        contact: values.contact || undefined,
        contactMethod: values.contactMethod || undefined,
        visitDate: values.visitDate || undefined,
        visitTime: values.visitTime || undefined,
        hasTakenPlace: values.hasTakenPlace,
        visitReason: values.visitReason || undefined,
        attentionPoint: values.attentionPoint || undefined,
        remarks: values.remarks || undefined,
      });

      setState(result);
    });
  });

  return { form, isPending, onSubmit, state };
};
