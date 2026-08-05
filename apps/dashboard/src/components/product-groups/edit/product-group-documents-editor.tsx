"use client";

import { updateProductGroupDocuments } from "@/app/(dashboard)/product-groups/[uuid]/edit/actions";
import { ProductGroupFormValues } from "@/app/(dashboard)/product-groups/validation";
import { DocumentsSection } from "../sections/documents-section";
import { ProductGroupSectionForm } from "./product-group-section-form";

type Props = {
  productGroupUuid: string;
  defaultValues: ProductGroupFormValues;
};

export const ProductGroupDocumentsEditor = ({
  productGroupUuid,
  defaultValues,
}: Props) => (
  <ProductGroupSectionForm
    productGroupUuid={productGroupUuid}
    defaultValues={defaultValues}
    save={updateProductGroupDocuments}
  >
    <DocumentsSection />
  </ProductGroupSectionForm>
);
