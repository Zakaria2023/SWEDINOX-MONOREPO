import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCompaniesForSelect } from "@/app/(dashboard)/companies/actions";
import { getContractsForProjects } from "@/app/(dashboard)/contracts/actions";
import { getProductsForPricing } from "@/app/(dashboard)/products/actions";
import { getQuoteDetail } from "@/app/(dashboard)/quotes/actions";
import { QuoteForm } from "@/components/quotes/quote-form";
import { requireAuth } from "@/lib/auth";
import { getClerkUsersForSelect } from "@/lib/server/clerk";

type Props = {
  params: Promise<{ uuid: string }>;
};

/**
 * One screen, as the reference has it: a saved quote is the form it was typed
 * on — the toolbar, the header, then the lines and every panel.
 */
const QuoteDetailPage = async ({ params }: Props) => {
  const { uuid } = await params;
  await requireAuth();

  // Sequential rather than concurrent: this database caps connections.
  const quote = await getQuoteDetail(uuid);

  if (!quote) {
    notFound();
  }

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
        existing={quote}
      />
    </div>
  );
};

export default QuoteDetailPage;
