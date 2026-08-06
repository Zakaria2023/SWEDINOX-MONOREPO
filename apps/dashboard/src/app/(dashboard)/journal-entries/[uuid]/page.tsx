import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getJournalEntryDetail } from "@/app/(dashboard)/journal-entries/actions";
import { JournalEntryDetailView } from "@/components/journal-entries/journal-entry-detail";
import { PageHeading } from "@/components/layout/page-heading";
import { getClerkUserNames } from "@/lib/server/clerk";

type Props = {
  params: Promise<{ uuid: string }>;
};

const JournalEntryDetailPage = async ({ params }: Props) => {
  const { uuid } = await params;

  const entry = await getJournalEntryDetail(uuid);

  if (!entry) {
    notFound();
  }

  // These columns store a Clerk id; Clerk owns the names.

  const userNames = await getClerkUserNames();

  return (
    <div className="space-y-4">
      <div>
        <Link
          href="/journal-entries"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Journal Entries
        </Link>
      </div>
      <PageHeading title={entry.documentNo ?? `Posting #${entry.id}`} />
      <JournalEntryDetailView entry={entry}  userNames={userNames} />
    </div>
  );
};

export default JournalEntryDetailPage;
