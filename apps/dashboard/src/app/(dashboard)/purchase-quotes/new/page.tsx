import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { getInternalAddressesForSelect } from "@/app/(dashboard)/addresses/actions";
import { getCompaniesForSelect } from "@/app/(dashboard)/companies/actions";
import { PurchaseQuoteForm } from "@/components/purchase-quotes/purchase-quote-form";
import { getClerkUsersForSelect } from "@/lib/server/clerk";

const NewPurchaseQuotePage = async () => {
  // Sequential rather than concurrent: this database caps connections.
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
      />
    </div>
  );
};

export default NewPurchaseQuotePage;
