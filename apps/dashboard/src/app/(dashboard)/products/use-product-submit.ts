"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { createProduct, ProductActionResult } from "./actions";
import { DEFAULT_PRODUCT, productSchema, ProductFormValues } from "./validation";
import { ProductGroupOption } from "@/app/(dashboard)/product-groups/actions";
import { CompanyOption } from "@/app/(dashboard)/companies/actions";
import { SelectOption } from "@/components/shadcn/select";
import { COMMON_TEXT } from "@/lib/labels";

type UseProductSubmitParams = {
  productGroups: ProductGroupOption[];
  suppliers: CompanyOption[];
};

const buildHierarchicalOptions = (
  groups: ProductGroupOption[],
  parentUuid: string | null = null,
  depth = 0,
): SelectOption[] =>
  groups
    .filter((g) => g.parentUuid === parentUuid)
    .flatMap((g) => [
      { value: g.uuid, label: g.name, depth },
      ...buildHierarchicalOptions(groups, g.uuid, depth + 1),
    ]);

export const useProductSubmit = ({
  productGroups,
  suppliers,
}: UseProductSubmitParams) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState<ProductActionResult>({});

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: DEFAULT_PRODUCT,
  });

  const groupOptions: SelectOption[] = [
    { value: "", label: COMMON_TEXT.emptyOption },
    ...buildHierarchicalOptions(productGroups),
  ];

  const companyOptions: SelectOption[] = [
    { value: "", label: COMMON_TEXT.emptyOption },
    ...suppliers.map((c) => ({
      value: c.uuid,
      label: c.companyName ?? c.searchCode1 ?? c.uuid,
    })),
  ];

  const handleCancel = () => router.push("/products");

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = await createProduct({
        productCode: values.productCode,
        commodityCode: values.commodityCode || null,
        productGroupUuid: values.productGroupUuid || null,
        companyUuid: values.companyUuid || null,
        name: values.name,
        stockProduct: values.stockProduct,
        standardProduct: values.standardProduct,
        length: values.length || null,
        widthDiameter: values.widthDiameter || null,
        thickness: values.thickness || null,
        technicalStock: values.technicalStock,
        stockUnit: values.stockUnit || null,
        theoreticalWeight: values.theoreticalWeight,
        weightUnit: values.weightUnit || null,
      });

      setState(result);
      if (result.success && result.productUuid) {
        router.push("/products");
      }
    });
  });

  return {
    form,
    isPending,
    onSubmit,
    state,
    groupOptions,
    companyOptions,
    handleCancel,
  };
};
