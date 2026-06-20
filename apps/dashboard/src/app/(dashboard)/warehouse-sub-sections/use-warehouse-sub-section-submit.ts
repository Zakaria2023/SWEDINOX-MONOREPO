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
import { WarehouseItemOption } from "@/app/(dashboard)/warehouses/actions";
import { SelectOption } from "@/components/shadcn/select";
import {
  createWarehouseSubSection,
  WarehouseSubSectionActionResult,
} from "./actions";
import {
  createWarehouseSubSectionSchema,
  DEFAULT_WAREHOUSE_SUB_SECTION,
  WarehouseSubSectionFormValues,
} from "./validation";

type UseWarehouseSubSectionSubmitParams = {
  allItems: WarehouseItemOption[];
};

const buildHierarchicalOptions = (
  items: WarehouseItemOption[],
  parentUuid: string | null = null,
  depth = 0,
): SelectOption[] => {
  return items
    .filter((i) => i.parentUuid === parentUuid)
    .flatMap((item) => [
      { value: item.uuid, label: item.name, depth },
      ...buildHierarchicalOptions(items, item.uuid, depth + 1),
    ]);
};

export const useWarehouseSubSectionSubmit = ({
  allItems,
}: UseWarehouseSubSectionSubmitParams) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState<WarehouseSubSectionActionResult>({});
  const [selectedItem, setSelectedItem] = useState<WarehouseItemOption | null>(
    null,
  );

  const form = useForm<WarehouseSubSectionFormValues>({
    resolver: zodResolver(createWarehouseSubSectionSchema()),
    defaultValues: DEFAULT_WAREHOUSE_SUB_SECTION,
  });

  const blocked = form.watch("blocked");
  const placement = form.watch("placement");

  const adaptFromOptions = [
    { value: "", label: COMMON_TEXT.selectPlaceholder },
    ...buildHierarchicalOptions(allItems),
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
      setSelectedItem(null);
      form.reset({
        ...DEFAULT_WAREHOUSE_SUB_SECTION,
        name: currentName,
        pickingSequence: currentPickingSequence,
      });
      return;
    }

    const source = allItems.find((i) => i.uuid === uuid);
    if (!source) return;

    setSelectedItem(source);

    // Root warehouses can only be placed "below" (Next would create another root)
    const isRoot = source.parentUuid === null;
    const currentPlacement = form.getValues("placement");
    const nextPlacement =
      isRoot && currentPlacement === "next" ? "below" : currentPlacement;

    form.reset({
      adaptFromUuid: uuid,
      placement: nextPlacement,
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

  // "Next" is only valid when the selected item is not a root warehouse
  const isNextDisabled = !selectedItem || selectedItem.parentUuid === null;

  const computedParentUuid = (): string | null => {
    if (!selectedItem) return null;
    return placement === "next" ? selectedItem.parentUuid : selectedItem.uuid;
  };

  const onSubmit = form.handleSubmit((values) => {
    const parentUuid = computedParentUuid();
    if (!parentUuid) return;

    startTransition(async () => {
      const result = await createWarehouseSubSection({
        parentUuid,
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
    placement,
    selectedItem,
    isNextDisabled,
    adaptFromOptions,
    locationTypeOptions,
    loadingLocationOptions,
    blockReasonOptions,
    handleAdaptFrom,
    handleCancel,
  };
};
