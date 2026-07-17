import { getJournalEntries } from "@/app/(dashboard)/journal-entries/actions";
import { JournalEntriesTable } from "@/components/journal-entries/journal-entries-table-content";
import { PageHeading } from "@/components/layout/page-heading";

const JournalEntriesPage = async () => {
  const entries = await getJournalEntries();

  return (
    <div className="space-y-6 p-6">
      <PageHeading
        title="Journal entries"
        description="General-ledger postings behind the sales and purchase invoices"
      />
      <JournalEntriesTable entries={entries} />
    </div>
  );
};

export default JournalEntriesPage;
