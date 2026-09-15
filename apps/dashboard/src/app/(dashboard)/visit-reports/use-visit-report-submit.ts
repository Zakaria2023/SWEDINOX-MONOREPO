"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { createVisitReport, VisitReportActionResult } from "./actions";
import { formValuesToVisitReportInput } from "./mappers";
import { createVisitReportSchema, VisitReportFormValues } from "./validation";

export const useVisitReportSubmit = () => {
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState<VisitReportActionResult>({});

  const form = useForm<VisitReportFormValues>({
    resolver: zodResolver(createVisitReportSchema()),
    defaultValues: {
      companyUuid: "",
      representative: "",
      visitedBy: "",
      contactUuid: "",
      contactMethod: "",
      visitDate: "",
      visitTime: "",
      hasTakenPlace: false,
      visitReason: "",
      attentionPoint: "",
      remarks: "",

      categories: [],
      readers: [],
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = await createVisitReport(
        formValuesToVisitReportInput(values),
      );

      setState(result);
    });
  });

  return { form, isPending, onSubmit, state };
};
