"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { createLocation, type LocationActionResult } from "./actions";
import { createLocationSchema, type LocationFormValues } from "./validation";

export const useLocationSubmit = (pendingLoadingLocationName?: string) => {
  const { t } = useTranslation();
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState<LocationActionResult>({});

  const form = useForm<LocationFormValues>({
    resolver: zodResolver(createLocationSchema(t)),
    defaultValues: {
      name: "",
      locationType: undefined,
      loadingLocationUuid: "",
      addressUuid: "",
      pickingSequence: "",
      isBlocked: false,
      blockedReason: "",
      blockedForOptimization: false,
      limitedDimensions: false,
      adoptFrom: "",
      adoptPosition: "below",
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = await createLocation({
        name: values.name,
        locationType: values.locationType,
        loadingLocationUuid:
          pendingLoadingLocationName || values.loadingLocationUuid?.startsWith("__")
            ? undefined
            : values.loadingLocationUuid || undefined,
        addressUuid: values.addressUuid || undefined,
        pickingSequence:
          values.pickingSequence !== "" && values.pickingSequence !== undefined
            ? Number(values.pickingSequence)
            : undefined,
        isBlocked: values.isBlocked,
        blockedReason: values.blockedReason || undefined,
        blockedForOptimization: values.blockedForOptimization,
        limitedDimensions: values.limitedDimensions,
        adoptFrom: values.adoptFrom || undefined,
        adoptPosition: values.adoptPosition ?? "below",
        newLoadingLocationName: pendingLoadingLocationName || undefined,
      });
      setState(result);
    });
  });

  return { form, isPending, onSubmit, state };
};
