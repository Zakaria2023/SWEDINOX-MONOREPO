import { CompanyForm } from "@/components/companies/company-form";
import { PageHeading } from "@/components/layout/page-heading";

const AddCompanyPage = () => {
  return (
    <div className="max-w-4xl space-y-6 p-6">
      <PageHeading
        title="Add Company"
        description="Create a new company record"
      />
      <CompanyForm />
    </div>
  );
};

export default AddCompanyPage;
