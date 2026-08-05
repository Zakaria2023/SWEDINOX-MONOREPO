"use client";

import { CompanyOption } from "@/app/(dashboard)/companies/actions";
import { updateProductGroupSuppliers } from "@/app/(dashboard)/product-groups/[uuid]/edit/actions";
import { ProductGroupFormValues } from "@/app/(dashboard)/product-groups/validation";
import { SupplierSection } from "../sections/supplier-section";
import { ProductGroupSectionForm } from "./product-group-section-form";

type Props = {
  productGroupUuid: string;
  defaultValues: ProductGroupFormValues;
  companies: CompanyOption[];
};

export const ProductGroupSupplierEditor = ({
  productGroupUuid,
  defaultValues,
  companies,
}: Props) => {
  const supplierOptions = [
    { value: "", label: "— None —" },
    ...companies
      .filter((company) => company.roles?.includes("supplier"))
      .map((company) => ({
        value: company.uuid,
        label: company.companyName ?? company.searchCode1 ?? company.uuid,
      })),
  ];

  return (
    <ProductGroupSectionForm
      productGroupUuid={productGroupUuid}
      defaultValues={defaultValues}
      save={updateProductGroupSuppliers}
      submitLabel="Save Suppliers"
    >
      <SupplierSection supplierOptions={supplierOptions} />
    </ProductGroupSectionForm>
  );
};
