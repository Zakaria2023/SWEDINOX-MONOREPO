import { CompanyForm } from "@/components/companies/company-form";

const AddCompanyPage = () => (
  <div className="max-w-4xl space-y-6 p-6">
    <div>
      <h1 className="text-3xl font-bold text-gray-900">Add Company</h1>
      <p className="mt-2 text-gray-600">Create a new company record</p>
    </div>
    <CompanyForm />
  </div>
);

export default AddCompanyPage;
