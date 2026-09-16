import Link from "next/link";
import { getQuotes } from "@/app/(dashboard)/quotes/actions";
import { quoteFilters } from "@/app/(dashboard)/quotes/filters";
import { getCompaniesForSelect } from "@/app/(dashboard)/companies/actions";
import { parseTableQuery, SearchParams } from "@/lib/table-query";
import { QuotesTable } from "@/components/quotes/quotes-table-content";

type Props = {
  searchParams: Promise<SearchParams>;
};

const QuotesPage = async ({ searchParams }: Props) => {
  const query = parseTableQuery(await searchParams);
  // Sequential rather than concurrent: this database caps connections.
  const quotes = await getQuotes(query);
  const companies = await getCompaniesForSelect();

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-end">
        <Link
          href="/quotes/new"
          className="inline-flex h-8 items-center justify-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
        >
          New Quote
        </Link>
      </div>
      <QuotesTable page={quotes} filters={quoteFilters(companies)} />
    </div>
  );
};

export default QuotesPage;
