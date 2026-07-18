import {
  getContracts,
  getContractsForProjects,
} from "@/app/(dashboard)/contracts/actions";
import {
  getDebtorCompaniesForSelect,
  getPurchaseOrgCompaniesForSelect,
} from "@/app/(dashboard)/companies/actions";
import { getIndustriesForSelect } from "@/app/(dashboard)/industries/actions";
import { getProductGroupsForSelect } from "@/app/(dashboard)/product-groups/actions";
import { getProductsForSelect } from "@/app/(dashboard)/products/actions";
import { getTextCategoriesForSelect } from "@/app/(dashboard)/text-categories/actions";
import { CompanyForm } from "@/components/companies/company-form";
import { PageHeading } from "@/components/layout/page-heading";

const AddCompanyPage = async () => {
  const [
    availableContracts,
    projectContracts,
    textCategories,
    debtorCompanies,
    purchaseOrgCompanies,
    productGroups,
    availableProducts,
    industries,
  ] = await Promise.all([
    getContracts(),
    getContractsForProjects(),
    getTextCategoriesForSelect(),
    getDebtorCompaniesForSelect(),
    getPurchaseOrgCompaniesForSelect(),
    getProductGroupsForSelect(),
    getProductsForSelect(),
    getIndustriesForSelect(),
  ]);

  return (
    <div className="max-w-4xl space-y-6 p-6">
      <PageHeading
        title="Add Company"
        description="Create a new company record"
      />
      <CompanyForm
        availableContracts={availableContracts}
        projectContracts={projectContracts}
        textCategories={textCategories}
        debtorCompanies={debtorCompanies}
        purchaseOrgCompanies={purchaseOrgCompanies}
        productGroups={productGroups}
        availableProducts={availableProducts}
        industries={industries}
      />
    </div>
  );
};

export default AddCompanyPage;
