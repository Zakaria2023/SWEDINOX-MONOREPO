"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { type VisitReportReason } from "@/lib/enums";
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
      contactUuid: "",
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
        representative: values.representative,
        visitedBy: values.visitedBy,
        address: values.address,
        postalCode: values.postalCode,
        city: values.city,
        telephone: values.telephone,
        fax: values.fax,
        contactUuid: values.contactUuid,
        contactMethod: values.contactMethod || undefined,
        visitDate: values.visitDate,
        visitTime: values.visitTime,
        hasTakenPlace: values.hasTakenPlace,
        visitReason: values.visitReason as VisitReportReason,
        attentionPoint: values.attentionPoint,
        remarks: values.remarks,
      });

      setState(result);
    });
  });

  return { form, isPending, onSubmit, state };
};
