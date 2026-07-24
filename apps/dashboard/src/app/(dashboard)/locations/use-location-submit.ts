"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  warehouseBlockReasons,
  warehouseLoadingLocations,
  warehouseLocationTypes,
  WarehouseBlockReason,
  WarehouseLoadingLocation,
  WarehouseLocationType,
  WarehouseProductType,
} from "@/lib/enums";
import { WAREHOUSE_BLOCK_REASON_LABELS, WAREHOUSE_LOADING_LOCATION_LABELS, WAREHOUSE_LOCATION_TYPE_LABELS } from "@/lib/labels";
import { useRouter } from "next/navigation";
import { useTransition, useState } from "react";
import { useForm } from "react-hook-form";
import { WarehouseItemOption } from "@/app/(dashboard)/warehouses/actions";
import { SelectOption } from "@/components/shadcn/select";
import { createLocation, LocationActionResult } from "./actions";
import {
  createLocationSchema,
  DEFAULT_LOCATION,
  LocationFormValues,
} from "./validation";

type UseLocationSubmitParams = {
  allItems: WarehouseItemOption[];
};

const buildHierarchicalOptions = (
  items: WarehouseItemOption[],
  parentUuid: string | null = null,
  depth = 0,
): SelectOption[] =>
  items
    .filter((i) => i.parentUuid === parentUuid)
    .flatMap((item) => [
      { value: item.uuid, label: item.name, depth },
      ...buildHierarchicalOptions(items, item.uuid, depth + 1),
    ]);

export const useLocationSubmit = ({ allItems }: UseLocationSubmitParams) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState<LocationActionResult>({});
  const [selectedItem, setSelectedItem] = useState<WarehouseItemOption | null>(
    null,
  );

  const form = useForm<LocationFormValues>({
    resolver: zodResolver(createLocationSchema()),
    defaultValues: DEFAULT_LOCATION,
  });

  const blocked = form.watch("blocked");
  const placement = form.watch("placement");

  const adaptFromOptions = [
    { value: "", label: "Select an option" },
    ...buildHierarchicalOptions(allItems),
  ];

  const locationTypeOptions = [
    { value: "", label: "Empty" },
    ...warehouseLocationTypes.map((t) => ({
      value: t,
      label: WAREHOUSE_LOCATION_TYPE_LABELS[t as WarehouseLocationType],
    })),
  ];

  const loadingLocationOptions = [
    { value: "", label: "Empty" },
    ...warehouseLoadingLocations.map((l) => ({
      value: l,
      label: WAREHOUSE_LOADING_LOCATION_LABELS[l as WarehouseLoadingLocation],
    })),
  ];

  const blockReasonOptions = [
    { value: "", label: "Empty" },
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
        ...DEFAULT_LOCATION,
        name: currentName,
        pickingSequence: currentPickingSequence,
      });
      return;
    }

    const source = allItems.find((i) => i.uuid === uuid);
    if (!source) {
      return;
    }

    setSelectedItem(source);

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
      blocked: source.blocked ?? false,
      blockReason: source.blockReason ?? "",
      blockedForOptimization: source.blockedForOptimization ?? false,
      limitedDimensions: source.limitedDimensions ?? false,
      minLength: source.minLength ?? "",
      maxLength: source.maxLength ?? "",
      maxWidth: source.maxWidth ?? "",
      maxWeight: source.maxWeight ?? "",
      productTypes: (source.productTypes ?? []) as WarehouseProductType[],
      pickingSequence: currentPickingSequence,
      countPer: "",
      countAs: "technical_stock",
      countUnderValue: "",
      countUnderUnit: "",
      openCountOrderAvailable: false,
      documents: [],
    });
  };

  const isNextDisabled = !selectedItem || selectedItem.parentUuid === null;

  const computedParentUuid = (): string | null => {
    if (!selectedItem) {
      return null;
    }
    return placement === "next" ? selectedItem.parentUuid : selectedItem.uuid;
  };

  const onSubmit = form.handleSubmit((values) => {
    const parentUuid = computedParentUuid();
    if (!parentUuid) {
      return;
    }

    startTransition(async () => {
      const result = await createLocation({
        parentUuid,
        type: "location",
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
        minLength:
          values.minLength !== "" && values.minLength !== undefined
            ? Number(values.minLength)
            : undefined,
        maxLength:
          values.maxLength !== "" && values.maxLength !== undefined
            ? Number(values.maxLength)
            : undefined,
        maxWidth:
          values.maxWidth !== "" && values.maxWidth !== undefined
            ? Number(values.maxWidth)
            : undefined,
        maxWeight:
          values.maxWeight !== "" && values.maxWeight !== undefined
            ? Number(values.maxWeight)
            : undefined,
        productTypes:
          values.productTypes.length > 0 ? values.productTypes : undefined,
        pickingSequence:
          values.pickingSequence !== "" && values.pickingSequence !== undefined
            ? Number(values.pickingSequence)
            : undefined,
        countPer:
          values.countPer !== "" && values.countPer !== undefined
            ? Number(values.countPer)
            : undefined,
        countAs: values.countAs,
        countUnderValue:
          values.countUnderValue !== "" && values.countUnderValue !== undefined
            ? Number(values.countUnderValue)
            : undefined,
        countUnderUnit: values.countUnderUnit || undefined,
        openCountOrderAvailable: values.openCountOrderAvailable,
        documents: values.documents.length > 0 ? values.documents : undefined,
      });
      setState(result);
      if (result.success) router.push("/locations");
    });
  });

  const handleCancel = () => router.push("/locations");

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
