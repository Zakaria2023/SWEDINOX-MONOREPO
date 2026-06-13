import { getContractsForCompanyForm } from "@/app/(dashboard)/companies/actions";
import { CompanyForm } from "@/components/companies/company-form";
import { PageHeading } from "@/components/layout/page-heading";

const AddCompanyPage = async () => {
  const contracts = await getContractsForCompanyForm();

  return (
    <div className="max-w-4xl space-y-6 p-6">
      <PageHeading
        titleKey="companies-add-page.title"
        descriptionKey="companies-add-page.description"
      />
      <CompanyForm contracts={contracts} />
    </div>
  );
};

export default AddCompanyPage;
