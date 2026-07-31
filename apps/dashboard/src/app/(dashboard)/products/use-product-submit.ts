"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import {
  createProduct,
  ProductActionResult,
  ProductOption,
  RevenueGroupOption,
  updateProduct,
} from "./actions";
import { productFormToChildren, productFormToFields } from "./mappers";
import { DEFAULT_PRODUCT, productSchema, ProductFormValues } from "./validation";
import { ProductGroupOption } from "@/app/(dashboard)/product-groups/actions";
import { CompanyOption } from "@/app/(dashboard)/companies/actions";
import { LocationOption } from "@/app/(dashboard)/locations/actions";
import { SelectOption } from "@/components/shadcn/select";

type UseProductSubmitParams = {
  productGroups: ProductGroupOption[];
  suppliers: CompanyOption[];
  products: ProductOption[];
  locations: LocationOption[];
  revenueGroups: RevenueGroupOption[];
  /** Set when editing an existing product; omitted when creating one. */
  productUuid?: string;
  defaultValues?: ProductFormValues;
};

const EMPTY_OPTION: SelectOption = { value: "", label: "Empty" };

// Product groups nest, so the picker indents children under their parent rather
// than presenting a flat list in which "Round" could belong to anything.
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
  products,
  locations,
  revenueGroups,
  productUuid,
  defaultValues,
}: UseProductSubmitParams) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState<ProductActionResult>({});

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: defaultValues ?? DEFAULT_PRODUCT,
  });

  const groupOptions: SelectOption[] = [
    EMPTY_OPTION,
    ...buildHierarchicalOptions(productGroups),
  ];

  const companyOptions: SelectOption[] = [
    EMPTY_OPTION,
    ...suppliers.map((c) => ({
      value: c.uuid,
      label: c.companyName ?? c.searchCode1 ?? c.uuid,
    })),
  ];

  // A product cannot be its own alternative, scrap product or source, so it is
  // left out of every product picker on its own screen.
  const productOptions: SelectOption[] = [
    EMPTY_OPTION,
    ...products
      .filter((p) => p.uuid !== productUuid)
      .map((p) => ({
        value: p.uuid,
        label: `${p.productCode} — ${p.name}`,
      })),
  ];

  const locationOptions: SelectOption[] = [
    EMPTY_OPTION,
    ...locations.map((l) => ({ value: l.uuid, label: l.name })),
  ];

  const revenueGroupOptions: SelectOption[] = [
    EMPTY_OPTION,
    ...revenueGroups.map((g) => ({ value: g.uuid, label: g.name })),
  ];

  const handleCancel = () =>
    router.push(productUuid ? `/products/${productUuid}` : "/products");

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const fields = productFormToFields(values);
      const children = productFormToChildren(values);

      // Updating redirects from inside the action, so only the create path has
      // a result worth navigating on.
      if (productUuid) {
        setState(await updateProduct(productUuid, fields, children));
        return;
      }

      const result = await createProduct(fields, children);
      setState(result);
      if (result.success && result.productUuid) {
        router.push(`/products/${result.productUuid}`);
      }
    });
  });

  return {
    form,
    isPending,
    isEditing: Boolean(productUuid),
    onSubmit,
    state,
    groupOptions,
    companyOptions,
    productOptions,
    locationOptions,
    revenueGroupOptions,
    handleCancel,
  };
};
