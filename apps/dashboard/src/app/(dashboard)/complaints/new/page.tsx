import { getCompaniesForSelect } from "@/app/(dashboard)/companies/actions";
import { getProductsForSelect } from "@/app/(dashboard)/products/actions";
import { ComplaintForm } from "@/components/complaints/complaint-form";
import { PageHeading } from "@/components/layout/page-heading";
import { getClerkAdminUsers } from "@/lib/server/clerk";

const NewComplaintPage = async () => {
  const [companies, products, responsibleUsers] = await Promise.all([
    getCompaniesForSelect(),
    getProductsForSelect(),
    getClerkAdminUsers(),
  ]);

  return (
    <div className="space-y-4">
      <PageHeading title="New Complaint" />
      <ComplaintForm
        companies={companies}
        products={products}
        responsibleUsers={responsibleUsers}
      />
    </div>
  );
};

export default NewComplaintPage;
