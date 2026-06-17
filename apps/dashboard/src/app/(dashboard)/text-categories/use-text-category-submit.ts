"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { createTextCategory, type TextCategoryActionResult } from "./actions";
import {
  createTextCategorySchema,
  type TextCategoryFormValues,
} from "./validation";

export const useTextCategorySubmit = () => {
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState<TextCategoryActionResult>({});

  const form = useForm<TextCategoryFormValues>({
    resolver: zodResolver(createTextCategorySchema()),
    defaultValues: {
      parentUuid: "",
      name: "",
      description: "",
      usageCategoriesJson: [],
      sequenceNumber: undefined,
      isActive: true,
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = await createTextCategory({
        parentUuid: values.parentUuid,
        name: values.name,
        description: values.description,
        usageCategoriesJson: values.usageCategoriesJson,
        sequenceNumber: values.sequenceNumber,
        isActive: values.isActive,
      });

      setState(result);
    });
  });

  return { form, isPending, onSubmit, state };
};
