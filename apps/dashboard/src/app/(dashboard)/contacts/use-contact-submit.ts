"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { createContact, type ContactActionResult } from "./actions";
import { contactSchema, type ContactFormValues } from "./validation";

export const useContactSubmit = () => {
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState<ContactActionResult>({});

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      salutation: "",
      title: "",
      name: "",
      initials: "",
      firstName: "",
      lastName: "",
      fullName: "",
      telephone: "",
      mobile: "",
      fax: "",
      email: "",
      website: "",
      btwNumber: "",
      categoryAddition: "",
      sequenceNumber: "",
      addressUuid: "",
      locationUuid: "",
      streetAndNumber: "",
      house: "",
      poBox: "",
      city: "",
      postalCode: "",
      country: "",
      region: "",
      annex: "",
      alternativeName: "",
      isActive: true,
      notes: "",
      categoryUuids: [],
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = await createContact(
        {
          salutation: (values.salutation as ContactFormValues["salutation"]) || undefined,
          title: values.title || undefined,
          name: values.name || undefined,
          initials: values.initials || undefined,
          firstName: values.firstName || undefined,
          lastName: values.lastName || undefined,
          fullName: values.fullName,
          telephone: values.telephone || undefined,
          mobile: values.mobile || undefined,
          fax: values.fax || undefined,
          email: values.email || undefined,
          website: values.website || undefined,
          btwNumber: values.btwNumber || undefined,
          categoryAddition: values.categoryAddition || undefined,
          sequenceNumber:
            values.sequenceNumber !== "" && values.sequenceNumber !== undefined
              ? Number(values.sequenceNumber)
              : undefined,
          addressUuid: values.addressUuid || undefined,
          locationUuid: values.locationUuid || undefined,
          streetAndNumber: values.streetAndNumber || undefined,
          house: values.house || undefined,
          poBox: values.poBox || undefined,
          city: values.city || undefined,
          postalCode: values.postalCode || undefined,
          country: values.country || undefined,
          region: values.region || undefined,
          annex: values.annex || undefined,
          alternativeName: values.alternativeName || undefined,
          isActive: values.isActive,
          notes: values.notes || undefined,
        },
        values.categoryUuids,
      );
      setState(result);
    });
  });

  return { form, isPending, onSubmit, state };
};
