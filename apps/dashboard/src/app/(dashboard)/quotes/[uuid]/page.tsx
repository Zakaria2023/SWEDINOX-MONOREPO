import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getQuoteDetail } from "@/app/(dashboard)/quotes/actions";
import { PageHeading } from "@/components/layout/page-heading";
import { QuoteDetailView } from "@/components/quotes/quote-detail";
import { getClerkUserNames } from "@/lib/server/clerk";
import { ORDER_STATUS_LABELS } from "@/lib/labels";

type Props = {
  params: Promise<{ uuid: string }>;
};

const QuoteDetailPage = async ({ params }: Props) => {
  const { uuid } = await params;

  const quote = await getQuoteDetail(uuid);

  if (!quote) {
    notFound();
  }

  // These columns store a Clerk id; Clerk owns the names.

  const userNames = await getClerkUserNames();

  // The reference's banner: `Quote 300009, Stappert Intramet S.A., Tel: 4275
  // 8211, Fax: 4275 8290 - Expired, Printed, Mailed` (#395).
  const heading = [
    `Quote ${quote.id}`,
    quote.companyName,
    `Tel: ${quote.companyTelephone ?? "-"}`,
    `Fax: ${quote.companyFax ?? "-"}`,
  ]
    .filter(Boolean)
    .join(", ");
  const state = [
    ORDER_STATUS_LABELS[quote.status],
    quote.isPrinted && "Printed",
    quote.isMailed && "Mailed",
    quote.isFaxed && "Faxed",
  ]
    .filter(Boolean)
    .join(", ");

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
      <PageHeading title={`${heading} - ${state}`} />
      <QuoteDetailView quote={quote}  userNames={userNames} />
    </div>
  );
};

export default QuoteDetailPage;
