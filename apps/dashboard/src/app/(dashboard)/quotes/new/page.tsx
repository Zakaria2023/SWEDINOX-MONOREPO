import { getCompaniesForSelect } from "@/app/(dashboard)/companies/actions";
import { getContractsForProjects } from "@/app/(dashboard)/contracts/actions";
import { getClerkUsersForSelect } from "@/lib/server/clerk";
import { QuoteForm } from "@/components/quotes/quote-form";
import { PageHeading } from "@/components/layout/page-heading";

const NewQuotePage = async () => {
  const [companies, clerkUsers, contracts] = await Promise.all([
    getCompaniesForSelect(),
    getClerkUsersForSelect(),
    getContractsForProjects(),
  ]);

  return (
    <div className="max-w-4xl space-y-6 p-6">
      <PageHeading
        title="New Quote"
        description="Create a new customer quote"
      />
      <QuoteForm companies={companies} clerkUsers={clerkUsers} contracts={contracts} />
    </div>
  );
};

export default NewQuotePage;
