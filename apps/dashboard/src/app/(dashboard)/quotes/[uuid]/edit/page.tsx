import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCompaniesForSelect } from "@/app/(dashboard)/companies/actions";
import { getContractsForProjects } from "@/app/(dashboard)/contracts/actions";
import { getProductsForPricing } from "@/app/(dashboard)/products/actions";
import { getQuoteDetail } from "@/app/(dashboard)/quotes/actions";
import { quoteDetailToFormValues } from "@/app/(dashboard)/quotes/mappers";
import { PageHeading } from "@/components/layout/page-heading";
import { QuoteForm } from "@/components/quotes/quote-form";
import { getClerkUsersForSelect } from "@/lib/server/clerk";

type Props = {
  params: Promise<{ uuid: string }>;
};

const EditQuotePage = async ({ params }: Props) => {
  const { uuid } = await params;

  const [quote, companies, clerkUsers, contracts, products] = await Promise.all(
    [
      getQuoteDetail(uuid),
      getCompaniesForSelect(),
      getClerkUsersForSelect(),
      getContractsForProjects(),
      getProductsForPricing(),
    ],
  );

  if (!quote) {
    notFound();
  }

  return (
    <div className="space-y-4">
      <div>
        <Link
          href={`/quotes/${uuid}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Quote #{quote.id}
        </Link>
      </div>
      <PageHeading title={`Edit Quote #${quote.id}`} />
      <QuoteForm
        companies={companies}
        clerkUsers={clerkUsers}
        contracts={contracts}
        products={products}
        quoteUuid={uuid}
        defaultValues={quoteDetailToFormValues(quote)}
      />
    </div>
  );
};

export default EditQuotePage;
