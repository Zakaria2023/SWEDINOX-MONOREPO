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
    <div className="max-w-4xl space-y-6 p-6">
      <PageHeading
        title="New Purchase Quote"
        description="Create a new supplier purchase quote"
      />
      <PurchaseQuoteForm companies={companies} clerkUsers={clerkUsers} />
    </div>
  );
};

export default NewPurchaseQuotePage;
