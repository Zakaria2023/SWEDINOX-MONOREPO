import { PageHeading } from "@/components/layout/page-heading";
import { SearchResultsList } from "@/components/search/search-results-list";
import { globalSearch } from "@/lib/server/global-search";
import { SearchParams } from "@/lib/table-query";

type Props = {
  searchParams: Promise<SearchParams>;
};

const SearchPage = async ({ searchParams }: Props) => {
  const params = await searchParams;
  const raw = Array.isArray(params.q) ? params.q[0] : params.q;
  const results = await globalSearch(raw ?? "");

  return (
    <div className="space-y-4">
      <PageHeading
        title={results.term ? `Results for “${results.term}”` : "Search"}
      />
      <SearchResultsList results={results} />
    </div>
  );
};

export default SearchPage;
