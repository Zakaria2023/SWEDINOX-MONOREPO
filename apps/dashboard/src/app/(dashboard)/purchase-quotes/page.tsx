import Link from "next/link";
import { getPurchaseQuotes } from "@/app/(dashboard)/purchase-quotes/actions";
import { PurchaseQuotesTable } from "@/components/purchase-quotes/purchase-quotes-table-content";
import { PageHeading } from "@/components/layout/page-heading";

const PurchaseQuotesPage = async () => {
  const purchaseQuotes = await getPurchaseQuotes();

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start justify-between">
        <PageHeading title="Purchase Quotes" />
        <Link
          href="/purchase-quotes/new"
          className="inline-flex h-8 items-center justify-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
        >
          New Purchase Quote
        </Link>
      </div>
      <PurchaseQuotesTable purchaseQuotes={purchaseQuotes} />
    </div>
  );
};

export default PurchaseQuotesPage;
