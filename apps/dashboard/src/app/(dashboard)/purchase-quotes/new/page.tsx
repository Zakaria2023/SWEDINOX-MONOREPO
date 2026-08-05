import { getCompaniesForSelect } from "@/app/(dashboard)/companies/actions";
import { getClerkUsersForSelect } from "@/lib/server/clerk";
import { PurchaseQuoteForm } from "@/components/purchase-quotes/purchase-quote-form";
import { PageHeading } from "@/components/layout/page-heading";

const NewPurchaseQuotePage = async () => {
  const [companies, clerkUsers] = await Promise.all([
    getCompaniesForSelect(),
    getClerkUsersForSelect(),
  ]);

  return (
    <div className="space-y-4">
      <PageHeading title="New Purchase Quote" />
      <PurchaseQuoteForm companies={companies} clerkUsers={clerkUsers} />
    </div>
  );
};

export default NewPurchaseQuotePage;
