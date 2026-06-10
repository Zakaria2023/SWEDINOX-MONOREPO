"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { createLocation, type LocationActionResult } from "./actions";
import { locationSchema, type LocationFormValues } from "./validation";

export const useLocationSubmit = () => {
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState<LocationActionResult>({});

  const form = useForm<LocationFormValues>({
    resolver: zodResolver(locationSchema),
    defaultValues: {
      name: "",
      locationType: undefined,
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
        pickingSequence:
          values.pickingSequence !== "" && values.pickingSequence !== undefined
            ? Number(values.pickingSequence)
            : undefined,
        isBlocked: values.isBlocked,
        blockedReason: values.blockedReason || undefined,
        blockedForOptimization: values.blockedForOptimization,
        limitedDimensions: values.limitedDimensions,
        adoptFrom: values.adoptFrom || undefined,
        adoptPosition: values.adoptPosition,
      });
      setState(result);
    });
  });

  return { form, isPending, onSubmit, state };
};
