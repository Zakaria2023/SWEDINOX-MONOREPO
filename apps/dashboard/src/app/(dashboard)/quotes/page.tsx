import Link from "next/link";
import { getQuotes } from "@/app/(dashboard)/quotes/actions";
import { QuotesTable } from "@/components/quotes/quotes-table-content";
import { PageHeading } from "@/components/layout/page-heading";

const QuotesPage = async () => {
  const quotes = await getQuotes();

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <PageHeading title="Quotes" />
        <Link
          href="/quotes/new"
          className="inline-flex h-8 items-center justify-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
        >
          New Quote
        </Link>
      </div>
      <QuotesTable quotes={quotes} />
    </div>
  );
};

export default QuotesPage;
