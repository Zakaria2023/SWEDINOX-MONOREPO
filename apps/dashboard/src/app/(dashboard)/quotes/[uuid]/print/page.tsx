import { notFound } from "next/navigation";
import { getQuoteDetail } from "@/app/(dashboard)/quotes/actions";
import { getSettings } from "@/app/(dashboard)/settings/actions";
import { QuoteDocument } from "@/components/quotes/quote-document";
import { getClerkUsersForSelect } from "@/lib/server/clerk";

type Props = {
  params: Promise<{ uuid: string }>;
};

/**
 * The printed quote — what the toolbar's `Print…` opens and what `Finalize`
 * prints as it releases the quote to the customer.
 */
const QuotePrintPage = async ({ params }: Props) => {
  const { uuid } = await params;

  // Sequential rather than concurrent: this database caps connections.
  const quote = await getQuoteDetail(uuid);
  if (!quote) {
    notFound();
  }
  const settings = await getSettings();
  const clerkUsers = quote.seller ? await getClerkUsersForSelect() : [];
  const sellerName =
    clerkUsers.find((user) => user.value === quote.seller)?.label ??
    quote.seller;

  return (
    <QuoteDocument
      quote={quote}
      affiliateName={settings.affiliateName}
      sellerName={sellerName}
    />
  );
};

export default QuotePrintPage;
