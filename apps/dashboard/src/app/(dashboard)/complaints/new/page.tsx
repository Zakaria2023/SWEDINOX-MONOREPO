import { getCompaniesForSelect } from "@/app/(dashboard)/companies/actions";
import { getProductsForSelect } from "@/app/(dashboard)/products/actions";
import { ComplaintForm } from "@/components/complaints/complaint-form";
import { getClerkAdminUsers } from "@/lib/server/clerk";

const NewComplaintPage = async () => {
  const [companies, products, responsibleUsers] = await Promise.all([
    getCompaniesForSelect(),
    getProductsForSelect(),
    getClerkAdminUsers(),
  ]);

  return (
    <div className="space-y-4">
      <ComplaintForm
        companies={companies}
        products={products}
        responsibleUsers={responsibleUsers}
      />
    </div>
  );
};

export default NewComplaintPage;
