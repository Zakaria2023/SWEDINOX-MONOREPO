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
): SelectOption[] =>
  items
    .filter((i) => i.parentUuid === parentUuid)
    .flatMap((item) => [
      { value: item.uuid, label: item.name, depth },
      ...buildHierarchicalOptions(items, item.uuid, depth + 1),
    ]);

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

    // Spread the defaults first so fields the source doesn't provide keep a
    // defined value — a partial reset would flip the omitted inputs from
    // controlled to uncontrolled.
    form.reset({
      ...DEFAULT_WAREHOUSE_SUB_SECTION,
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
    });
  };

  // "Next" is only valid when the selected item is not a root warehouse
  const isNextDisabled = !selectedItem || selectedItem.parentUuid === null;

  const computedParentUuid = (): string | null => {
    if (!selectedItem) return null;
    return placement === "next" ? selectedItem.parentUuid : selectedItem.uuid;
  };

  const onSubmit = form.handleSubmit(
    (values) => {
      const parentUuid = computedParentUuid();
      if (!parentUuid) {
        setState({
          error:
            "Select a warehouse or sub section to adapt from before saving.",
        });
        return;
      }

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
            values.pickingSequence !== "" &&
            values.pickingSequence !== undefined
              ? Number(values.pickingSequence)
              : undefined,
        });
        setState(result);
        if (result.success) router.push("/warehouse-sub-sections");
      });
    },
    () => {
      setState({
        error: "Please fix the highlighted fields before saving.",
      });
    },
  );

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
