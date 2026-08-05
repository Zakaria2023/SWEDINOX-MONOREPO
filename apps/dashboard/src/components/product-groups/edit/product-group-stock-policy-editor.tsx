"use client";

import { updateProductGroupStockPolicy } from "@/app/(dashboard)/product-groups/[uuid]/edit/actions";
import { ProductGroupFormValues } from "@/app/(dashboard)/product-groups/validation";
import { StockPolicySection } from "../sections/stock-policy-section";
import { ProductGroupSectionForm } from "./product-group-section-form";

type Props = {
  productGroupUuid: string;
  defaultValues: ProductGroupFormValues;
};

export const ProductGroupStockPolicyEditor = ({
  productGroupUuid,
  defaultValues,
}: Props) => (
  <ProductGroupSectionForm
    productGroupUuid={productGroupUuid}
    defaultValues={defaultValues}
    save={updateProductGroupStockPolicy}
  >
    <StockPolicySection />
  </ProductGroupSectionForm>
);
