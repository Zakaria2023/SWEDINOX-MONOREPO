import { getContracts, getContractsForProjects } from "@/app/(dashboard)/contracts/actions";
import { CompanyForm } from "@/components/companies/company-form";
import { PageHeading } from "@/components/layout/page-heading";

const AddCompanyPage = async () => {
  const [availableContracts, projectContracts] = await Promise.all([
    getContracts(),
    getContractsForProjects(),
  ]);

  return (
    <div className="max-w-4xl space-y-6 p-6">
      <PageHeading
        title="Add Company"
        description="Create a new company record"
      />
      <CompanyForm availableContracts={availableContracts} projectContracts={projectContracts} />
    </div>
  );
};

export default AddCompanyPage;
