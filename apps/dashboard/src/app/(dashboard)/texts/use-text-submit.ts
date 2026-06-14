"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { createText, type TextActionResult } from "./actions";
import { createTextSchema, type TextFormValues } from "./validation";

export const useTextSubmit = () => {
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState<TextActionResult>({});

  const form = useForm<TextFormValues>({
    resolver: zodResolver(createTextSchema()),
    defaultValues: {
      textCategoryUuid: "",
      title: "",
      textBlock: "",
      usageCategoriesJson: [],
      sequenceNumber: "0",
      isActive: true,
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = await createText({
        textCategoryUuid: values.textCategoryUuid || undefined,
        title: values.title,
        textBlock: values.textBlock,
        usageCategoriesJson: values.usageCategoriesJson,
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
