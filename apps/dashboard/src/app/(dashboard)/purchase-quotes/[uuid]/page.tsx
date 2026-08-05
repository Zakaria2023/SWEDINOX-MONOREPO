import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getPurchaseQuoteDetail } from "@/app/(dashboard)/purchase-quotes/actions";
import { PurchaseQuoteDetailView } from "@/components/purchase-quotes/purchase-quote-detail";
import { PageHeading } from "@/components/layout/page-heading";

type Props = {
  params: Promise<{ uuid: string }>;
};

const PurchaseQuoteDetailPage = async ({ params }: Props) => {
  const { uuid } = await params;

  const quote = await getPurchaseQuoteDetail(uuid);

  if (!quote) {
    notFound();
  }

  return (
    <div className="space-y-4">
      <div>
        <Link
          href="/purchase-quotes"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Purchase quotes
        </Link>
      </div>
      <PageHeading title={`Purchase quote #${quote.id}`} />
      <PurchaseQuoteDetailView quote={quote} />
    </div>
  );
};

export default PurchaseQuoteDetailPage;
