import {
  getContractsForSelect,
  getContractsForProjects,
} from "@/app/(dashboard)/contracts/actions";
import {
  getDebtorCompaniesForSelect,
  getPurchaseOrgCompaniesForSelect,
  getSuppliersForSelect,
} from "@/app/(dashboard)/companies/actions";
import { getIndustriesForSelect } from "@/app/(dashboard)/industries/actions";
import { getProductGroupsForSelect } from "@/app/(dashboard)/product-groups/actions";
import { getProductsForSelect } from "@/app/(dashboard)/products/actions";
import { getTextCategoriesForSelect } from "@/app/(dashboard)/text-categories/actions";
import { CompanyForm } from "@/components/companies/company-form";

const AddCompanyPage = async () => {
  const [
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
    getContractsForSelect(),
    getContractsForProjects(),
    getTextCategoriesForSelect(),
    getDebtorCompaniesForSelect(),
    getPurchaseOrgCompaniesForSelect(),
    getProductGroupsForSelect(),
    getProductsForSelect(),
    getSuppliersForSelect(),
    getIndustriesForSelect(),
  ]);

  return (
    <div className="space-y-4">
      <CompanyForm
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

export default AddCompanyPage;
