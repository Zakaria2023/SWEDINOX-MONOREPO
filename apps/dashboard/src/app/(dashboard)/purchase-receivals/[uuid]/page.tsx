import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getPurchaseReceivalDetail } from "@/app/(dashboard)/purchase-receivals/actions";
import { PurchaseReceivalDetailView } from "@/components/purchase-receivals/purchase-receival-detail";
import { PageHeading } from "@/components/layout/page-heading";
import { getClerkUserNames } from "@/lib/server/clerk";

type Props = {
  params: Promise<{ uuid: string }>;
};

const PurchaseReceivalDetailPage = async ({ params }: Props) => {
  const { uuid } = await params;

  const receival = await getPurchaseReceivalDetail(uuid);

  if (!receival) {
    notFound();
  }

  // These columns store a Clerk id; Clerk owns the names.

  const userNames = await getClerkUserNames();

  return (
    <div className="space-y-4">
      <div>
        <Link
          href="/purchase-receivals"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Purchase Receivals
        </Link>
      </div>
      <PageHeading
        title={
          [receival.productCode, receival.productName]
            .filter(Boolean)
            .join(" — ") || `Receipt #${receival.id}`
        }
      />
      <PurchaseReceivalDetailView receival={receival}  userNames={userNames} />
    </div>
  );
};

export default PurchaseReceivalDetailPage;
