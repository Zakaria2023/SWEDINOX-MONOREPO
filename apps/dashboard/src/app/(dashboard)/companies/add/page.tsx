import { getAddresses } from "@/app/(dashboard)/addresses/actions";
import { CompanyForm } from "@/components/companies/company-form";
import { unstable_noStore as noStore } from "next/cache";

const AddCompanyPage = async () => {
  noStore();

  const initialAddresses = await getAddresses();

  return (
    <div className="max-w-4xl space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Add Company</h1>
        <p className="mt-2 text-gray-600">Create a new company record</p>
      </div>
      <CompanyForm initialAddresses={initialAddresses} />
    </div>
  );
};

export default AddCompanyPage;
