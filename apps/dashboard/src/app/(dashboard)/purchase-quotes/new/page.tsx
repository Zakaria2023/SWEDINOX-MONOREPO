import { getInternalAddressesForSelect } from "@/app/(dashboard)/addresses/actions";
import { getCompaniesForSelect } from "@/app/(dashboard)/companies/actions";
import { getProductsForSelect } from "@/app/(dashboard)/products/actions";
import { getClerkUsersForSelect } from "@/lib/server/clerk";
import { PurchaseQuoteForm } from "@/components/purchase-quotes/purchase-quote-form";

const NewPurchaseQuotePage = async () => {
  // Sequential rather than concurrent: this database caps connections.
  const companies = await getCompaniesForSelect();
  const clerkUsers = await getClerkUsersForSelect();
  const products = await getProductsForSelect();
  const internalAddresses = await getInternalAddressesForSelect();

  return (
    <div className="space-y-4">
      <PurchaseQuoteForm
        companies={companies}
        clerkUsers={clerkUsers}
        products={products}
        internalAddresses={internalAddresses}
      />
    </div>
  );
};

export default NewPurchaseQuotePage;
