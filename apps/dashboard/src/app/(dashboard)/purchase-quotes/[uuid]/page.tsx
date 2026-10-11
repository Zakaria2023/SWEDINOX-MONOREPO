import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getInternalAddressesForSelect } from "@/app/(dashboard)/addresses/actions";
import { getCompaniesForSelect } from "@/app/(dashboard)/companies/actions";
import { getPurchaseQuoteDetail } from "@/app/(dashboard)/purchase-quotes/actions";
import { PurchaseQuoteForm } from "@/components/purchase-quotes/purchase-quote-form";
import { getClerkUsersForSelect } from "@/lib/server/clerk";

type Props = {
  params: Promise<{ uuid: string }>;
};

/**
 * One screen, as the reference has it: a saved quote is the form it was typed
 * on — the toolbar, the header, then the lines and every panel.
 */
const PurchaseQuoteDetailPage = async ({ params }: Props) => {
  const { uuid } = await params;

  // Sequential rather than concurrent: this database caps connections.
  const quote = await getPurchaseQuoteDetail(uuid);

  if (!quote) {
    notFound();
  }

  const companies = await getCompaniesForSelect();
  const clerkUsers = await getClerkUsersForSelect();
  const internalAddresses = await getInternalAddressesForSelect();

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
      <PurchaseQuoteForm
        companies={companies}
        clerkUsers={clerkUsers}
        internalAddresses={internalAddresses}
        existing={quote}
      />
    </div>
  );
};

export default PurchaseQuoteDetailPage;
