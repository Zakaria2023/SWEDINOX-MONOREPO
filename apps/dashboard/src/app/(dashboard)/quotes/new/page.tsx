import { getCompaniesForSelect } from "@/app/(dashboard)/companies/actions";
import { getContractsForProjects } from "@/app/(dashboard)/contracts/actions";
import { getProductsForPricing } from "@/app/(dashboard)/products/actions";
import { getClerkUsersForSelect } from "@/lib/server/clerk";
import { requireAuth } from "@/lib/auth";
import { QuoteForm } from "@/components/quotes/quote-form";

const NewQuotePage = async () => {
  // A new quote's Seller is whoever opens it (#392).
  const userId = await requireAuth();
  const [companies, clerkUsers, contracts, products] = await Promise.all([
    getCompaniesForSelect(),
    getClerkUsersForSelect(),
    getContractsForProjects(),
    getProductsForPricing(),
  ]);

  return (
    <div className="space-y-4">
      <QuoteForm
        companies={companies}
        clerkUsers={clerkUsers}
        contracts={contracts}
        products={products}
        defaultSeller={userId}
      />
    </div>
  );
};

export default NewQuotePage;
