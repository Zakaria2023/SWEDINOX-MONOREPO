"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { createLocation, type LocationActionResult } from "./actions";
import { createSubLocationSchema, type SubLocationFormValues } from "./validation";

export const useSubLocationSubmit = () => {
  const { t } = useTranslation();
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState<LocationActionResult>({});

  const form = useForm<SubLocationFormValues>({
    resolver: zodResolver(createSubLocationSchema(t)),
    defaultValues: {
      name: "",
      locationType: undefined,
      adoptFrom: "",
      adoptPosition: "below",
      pickingSequence: "",
      isBlocked: false,
      blockedReason: "",
      blockedForOptimization: false,
      limitedDimensions: false,
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = await createLocation({
        name: values.name,
        locationType: values.locationType,
        adoptFrom: values.adoptFrom,
        adoptPosition: values.adoptPosition ?? "below",
        pickingSequence:
          values.pickingSequence !== "" && values.pickingSequence !== undefined
            ? Number(values.pickingSequence)
            : undefined,
        isBlocked: values.isBlocked,
        blockedReason: values.blockedReason || undefined,
        blockedForOptimization: values.blockedForOptimization,
        limitedDimensions: values.limitedDimensions,
        loadingLocationUuid: undefined,
        addressUuid: undefined,
      });
      setState(result);
    });
  });

  return { form, isPending, onSubmit, state };
};
