import { getJournalEntries } from "@/app/(dashboard)/journal-entries/actions";
import { journalEntryFilters } from "@/app/(dashboard)/journal-entries/filters";
import { getCompaniesForSelect } from "@/app/(dashboard)/companies/actions";
import { getLedgerAccounts } from "@/app/(dashboard)/journal-entries/actions";
import { JournalEntriesTable } from "@/components/journal-entries/journal-entries-table-content";
import { parseTableQuery, SearchParams } from "@/lib/table-query";

type Props = {
  searchParams: Promise<SearchParams>;
};

const JournalEntriesPage = async ({ searchParams }: Props) => {
  const query = parseTableQuery(await searchParams);
  // Sequential rather than concurrent: this database caps connections.
  const entries = await getJournalEntries(query);
  const accounts = await getLedgerAccounts();
  const companies = await getCompaniesForSelect();

  return (
    <div className="space-y-4">
      <JournalEntriesTable
        page={entries}
        filters={journalEntryFilters(accounts, companies)}
      />
    </div>
  );
};

export default JournalEntriesPage;
