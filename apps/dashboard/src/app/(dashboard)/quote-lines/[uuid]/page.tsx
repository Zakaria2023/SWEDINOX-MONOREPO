import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getQuoteLineDetail } from "@/app/(dashboard)/quote-lines/actions";
import { QuoteLineDetailView } from "@/components/quote-lines/quote-line-detail";
import { PageHeading } from "@/components/layout/page-heading";

type Props = {
  params: Promise<{ uuid: string }>;
};

const QuoteLineDetailPage = async ({ params }: Props) => {
  const { uuid } = await params;

  const line = await getQuoteLineDetail(uuid);

  if (!line) {
    notFound();
  }

  return (
    <div className="space-y-4">
      <div>
        <Link
          href="/quote-lines"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Quote Lines
        </Link>
      </div>
      <PageHeading
        title={
          line.quoteId === null
            ? `Line #${line.id}`
            : `Quote #${line.quoteId} — line ${line.lineNumber ?? "?"}`
        }
      />
      <QuoteLineDetailView line={line} />
    </div>
  );
};

export default QuoteLineDetailPage;
