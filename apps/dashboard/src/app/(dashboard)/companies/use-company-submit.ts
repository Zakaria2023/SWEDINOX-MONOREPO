"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { createCompany, type CompanyActionResult } from "./actions";
import { companySchema, type CompanyFormValues } from "./validation";

export const useCompanySubmit = () => {
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState<CompanyActionResult>({});

  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      companyName: "",
      address: {
        category: [],
        poBox: false,
        needCrane: false,
        canopyRequired: false,
        bundleSeparately: false,
        addressComplete: false,
        specialTransport: false,
        altName: "",
        streetAndNo: "",
        postalCode: "",
        country: "",
        city: "",
        region: "",
        house: "",
        telephone: "",
        fax: "",
        email: "",
        website: "",
        billingAttention: "",
        billingAttentionAdditional: "",
        gln: "",
        peppolId: "",
        sequenceNumber: "",
        availableAt: "",
        unloadingStartTime: "",
        unloadingEndTime: "",
        maxLength: "",
        maxBundleWeight: "",
        loadingInstructions: "",
      },
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const { companyName, address } = values;

      const result = await createCompany(companyName, {
        altName: address.altName || undefined,
        poBox: address.poBox,
        streetAndNo: address.streetAndNo || undefined,
        postalCode: address.postalCode || undefined,
        country: address.country || undefined,
        city: address.city || undefined,
        region: address.region || undefined,
        house: address.house || undefined,
        telephone: address.telephone || undefined,
        fax: address.fax || undefined,
        email: address.email || undefined,
        website: address.website || undefined,
        billingAttention: address.billingAttention || undefined,
        billingAttentionAdditional: address.billingAttentionAdditional || undefined,
        gln: address.gln || undefined,
        peppolId: address.peppolId || undefined,
        sequenceNumber: address.sequenceNumber
          ? Number(address.sequenceNumber)
          : undefined,
        category: address.category,
        needCrane: address.needCrane,
        canopyRequired: address.canopyRequired,
        bundleSeparately: address.bundleSeparately,
        addressComplete: address.addressComplete,
        specialTransport: address.specialTransport,
        availableAt: address.availableAt || undefined,
        unloadingStartTime: address.unloadingStartTime || undefined,
        unloadingEndTime: address.unloadingEndTime || undefined,
        maxLength: address.maxLength || undefined,
        maxBundleWeight: address.maxBundleWeight || undefined,
        loadingInstructions: address.loadingInstructions || undefined,
      });

      setState(result);
    });
  });

  return { form, isPending, onSubmit, state };
};
