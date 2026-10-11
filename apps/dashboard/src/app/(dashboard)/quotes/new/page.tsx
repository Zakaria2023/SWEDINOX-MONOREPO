import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { getCompaniesForSelect } from "@/app/(dashboard)/companies/actions";
import { getContractsForProjects } from "@/app/(dashboard)/contracts/actions";
import { getProductsForPricing } from "@/app/(dashboard)/products/actions";
import { getClerkUsersForSelect } from "@/lib/server/clerk";
import { requireAuth } from "@/lib/auth";
import { QuoteForm } from "@/components/quotes/quote-form";

const NewQuotePage = async () => {
  // A new quote's Seller is whoever opens it (#392).
  const userId = await requireAuth();
  // Sequential rather than concurrent: this database caps connections.
  const companies = await getCompaniesForSelect();
  const clerkUsers = await getClerkUsersForSelect();
  const contracts = await getContractsForProjects();
  const products = await getProductsForPricing();

  return (
    <div className="space-y-4">
      <div>
        <Link
          href="/quotes"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Quotes
        </Link>
      </div>
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
