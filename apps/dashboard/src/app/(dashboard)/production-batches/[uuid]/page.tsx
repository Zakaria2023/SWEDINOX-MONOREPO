import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getProductionBatchDetail } from "@/app/(dashboard)/production-batches/actions";
import { ProductionBatchDetailView } from "@/components/production-batches/production-batch-detail";
import { PageHeading } from "@/components/layout/page-heading";

type Props = {
  params: Promise<{ uuid: string }>;
};

const ProductionBatchDetailPage = async ({ params }: Props) => {
  const { uuid } = await params;

  const batch = await getProductionBatchDetail(uuid);

  if (!batch) {
    notFound();
  }

  return (
    <div className="space-y-4">
      <div>
        <Link
          href="/production-batches"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Production Batches
        </Link>
      </div>
      <PageHeading title={batch.code} />
      <ProductionBatchDetailView batch={batch} />
    </div>
  );
};

export default ProductionBatchDetailPage;
