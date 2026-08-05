"use client";

import { updateProductGroupWarehouseControl } from "@/app/(dashboard)/product-groups/[uuid]/edit/actions";
import { ProductGroupFormValues } from "@/app/(dashboard)/product-groups/validation";
import { WarehouseControlSection } from "../sections/warehouse-control-section";
import { ProductGroupSectionForm } from "./product-group-section-form";

type Props = {
  productGroupUuid: string;
  defaultValues: ProductGroupFormValues;
};

export const ProductGroupWarehouseControlEditor = ({
  productGroupUuid,
  defaultValues,
}: Props) => (
  <ProductGroupSectionForm
    productGroupUuid={productGroupUuid}
    defaultValues={defaultValues}
    save={updateProductGroupWarehouseControl}
  >
    <WarehouseControlSection />
  </ProductGroupSectionForm>
);
