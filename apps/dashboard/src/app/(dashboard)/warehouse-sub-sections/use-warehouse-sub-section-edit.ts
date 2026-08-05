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
import {
  updateWarehouseSubSection,
  WarehouseSubSectionActionResult,
} from "./actions";
import { editValuesToSubSectionFields } from "./mappers";
import {
  editWarehouseSubSectionSchema,
  WarehouseSubSectionEditValues,
} from "./validation";

type UseWarehouseSubSectionEditParams = {
  subSectionUuid: string;
  defaultValues: WarehouseSubSectionEditValues;
};

const emptyOption: SelectOption = { value: "", label: "Empty" };

export const useWarehouseSubSectionEdit = ({
  subSectionUuid,
  defaultValues,
}: UseWarehouseSubSectionEditParams) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState<WarehouseSubSectionActionResult>({});

  const form = useForm<WarehouseSubSectionEditValues>({
    resolver: zodResolver(editWarehouseSubSectionSchema()),
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
          await updateWarehouseSubSection(
            subSectionUuid,
            editValuesToSubSectionFields(values),
          ),
        );
      });
    },
    () => {
      setState({ error: "Please fix the highlighted fields before saving." });
    },
  );

  const handleCancel = () => router.push("/warehouse-sub-sections");

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
