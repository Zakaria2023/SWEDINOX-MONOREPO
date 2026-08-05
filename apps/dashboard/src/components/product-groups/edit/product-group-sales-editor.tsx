"use client";

import { updateProductGroupSales } from "@/app/(dashboard)/product-groups/[uuid]/edit/actions";
import { ProductGroupFormValues } from "@/app/(dashboard)/product-groups/validation";
import { SalesSection } from "../sections/sales-section";
import { ProductGroupSectionForm } from "./product-group-section-form";

type Props = {
  productGroupUuid: string;
  defaultValues: ProductGroupFormValues;
};

export const ProductGroupSalesEditor = ({
  productGroupUuid,
  defaultValues,
}: Props) => (
  <ProductGroupSectionForm
    productGroupUuid={productGroupUuid}
    defaultValues={defaultValues}
    save={updateProductGroupSales}
  >
    <SalesSection />
  </ProductGroupSectionForm>
);
