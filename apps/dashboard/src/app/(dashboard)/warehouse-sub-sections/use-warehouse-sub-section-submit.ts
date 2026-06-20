"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  warehouseBlockReasons,
  warehouseLoadingLocations,
  warehouseLocationTypes,
  WarehouseBlockReason,
  WarehouseLoadingLocation,
  WarehouseLocationType,
} from "@/lib/enums";
import {
  COMMON_TEXT,
  WAREHOUSE_BLOCK_REASON_LABELS,
  WAREHOUSE_LOADING_LOCATION_LABELS,
  WAREHOUSE_LOCATION_TYPE_LABELS,
} from "@/lib/labels";
import { useRouter } from "next/navigation";
import { useTransition, useState } from "react";
import { useForm } from "react-hook-form";
import { WarehouseOption } from "@/app/(dashboard)/warehouses/actions";
import {
  createWarehouseSubSection,
  WarehouseSubSectionActionResult,
  WarehouseSubSectionOption,
} from "./actions";
import {
  createWarehouseSubSectionSchema,
  DEFAULT_WAREHOUSE_SUB_SECTION,
  WarehouseSubSectionFormValues,
} from "./validation";

type UseWarehouseSubSectionSubmitParams = {
  warehouses: WarehouseOption[];
  subSections: WarehouseSubSectionOption[];
};

export const useWarehouseSubSectionSubmit = ({
  warehouses,
  subSections,
}: UseWarehouseSubSectionSubmitParams) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState<WarehouseSubSectionActionResult>({});

  const form = useForm<WarehouseSubSectionFormValues>({
    resolver: zodResolver(createWarehouseSubSectionSchema()),
    defaultValues: DEFAULT_WAREHOUSE_SUB_SECTION,
  });

  const blocked = form.watch("blocked");

  const warehouseOptions = [
    { value: "", label: COMMON_TEXT.selectPlaceholder },
    ...warehouses.flatMap((w) => {
      const children = subSections.filter((s) => s.warehouseUuid === w.uuid);
      return [
        { value: w.uuid, label: w.name, disabled: false },
        ...children.map((s) => ({
          value: s.uuid,
          label: `  └ ${s.name}`,
          disabled: true,
        })),
      ];
    }),
  ];

  const locationTypeOptions = [
    { value: "", label: COMMON_TEXT.emptyOption },
    ...warehouseLocationTypes.map((t) => ({
      value: t,
      label: WAREHOUSE_LOCATION_TYPE_LABELS[t as WarehouseLocationType],
    })),
  ];

  const loadingLocationOptions = [
    { value: "", label: COMMON_TEXT.emptyOption },
    ...warehouseLoadingLocations.map((l) => ({
      value: l,
      label: WAREHOUSE_LOADING_LOCATION_LABELS[l as WarehouseLoadingLocation],
    })),
  ];

  const blockReasonOptions = [
    { value: "", label: COMMON_TEXT.emptyOption },
    ...warehouseBlockReasons.map((r) => ({
      value: r,
      label: WAREHOUSE_BLOCK_REASON_LABELS[r as WarehouseBlockReason],
    })),
  ];

  const handleAdaptFrom = (uuid: string) => {
    const currentName = form.getValues("name");
    const currentPickingSequence = form.getValues("pickingSequence");
    if (!uuid) {
      form.reset({
        ...DEFAULT_WAREHOUSE_SUB_SECTION,
        name: currentName,
        pickingSequence: currentPickingSequence,
      });
      return;
    }
    const source = warehouses.find((w) => w.uuid === uuid);
    if (!source) return;
    form.reset({
      warehouseUuid: uuid,
      name: currentName,
      locationType: source.locationType ?? "",
      loadingLocation: source.loadingLocation ?? "",
      blocked: source.blocked,
      blockReason: source.blockReason ?? "",
      blockedForOptimization: source.blockedForOptimization,
      limitedDimensions: source.limitedDimensions,
      pickingSequence: currentPickingSequence,
    });
  };

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = await createWarehouseSubSection({
        warehouseUuid: values.warehouseUuid,
        name: values.name,
        locationType: (values.locationType || undefined) as
          | WarehouseLocationType
          | undefined,
        loadingLocation: (values.loadingLocation || undefined) as
          | WarehouseLoadingLocation
          | undefined,
        blocked: values.blocked,
        blockReason: values.blocked
          ? ((values.blockReason || undefined) as
              | WarehouseBlockReason
              | undefined)
          : undefined,
        blockedForOptimization: values.blockedForOptimization,
        limitedDimensions: values.limitedDimensions,
        pickingSequence:
          values.pickingSequence !== "" && values.pickingSequence !== undefined
            ? Number(values.pickingSequence)
            : undefined,
      });
      setState(result);
      if (result.success) router.push("/warehouse-sub-sections");
    });
  });

  const handleCancel = () => router.push("/warehouse-sub-sections");

  return {
    form,
    isPending,
    onSubmit,
    state,
    blocked,
    warehouseOptions,
    locationTypeOptions,
    loadingLocationOptions,
    blockReasonOptions,
    handleAdaptFrom,
    handleCancel,
  };
};
