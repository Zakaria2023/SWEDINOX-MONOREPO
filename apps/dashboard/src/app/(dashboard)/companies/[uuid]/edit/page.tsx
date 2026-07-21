import {
  getContracts,
  getContractsForProjects,
} from "@/app/(dashboard)/contracts/actions";
import {
  getCompanyForEdit,
  getDebtorCompaniesForSelect,
  getPurchaseOrgCompaniesForSelect,
  getSuppliersForSelect,
} from "@/app/(dashboard)/companies/actions";
import { getIndustriesForSelect } from "@/app/(dashboard)/industries/actions";
import { getProductGroupsForSelect } from "@/app/(dashboard)/product-groups/actions";
import { getProductsForSelect } from "@/app/(dashboard)/products/actions";
import { getTextCategoriesForSelect } from "@/app/(dashboard)/text-categories/actions";
import { CompanyForm } from "@/components/companies/company-form";
import { PageHeading } from "@/components/layout/page-heading";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ uuid: string }>;
};

const EditCompanyPage = async ({ params }: Props) => {
  const { uuid } = await params;

  const [
    initialData,
    availableContracts,
    projectContracts,
    textCategories,
    debtorCompanies,
    purchaseOrgCompanies,
    productGroups,
    availableProducts,
    suppliers,
    industries,
  ] = await Promise.all([
    getCompanyForEdit(uuid),
    getContracts(),
    getContractsForProjects(),
    getTextCategoriesForSelect(),
    getDebtorCompaniesForSelect(),
    getPurchaseOrgCompaniesForSelect(),
    getProductGroupsForSelect(),
    getProductsForSelect(),
    getSuppliersForSelect(),
    getIndustriesForSelect(),
  ]);

  if (!initialData) {
    notFound();
  }

  return (
    <div className="max-w-4xl space-y-6 p-6">
      <div>
        <Link
          href={`/companies/${uuid}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Back to company
        </Link>
      </div>
      <PageHeading
        title={`Edit ${initialData.formValues.companyName}`}
        description="Update this company record"
      />
      <CompanyForm
        mode="edit"
        companyUuid={uuid}
        initialData={initialData}
        availableContracts={availableContracts}
        projectContracts={projectContracts}
        textCategories={textCategories}
        debtorCompanies={debtorCompanies}
        purchaseOrgCompanies={purchaseOrgCompanies}
        productGroups={productGroups}
        availableProducts={availableProducts}
        suppliers={suppliers}
        industries={industries}
      />
    </div>
  );
};

export default EditCompanyPage;
