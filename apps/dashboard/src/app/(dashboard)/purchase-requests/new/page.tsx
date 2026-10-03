import { getCompaniesForSelect } from "@/app/(dashboard)/companies/actions";
import { getClerkUsersForSelect } from "@/lib/server/clerk";
import { PurchaseRequestForm } from "@/components/purchase-requests/purchase-request-form";

const NewPurchaseRequestPage = async () => {
  const [companies, clerkUsers] = await Promise.all([
    getCompaniesForSelect(),
    getClerkUsersForSelect(),
  ]);

  return (
    <div className="space-y-4">
      <PurchaseRequestForm
        companies={companies}
        clerkUsers={clerkUsers}
      />
    </div>
  );
};

export default NewPurchaseRequestPage;
