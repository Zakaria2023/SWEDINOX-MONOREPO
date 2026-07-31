import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getQuoteDetail } from "@/app/(dashboard)/quotes/actions";
import { PageHeading } from "@/components/layout/page-heading";
import { QuoteDetailView } from "@/components/quotes/quote-detail";

type Props = {
  params: Promise<{ uuid: string }>;
};

const QuoteDetailPage = async ({ params }: Props) => {
  const { uuid } = await params;

  const quote = await getQuoteDetail(uuid);

  if (!quote) {
    notFound();
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <Link
          href="/quotes"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Quotes
        </Link>
      </div>
      <PageHeading
        title={`Quote #${quote.id}`}
        description={quote.companyName ?? undefined}
      />
      <QuoteDetailView quote={quote} />
    </div>
  );
};

export default QuoteDetailPage;
