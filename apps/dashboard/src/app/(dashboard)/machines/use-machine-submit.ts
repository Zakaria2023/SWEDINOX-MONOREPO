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
import { ProductOption } from "@/app/(dashboard)/products/actions";
import {
  createMachine,
  MachineActionResult,
  MachinePostProcessingInput,
  MachineProductInput,
} from "./actions";
import { MachineStockLocationOption } from "@/app/(dashboard)/warehouses/actions";
import {
  createMachineSchema,
  DEFAULT_MACHINE,
  DEFAULT_MACHINE_PRODUCT,
  machineProductDialogSchema,
  MachineFormValues,
  MachineProductDialogValues,
} from "./validation";

export type PostProcessingRow = {
  option: MachineOptionType | "";
  preference: string;
  daysInSystem: string;
};

type UseMachineSubmitParams = {
  stockLocations: MachineStockLocationOption[];
};

const toIntOrNull = (value: string | undefined): number | null =>
  value !== undefined && value.trim() !== "" ? Number(value) : null;

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

  // ── Products ────────────────────────────────────────────────────────────
  const [products, setProducts] = useState<MachineProductInput[]>([]);
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [isProductPickerOpen, setIsProductPickerOpen] = useState(false);
  const [pickedProduct, setPickedProduct] = useState<ProductOption | null>(
    null,
  );

  const productForm = useForm<MachineProductDialogValues>({
    resolver: zodResolver(machineProductDialogSchema),
    defaultValues: DEFAULT_MACHINE_PRODUCT,
  });

  const handleProductOpenChange = (open: boolean) => {
    if (!open) {
      productForm.reset(DEFAULT_MACHINE_PRODUCT);
      setPickedProduct(null);
    }
    setIsProductDialogOpen(open);
  };

  const handleOpenProduct = () => {
    productForm.reset(DEFAULT_MACHINE_PRODUCT);
    setPickedProduct(null);
    setIsProductDialogOpen(true);
  };

  const handleCancelProduct = () => {
    productForm.reset(DEFAULT_MACHINE_PRODUCT);
    setPickedProduct(null);
    setIsProductDialogOpen(false);
  };

  const handleOpenProductPicker = () => setIsProductPickerOpen(true);
  const handleCancelProductPicker = () => setIsProductPickerOpen(false);

  const handlePickProduct = (product: ProductOption) => {
    setPickedProduct(product);
    productForm.setValue("productUuid", product.uuid);
    setIsProductPickerOpen(false);
  };

  const handleSaveProduct = productForm.handleSubmit((values) => {
    if (!pickedProduct) {
      productForm.setError("productUuid", {
        message: "Please select a product",
      });
      return;
    }

    setProducts((prev) => [
      ...prev,
      {
        productUuid: pickedProduct.uuid,
        productGroupUuid: pickedProduct.productGroupUuid ?? null,
        productCode: pickedProduct.productCode,
        description: pickedProduct.name,
        preference: toIntOrNull(values.preference),
        productionPerHour: toIntOrNull(values.productionPerHour),
        prodUnit: values.prodUnit || null,
        minCorner: values.minCorner?.trim() ? values.minCorner : "0.00",
        maxCorner: values.maxCorner?.trim() ? values.maxCorner : "90.00",
        daysInSystem: toIntOrNull(values.daysInSystem),
      },
    ]);

    productForm.reset(DEFAULT_MACHINE_PRODUCT);
    setPickedProduct(null);
    setIsProductDialogOpen(false);
  });

  const removeProduct = (index: number) =>
    setProducts((prev) => prev.filter((_, i) => i !== index));

  // ── Post-processing ─────────────────────────────────────────────────────
  const [postProcessings, setPostProcessings] = useState<PostProcessingRow[]>(
    [],
  );

  const addPostProcessing = () =>
    setPostProcessings((prev) => [
      ...prev,
      { option: "", preference: "0", daysInSystem: "0" },
    ]);

  const updatePostProcessing = (
    index: number,
    patch: Partial<PostProcessingRow>,
  ) =>
    setPostProcessings((prev) =>
      prev.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    );

  const removePostProcessing = (index: number) =>
    setPostProcessings((prev) => prev.filter((_, i) => i !== index));

  // ── Options ─────────────────────────────────────────────────────────────
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
      description: MACHINE_CAPACITY_UNIT_LABELS[unit as MachineCapacityUnit],
    })),
  ];

  const postProcessingOptions = [
    { value: "", label: COMMON_TEXT.emptyOption },
    ...optionOptions,
  ];

  const onSubmit = form.handleSubmit((values) => {
    const postProcessingInputs: MachinePostProcessingInput[] = postProcessings
      .filter((row) => row.option)
      .map((row) => ({
        option: row.option as MachineOptionType,
        preference: toIntOrNull(row.preference) ?? 0,
        daysInSystem: toIntOrNull(row.daysInSystem) ?? 0,
      }));

    startTransition(async () => {
      const result = await createMachine(
        {
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
          averageDailyCapacityUnit: (values.averageDailyCapacityUnit ||
            undefined) as MachineCapacityUnit | undefined,
          warningPercentage:
            values.warningPercentage !== "" &&
            values.warningPercentage !== undefined
              ? Number(values.warningPercentage)
              : undefined,
          documents: values.documents.length > 0 ? values.documents : undefined,
        },
        products,
        postProcessingInputs,
      );

      setState(result);
      if (result.success) {
        router.push("/machines");
      }
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
    postProcessingOptions,
    handleCancel,
    // Products
    products,
    productForm,
    isProductDialogOpen,
    isProductPickerOpen,
    pickedProduct,
    handleProductOpenChange,
    handleOpenProduct,
    handleCancelProduct,
    handleOpenProductPicker,
    handleCancelProductPicker,
    handlePickProduct,
    handleSaveProduct,
    removeProduct,
    // Post-processing
    postProcessings,
    addPostProcessing,
    updatePostProcessing,
    removePostProcessing,
  };
};
