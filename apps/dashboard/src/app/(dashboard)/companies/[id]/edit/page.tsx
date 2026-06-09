import { getAddresses } from "@/app/(dashboard)/addresses/actions";
import { getCompanyById } from "@/app/(dashboard)/companies/actions";
import { CompanyForm } from "@/components/companies/company-form";
import { unstable_noStore as noStore } from "next/cache";

type Params = Promise<{ id: string }>;

const EditCompanyPage = async ({ params }: { params: Params }) => {
  noStore();

  const { id } = await params;
  const companyId = Number(id);
  const initialCompany = await getCompanyById(companyId);
  const initialAddresses = await getAddresses();

  return (
    <div className="max-w-4xl space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Edit Company</h1>
        <p className="mt-2 text-gray-600">Update the company record</p>
      </div>
      <CompanyForm
        mode="edit"
        companyId={companyId}
        initialCompany={initialCompany}
        initialAddresses={initialAddresses}
      />
    </div>
  );
};

export default EditCompanyPage;
