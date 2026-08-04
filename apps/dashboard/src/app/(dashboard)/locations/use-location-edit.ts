"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  warehouseBlockReasons,
  warehouseLoadingLocations,
  warehouseLocationTypes,
} from "@/lib/enums";
import {
  WAREHOUSE_BLOCK_REASON_LABELS,
  WAREHOUSE_LOADING_LOCATION_LABELS,
  WAREHOUSE_LOCATION_TYPE_LABELS,
} from "@/lib/labels";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { SelectOption } from "@/components/shadcn/select";
import { LocationActionResult, updateLocation } from "./actions";
import { editValuesToLocationFields } from "./mappers";
import { editLocationSchema, LocationEditValues } from "./validation";

type UseLocationEditParams = {
  locationUuid: string;
  defaultValues: LocationEditValues;
};

const emptyOption: SelectOption = { value: "", label: "Empty" };

export const useLocationEdit = ({
  locationUuid,
  defaultValues,
}: UseLocationEditParams) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState<LocationActionResult>({});

  const form = useForm<LocationEditValues>({
    resolver: zodResolver(editLocationSchema()),
    defaultValues,
  });

  const blocked = form.watch("blocked");

  const locationTypeOptions: SelectOption[] = [
    emptyOption,
    ...warehouseLocationTypes.map((type) => ({
      value: type,
      label: WAREHOUSE_LOCATION_TYPE_LABELS[type],
    })),
  ];

  const loadingLocationOptions: SelectOption[] = [
    emptyOption,
    ...warehouseLoadingLocations.map((location) => ({
      value: location,
      label: WAREHOUSE_LOADING_LOCATION_LABELS[location],
    })),
  ];

  const blockReasonOptions: SelectOption[] = [
    emptyOption,
    ...warehouseBlockReasons.map((reason) => ({
      value: reason,
      label: WAREHOUSE_BLOCK_REASON_LABELS[reason],
    })),
  ];

  const onSubmit = form.handleSubmit(
    (values) => {
      startTransition(async () => {
        setState(
          await updateLocation(
            locationUuid,
            editValuesToLocationFields(values),
          ),
        );
      });
    },
    () => {
      setState({ error: "Please fix the highlighted fields before saving." });
    },
  );

  const handleCancel = () => router.push("/locations");

  return {
    form,
    isPending,
    onSubmit,
    state,
    blocked,
    locationTypeOptions,
    loadingLocationOptions,
    blockReasonOptions,
    handleCancel,
  };
};
