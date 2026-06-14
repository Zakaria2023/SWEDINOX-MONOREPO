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
      sequenceNumber: "0",
      isActive: true,
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = await createTextCategory({
        parentUuid: values.parentUuid || undefined,
        name: values.name,
        description: values.description || undefined,
        sequenceNumber:
          values.sequenceNumber !== "" && values.sequenceNumber !== undefined
            ? Number(values.sequenceNumber)
            : 0,
        isActive: values.isActive,
      });

      setState(result);
    });
  });

  return { form, isPending, onSubmit, state };
};
