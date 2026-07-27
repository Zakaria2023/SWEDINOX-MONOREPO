import { getCompaniesForSelect } from "@/app/(dashboard)/companies/actions";
import { getContractsForProjects } from "@/app/(dashboard)/contracts/actions";
import { getProductsForPricing } from "@/app/(dashboard)/products/actions";
import { getClerkUsersForSelect } from "@/lib/server/clerk";
import { QuoteForm } from "@/components/quotes/quote-form";
import { PageHeading } from "@/components/layout/page-heading";

const NewQuotePage = async () => {
  const [companies, clerkUsers, contracts, products] = await Promise.all([
    getCompaniesForSelect(),
    getClerkUsersForSelect(),
    getContractsForProjects(),
    getProductsForPricing(),
  ]);

  return (
    <div className="max-w-6xl space-y-6 p-6">
      <PageHeading title="New Quote" description="Create a new customer quote" />
      <QuoteForm
        companies={companies}
        clerkUsers={clerkUsers}
        contracts={contracts}
        products={products}
      />
    </div>
  );
};

export default NewQuotePage;
