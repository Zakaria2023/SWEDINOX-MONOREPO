"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import {
  createCommunicationSetting,
  type CommunicationSettingActionResult,
} from "./actions";
import {
  createCommunicationSettingSchema,
  type CommunicationSettingFormValues,
} from "./validation";

export const useCommunicationSettingSubmit = () => {
  const { t } = useTranslation();
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState<CommunicationSettingActionResult>({});

  const form = useForm<CommunicationSettingFormValues>({
    resolver: zodResolver(createCommunicationSettingSchema(t)),
    defaultValues: {
      companyUuid: "",
      documentType: undefined,
      communicationType: undefined,
      shape: undefined,
      contactUuid: "",
      email: "",
      fax: "",
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = await createCommunicationSetting({
        companyUuid: values.companyUuid,
        documentType: values.documentType,
        communicationType: values.communicationType,
        shape: values.shape ?? undefined,
        contactUuid: values.contactUuid || undefined,
        email: values.email || undefined,
        fax: values.fax || undefined,
      });
      setState(result);
    });
  });

  return { form, isPending, onSubmit, state };
};
