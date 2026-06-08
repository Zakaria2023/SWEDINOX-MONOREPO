import { CompanyForm } from "../../components/company-form";

type Params = Promise<{ id: string }>;

const EditCompanyPage = async ({ params }: { params: Params }) => {
  const { id } = await params;

  return (
    <div className="max-w-4xl space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Edit Company</h1>
        <p className="mt-2 text-gray-600">Update the company record</p>
      </div>
      <CompanyForm mode="edit" companyId={Number(id)} />
    </div>
  );
};

export default EditCompanyPage;
