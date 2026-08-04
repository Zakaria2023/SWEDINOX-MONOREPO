import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getPurchaseLineDetail } from "@/app/(dashboard)/purchase-lines/actions";
import { PurchaseLineDetailView } from "@/components/purchase-lines/purchase-line-detail";
import { PageHeading } from "@/components/layout/page-heading";

type Props = {
  params: Promise<{ uuid: string }>;
};

const PurchaseLineDetailPage = async ({ params }: Props) => {
  const { uuid } = await params;

  const line = await getPurchaseLineDetail(uuid);

  if (!line) {
    notFound();
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <Link
          href="/purchase-lines"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Purchase Lines
        </Link>
      </div>
      <PageHeading
        title={
          line.purchaseOrderId === null
            ? `Line #${line.id}`
            : `Purchase #${line.purchaseOrderId} — line ${line.lineNumber ?? "?"}`
        }
        description={
          [line.productCode, line.productName].filter(Boolean).join(" — ") ||
          undefined
        }
      />
      <PurchaseLineDetailView line={line} />
    </div>
  );
};

export default PurchaseLineDetailPage;
