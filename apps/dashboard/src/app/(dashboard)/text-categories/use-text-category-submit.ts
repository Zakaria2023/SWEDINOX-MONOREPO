"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import {
  createTextCategory,
  TextCategoryActionResult,
  updateTextCategory,
} from "./actions";
import { createTextCategorySchema, TextCategoryFormValues } from "./validation";

type UseTextCategorySubmitParams = {
  /** Set when editing an existing category; omitted when creating one. */
  textCategoryUuid?: string;
  defaultValues?: TextCategoryFormValues;
};

const EMPTY_TEXT_CATEGORY: TextCategoryFormValues = {
  parentUuid: "",
  name: "",
  description: "",
  usageCategoriesJson: [],
  sequenceNumber: undefined,
  isActive: true,
};

export const useTextCategorySubmit = ({
  textCategoryUuid,
  defaultValues,
}: UseTextCategorySubmitParams = {}) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState<TextCategoryActionResult>({});

  const form = useForm<TextCategoryFormValues>({
    resolver: zodResolver(createTextCategorySchema()),
    defaultValues: defaultValues ?? EMPTY_TEXT_CATEGORY,
  });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const input = {
        // An unpicked parent has to reach the column as NULL — "" would read
        // back as a category that doesn't exist.
        parentUuid: values.parentUuid || null,
        name: values.name,
        description: values.description,
        usageCategoriesJson: values.usageCategoriesJson,
        sequenceNumber: values.sequenceNumber,
        isActive: values.isActive,
      };

      // Updating redirects from inside the action, so only the create path has
      // a result worth navigating on.
      if (textCategoryUuid) {
        setState(await updateTextCategory(textCategoryUuid, input));
        return;
      }

      const result = await createTextCategory(input);
      setState(result);
      if (result.success) {
        router.push("/text-categories");
      }
    });
  });

  return {
    form,
    isPending,
    isEditing: Boolean(textCategoryUuid),
    onSubmit,
    state,
  };
};
