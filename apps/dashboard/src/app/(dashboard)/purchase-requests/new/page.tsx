import { getCompaniesForSelect } from "@/app/(dashboard)/companies/actions";
import { getClerkUsersForSelect } from "@/lib/server/clerk";
import { PurchaseRequestForm } from "@/components/purchase-requests/purchase-request-form";
import { PageHeading } from "@/components/layout/page-heading";

const NewPurchaseRequestPage = async () => {
  const [companies, clerkUsers] = await Promise.all([
    getCompaniesForSelect(),
    getClerkUsersForSelect(),
  ]);

  return (
    <div className="max-w-4xl space-y-6 p-6">
      <PageHeading
        title="New Purchase Request"
        description="Create a new supplier purchase request"
      />
      <PurchaseRequestForm companies={companies} clerkUsers={clerkUsers} />
    </div>
  );
};

export default NewPurchaseRequestPage;
