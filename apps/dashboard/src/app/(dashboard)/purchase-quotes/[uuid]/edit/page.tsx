import { getCompaniesForSelect } from "@/app/(dashboard)/companies/actions";
import { getPurchaseQuoteForEdit } from "@/app/(dashboard)/purchase-quotes/actions";
import { purchaseQuoteToFormValues } from "@/app/(dashboard)/purchase-quotes/mappers";
import { PageHeading } from "@/components/layout/page-heading";
import { PurchaseQuoteForm } from "@/components/purchase-quotes/purchase-quote-form";
import { isPurchaseQuoteEditable } from "@/lib/helpers";
import { PURCHASE_QUOTE_STATUS_LABELS } from "@/lib/labels";
import { getClerkUsersForSelect } from "@/lib/server/clerk";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ uuid: string }>;
};

const EditPurchaseQuotePage = async ({ params }: Props) => {
  const { uuid } = await params;

  const [quote, companies, clerkUsers] = await Promise.all([
    getPurchaseQuoteForEdit(uuid),
    getCompaniesForSelect(),
    getClerkUsersForSelect(),
  ]);

  if (!quote) {
    notFound();
  }

  const heading = quote.quoteNumber
    ? `Edit Purchase Quote ${quote.quoteNumber}`
    : "Edit Purchase Quote";

  return (
    <div className="space-y-4">
      <div>
        <Link
          href={`/purchase-quotes/${uuid}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Back to purchase quote
        </Link>
      </div>
      <PageHeading title={heading} />

      {isPurchaseQuoteEditable(quote.status) ? (
        <PurchaseQuoteForm
          companies={companies}
          clerkUsers={clerkUsers}
          purchaseQuoteUuid={uuid}
          defaultValues={purchaseQuoteToFormValues(quote)}
        />
      ) : (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          This quote has already been decided
          {quote.status
            ? ` (${PURCHASE_QUOTE_STATUS_LABELS[quote.status]})`
            : ""}
          . An awarded quote is what the purchase order raised from it is priced
          on, so its terms can no longer be changed.
        </div>
      )}
    </div>
  );
};

export default EditPurchaseQuotePage;
