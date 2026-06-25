"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  warehouseAddresses,
  warehouseBlockReasons,
  warehouseLoadingLocations,
  warehouseLocationTypes,
  WarehouseAddress,
  WarehouseBlockReason,
  WarehouseLoadingLocation,
  WarehouseLocationType,
  WarehouseProductType,
  WarehouseTransportRegion,
} from "@/lib/enums";
import {
  COMMON_TEXT,
  WAREHOUSE_ADDRESS_LABELS,
  WAREHOUSE_BLOCK_REASON_LABELS,
  WAREHOUSE_LOADING_LOCATION_LABELS,
  WAREHOUSE_LOCATION_TYPE_LABELS,
} from "@/lib/labels";
import { useRouter } from "next/navigation";
import { useTransition, useState } from "react";
import { useForm } from "react-hook-form";
import {
  createWarehouse,
  WarehouseActionResult,
  WarehouseOption,
} from "./actions";
import {
  createWarehouseSchema,
  DEFAULT_WAREHOUSE,
  WarehouseFormValues,
} from "./validation";

type UseWarehouseSubmitParams = {
  existingWarehouses: WarehouseOption[];
};

export const useWarehouseSubmit = ({
  existingWarehouses,
}: UseWarehouseSubmitParams) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState<WarehouseActionResult>({});

  const form = useForm<WarehouseFormValues>({
    resolver: zodResolver(createWarehouseSchema()),
    defaultValues: DEFAULT_WAREHOUSE,
  });

  const blocked = form.watch("blocked");

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

  const [adaptFromValue, setAdaptFromValue] = useState("");

  const adaptFromOptions = [
    { value: "", label: COMMON_TEXT.emptyOption },
    ...existingWarehouses.map((w) => ({ value: w.uuid, label: w.name })),
  ];

  const handleAdaptFrom = (uuid: string) => {
    setAdaptFromValue(uuid);
    const currentName = form.getValues("name");
    if (!uuid) {
      form.reset({ ...DEFAULT_WAREHOUSE, name: currentName });
      return;
    }
    const source = existingWarehouses.find((w) => w.uuid === uuid);
    if (!source) return;
    form.reset({
      name: currentName,
      locationType: source.locationType ?? "",
      loadingLocation: source.loadingLocation ?? "",
      address: source.address ?? "",
      blocked: source.blocked,
      blockReason: source.blockReason ?? "",
      blockedForOptimization: source.blockedForOptimization,
      limitedDimensions: source.limitedDimensions,
      minLength: source.minLength ?? "",
      maxLength: source.maxLength ?? "",
      maxWidth: source.maxWidth ?? "",
      maxWeight: source.maxWeight ?? "",
      productTypes: (source.productTypes ?? []) as WarehouseProductType[],
      loadLocations: (source.loadLocations ?? []) as Array<{
        transportRegion: WarehouseTransportRegion;
        loadLocation: WarehouseLoadingLocation;
      }>,
    });
  };

  const addressOptions = [
    { value: "", label: COMMON_TEXT.emptyOption },
    ...warehouseAddresses.map((a) => ({
      value: a,
      label: WAREHOUSE_ADDRESS_LABELS[a as WarehouseAddress],
    })),
  ];

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = await createWarehouse({
        name: values.name,
        locationType: (values.locationType || undefined) as
          | WarehouseLocationType
          | undefined,
        loadingLocation: (values.loadingLocation || undefined) as
          | WarehouseLoadingLocation
          | undefined,
        address: (values.address || undefined) as WarehouseAddress | undefined,
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
        loadLocations:
          values.loadLocations.length > 0 ? values.loadLocations : undefined,
        documents: values.documents.length > 0 ? values.documents : undefined,
      });
      setState(result);
      if (result.success) router.push("/warehouses");
    });
  });

  const handleCancel = () => router.push("/warehouses");

  return {
    form,
    isPending,
    onSubmit,
    state,
    blocked,
    locationTypeOptions,
    loadingLocationOptions,
    blockReasonOptions,
    addressOptions,
    adaptFromOptions,
    adaptFromValue,
    handleAdaptFrom,
    handleCancel,
  };
};
