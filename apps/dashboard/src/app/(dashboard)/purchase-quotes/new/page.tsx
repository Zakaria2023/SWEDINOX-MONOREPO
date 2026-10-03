import { getInternalAddressesForSelect } from "@/app/(dashboard)/addresses/actions";
import { getCompaniesForSelect } from "@/app/(dashboard)/companies/actions";
import { getClerkUsersForSelect } from "@/lib/server/clerk";
import { PurchaseQuoteForm } from "@/components/purchase-quotes/purchase-quote-form";

const NewPurchaseQuotePage = async () => {
  // Sequential rather than concurrent: this database caps connections.
  const companies = await getCompaniesForSelect();
  const clerkUsers = await getClerkUsersForSelect();
  const internalAddresses = await getInternalAddressesForSelect();

  return (
    <div className="space-y-4">
      <PurchaseQuoteForm
        companies={companies}
        clerkUsers={clerkUsers}
        internalAddresses={internalAddresses}
      />
    </div>
  );
};

export default NewPurchaseQuotePage;
