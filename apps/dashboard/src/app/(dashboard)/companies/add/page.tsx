import { getContracts, getContractsForProjects } from "@/app/(dashboard)/contracts/actions";
import { getCustomerGroups } from "@/app/(dashboard)/customer-groups/actions";
import { getTextCategoriesForSelect } from "@/app/(dashboard)/text-categories/actions";
import { CompanyForm } from "@/components/companies/company-form";
import { PageHeading } from "@/components/layout/page-heading";

const AddCompanyPage = async () => {
  const [availableContracts, projectContracts, textCategories, customerGroups] = await Promise.all([
    getContracts(),
    getContractsForProjects(),
    getTextCategoriesForSelect(),
    getCustomerGroups(),
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
        customerGroups={customerGroups}
      />
    </div>
  );
};

export default AddCompanyPage;
