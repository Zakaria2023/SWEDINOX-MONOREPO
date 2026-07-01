import { getCompaniesForSelect } from "@/app/(dashboard)/companies/actions";
import { getProductsForSelect } from "@/app/(dashboard)/products/actions";
import { ComplaintForm } from "@/components/complaints/complaint-form";
import { PageHeading } from "@/components/layout/page-heading";

const NewComplaintPage = async () => {
  const [companies, products] = await Promise.all([
    getCompaniesForSelect(),
    getProductsForSelect(),
  ]);

  return (
    <div className="max-w-3xl space-y-6 p-6">
      <PageHeading
        title="New Complaint"
        description="Register a new customer complaint"
      />
      <ComplaintForm companies={companies} products={products} />
    </div>
  );
};

export default NewComplaintPage;
