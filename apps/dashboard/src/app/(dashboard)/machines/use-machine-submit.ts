"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  machineCapacityUnits,
  machineLoadingTypes,
  machineOptionTypes,
  machineProductionTypes,
  MachineCapacityUnit,
  MachineLoadingType,
  MachineOptionType,
  MachineProductionType,
} from "@/lib/enums";
import {
  COMMON_TEXT,
  MACHINE_CAPACITY_UNIT_CODES,
  MACHINE_CAPACITY_UNIT_LABELS,
  MACHINE_LOADING_LABELS,
  MACHINE_OPTION_LABELS,
  MACHINE_PRODUCTION_LABELS,
} from "@/lib/labels";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { createMachine, type MachineActionResult } from "./actions";
import { type MachineStockLocationOption } from "@/app/(dashboard)/warehouses/actions";
import {
  createMachineSchema,
  DEFAULT_MACHINE,
  type MachineFormValues,
} from "./validation";

type UseMachineSubmitParams = {
  stockLocations: MachineStockLocationOption[];
};

export const useMachineSubmit = ({
  stockLocations,
}: UseMachineSubmitParams) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState<MachineActionResult>({});

  const form = useForm<MachineFormValues>({
    resolver: zodResolver(createMachineSchema()),
    defaultValues: DEFAULT_MACHINE,
  });

  const stockLocationOptions = [
    { value: "", label: COMMON_TEXT.selectPlaceholder },
    ...stockLocations.map((location) => ({
      value: location.uuid,
      label: location.name,
    })),
  ];

  const optionOptions = machineOptionTypes.map((option) => ({
    value: option,
    label: MACHINE_OPTION_LABELS[option as MachineOptionType],
  }));

  const productionOptions = machineProductionTypes.map((production) => ({
    value: production,
    label: MACHINE_PRODUCTION_LABELS[production as MachineProductionType],
  }));

  const loadingOptions = machineLoadingTypes.map((loading) => ({
    value: loading,
    label: MACHINE_LOADING_LABELS[loading as MachineLoadingType],
  }));

  const capacityUnitOptions = [
    { value: "", label: COMMON_TEXT.selectPlaceholder },
    ...machineCapacityUnits.map((unit) => ({
      value: unit,
      label: MACHINE_CAPACITY_UNIT_CODES[unit as MachineCapacityUnit],
      description:
        MACHINE_CAPACITY_UNIT_LABELS[unit as MachineCapacityUnit],
    })),
  ];

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = await createMachine({
        code: values.code.trim().toUpperCase(),
        name: values.name.trim(),
        option: values.option as MachineOptionType,
        production: values.production as MachineProductionType,
        loading: values.loading as MachineLoadingType,
        stockLocationUuid: values.stockLocationUuid,
        remarks: values.remarks.trim() || null,
        minLengthMm:
          values.minLengthMm !== "" && values.minLengthMm !== undefined
            ? Number(values.minLengthMm)
            : undefined,
        maxLengthMm:
          values.maxLengthMm !== "" && values.maxLengthMm !== undefined
            ? Number(values.maxLengthMm)
            : undefined,
        outOfBusiness: values.outOfBusiness,
        outOfBusinessFrom:
          values.outOfBusiness && values.outOfBusinessFrom
            ? new Date(values.outOfBusinessFrom)
            : undefined,
        outOfBusinessUntil:
          values.outOfBusiness && values.outOfBusinessUntil
            ? new Date(values.outOfBusinessUntil)
            : undefined,
        averageDailyCapacity:
          values.averageDailyCapacity !== "" &&
          values.averageDailyCapacity !== undefined
            ? Number(values.averageDailyCapacity)
            : undefined,
        averageDailyCapacityUnit:
          (values.averageDailyCapacityUnit || undefined) as
            | MachineCapacityUnit
            | undefined,
        warningPercentage:
          values.warningPercentage !== "" &&
          values.warningPercentage !== undefined
            ? Number(values.warningPercentage)
            : undefined,
        documents: values.documents.length > 0 ? values.documents : undefined,
      });

      setState(result);
      if (result.success) router.push("/machines");
    });
  });

  const handleCancel = () => router.push("/machines");

  return {
    form,
    isPending,
    onSubmit,
    state,
    stockLocationOptions,
    optionOptions,
    productionOptions,
    loadingOptions,
    capacityUnitOptions,
    handleCancel,
  };
};
