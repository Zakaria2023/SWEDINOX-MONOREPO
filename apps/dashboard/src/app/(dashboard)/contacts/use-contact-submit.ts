"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { createContact, type ContactActionResult } from "./actions";
import { createContactSchema, type ContactFormValues } from "./validation";

export const useContactSubmit = () => {
  const { t } = useTranslation();
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState<ContactActionResult>({});

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(createContactSchema(t)),
    defaultValues: {
      contactType: undefined,
      description: "",
      contactGroupUuid: "",
      quicklyChangeOrder: "",
      hasPriceDate: false,
      priceDate: "",
      linkToNewCustomer: false,
      searchCode1: "",
      searchCode2: "",
      searchCode3: "",
      websiteSorting: "10",
      hideOnWebsite: false,
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = await createContact({
        contactType: values.contactType ?? null,
        description: values.description,
        contactGroupUuid: values.contactGroupUuid || undefined,
        quicklyChangeOrder: values.quicklyChangeOrder || undefined,
        hasPriceDate: values.hasPriceDate,
        priceDate: values.hasPriceDate && values.priceDate ? values.priceDate : undefined,
        linkToNewCustomer: values.linkToNewCustomer,
        searchCode1: values.searchCode1 || undefined,
        searchCode2: values.searchCode2 || undefined,
        searchCode3: values.searchCode3 || undefined,
        websiteSorting:
          values.websiteSorting !== "" && values.websiteSorting !== undefined
            ? Number(values.websiteSorting)
            : 10,
        hideOnWebsite: values.hideOnWebsite,
      });
      setState(result);
    });
  });

  return { form, isPending, onSubmit, state };
};
