"use client";

import { InsertVisitReports } from "@/db";
import { VisitReportReason } from "@/lib/enums";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { createVisitReport, VisitReportActionResult } from "./actions";
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

      categories: [],
      readers: [],

      industry: "",
      classification: "",
      visitFrequency: "0",
      callFrequencyPerYear: "0",
      targetDateNextVisit: "",
      nextVisitReason: "",
      potentialAnnualRevenue: "0.00",
      targetAnnualRevenue: "0.00",
      potentialAnnualSales: "0.000",
      targetAnnualSales: "0.000",
      numberOfEmployees: "0",

      visitPlanning: Array.from({ length: 12 }, () => ({
        call: false,
        visit: false,
      })),
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
        visitReason: (values.visitReason as VisitReportReason) || undefined,
        attentionPoint: values.attentionPoint,
        remarks: values.remarks,

        categories: values.categories,
        readers: values.readers,

        industry: values.industry || undefined,
        classification: (values.classification ||
          undefined) as InsertVisitReports["classification"],
        visitFrequency: values.visitFrequency
          ? Number(values.visitFrequency)
          : undefined,
        callFrequencyPerYear: values.callFrequencyPerYear
          ? Number(values.callFrequencyPerYear)
          : undefined,
        targetDateNextVisit: values.targetDateNextVisit
          ? new Date(values.targetDateNextVisit)
          : null,
        nextVisitReason: (values.nextVisitReason ||
          undefined) as InsertVisitReports["nextVisitReason"],
        potentialAnnualRevenue: values.potentialAnnualRevenue
          ? String(values.potentialAnnualRevenue)
          : undefined,
        targetAnnualRevenue: values.targetAnnualRevenue
          ? String(values.targetAnnualRevenue)
          : undefined,
        potentialAnnualSales: values.potentialAnnualSales
          ? String(values.potentialAnnualSales)
          : undefined,
        targetAnnualSales: values.targetAnnualSales
          ? String(values.targetAnnualSales)
          : undefined,
        numberOfEmployees: values.numberOfEmployees
          ? Number(values.numberOfEmployees)
          : undefined,
        visitPlanning: values.visitPlanning,
      });

      setState(result);
    });
  });

  return { form, isPending, onSubmit, state };
};
