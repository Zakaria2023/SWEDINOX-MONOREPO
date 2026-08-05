import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getNetPriceDetail } from "@/app/(dashboard)/net-prices/actions";
import { NetPriceDetailView } from "@/components/net-prices/net-price-detail";
import { PageHeading } from "@/components/layout/page-heading";

type Props = {
  params: Promise<{ uuid: string }>;
};

const NetPriceDetailPage = async ({ params }: Props) => {
  const { uuid } = await params;

  const netPrice = await getNetPriceDetail(uuid);

  if (!netPrice) {
    notFound();
  }

  return (
    <div className="space-y-4">
      <div>
        <Link
          href="/net-prices"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Net Prices
        </Link>
      </div>
      <PageHeading
        title={
          [netPrice.contractCode, netPrice.productCode]
            .filter(Boolean)
            .join(" — ") || `Net price #${netPrice.id}`
        }
      />
      <NetPriceDetailView netPrice={netPrice} />
    </div>
  );
};

export default NetPriceDetailPage;
