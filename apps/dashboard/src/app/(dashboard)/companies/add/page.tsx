import { getContracts } from "@/app/(dashboard)/contracts/actions";
import { getCustomerGroups } from "@/app/(dashboard)/customer-groups/actions";
import { CompanyForm } from "@/components/companies/company-form";
import { PageHeading } from "@/components/layout/page-heading";

const AddCompanyPage = async () => {
  const [availableContracts, customerGroups] = await Promise.all([
    getContracts(),
    getCustomerGroups(),
  ]);

  return (
    <div className="max-w-4xl space-y-6 p-6">
      <PageHeading
        title="Add Company"
        description="Create a new company record"
      />
      <CompanyForm availableContracts={availableContracts} customerGroups={customerGroups} />
    </div>
  );
};

export default AddCompanyPage;
