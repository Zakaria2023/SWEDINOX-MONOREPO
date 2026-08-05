"use client";

import { updateProductGroupGeneral } from "@/app/(dashboard)/product-groups/[uuid]/edit/actions";
import { ProductGroupOption } from "@/app/(dashboard)/product-groups/actions";
import { ProductGroupFormValues } from "@/app/(dashboard)/product-groups/validation";
import { GeneralSection } from "../sections/general-section";
import { ProductGroupSectionForm } from "./product-group-section-form";

type Props = {
  productGroupUuid: string;
  defaultValues: ProductGroupFormValues;
  parentCandidates: ProductGroupOption[];
};

export const ProductGroupGeneralEditor = ({
  productGroupUuid,
  defaultValues,
  parentCandidates,
}: Props) => {
  const parentGroupOptions = [
    { value: "", label: "— None —" },
    ...parentCandidates.map((group) => ({
      value: group.uuid,
      label: group.name,
    })),
  ];

  return (
    <ProductGroupSectionForm
      productGroupUuid={productGroupUuid}
      defaultValues={defaultValues}
      save={updateProductGroupGeneral}
    >
      <GeneralSection parentGroupOptions={parentGroupOptions} />
    </ProductGroupSectionForm>
  );
};
