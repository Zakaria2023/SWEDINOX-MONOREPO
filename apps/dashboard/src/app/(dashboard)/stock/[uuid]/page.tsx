import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getStockDetail } from "@/app/(dashboard)/stock/actions";
import { StockDetailView } from "@/components/stock/stock-detail";
import { PageHeading } from "@/components/layout/page-heading";

type Props = {
  params: Promise<{ uuid: string }>;
};

const StockDetailPage = async ({ params }: Props) => {
  const { uuid } = await params;

  const stock = await getStockDetail(uuid);

  if (!stock) {
    notFound();
  }

  return (
    <div className="space-y-4">
      <div>
        <Link
          href="/stock"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Stock
        </Link>
      </div>
      <PageHeading
        title={[stock.productCode, stock.productName]
          .filter(Boolean)
          .join(" — ")}
      />
      <StockDetailView stock={stock} />
    </div>
  );
};

export default StockDetailPage;
