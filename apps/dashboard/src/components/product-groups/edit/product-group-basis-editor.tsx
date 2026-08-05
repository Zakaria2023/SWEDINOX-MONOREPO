"use client";

import { updateProductGroupBasis } from "@/app/(dashboard)/product-groups/[uuid]/edit/actions";
import { ProductGroupFormValues } from "@/app/(dashboard)/product-groups/validation";
import { BasisSection } from "../sections/basis-section";
import { ProductGroupSectionForm } from "./product-group-section-form";

type Props = {
  productGroupUuid: string;
  defaultValues: ProductGroupFormValues;
};

export const ProductGroupBasisEditor = ({
  productGroupUuid,
  defaultValues,
}: Props) => (
  <ProductGroupSectionForm
    productGroupUuid={productGroupUuid}
    defaultValues={defaultValues}
    save={updateProductGroupBasis}
  >
    <BasisSection />
  </ProductGroupSectionForm>
);
