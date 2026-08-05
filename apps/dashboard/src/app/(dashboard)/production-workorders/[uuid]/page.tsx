import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getProductionWorkOrderLineDetail } from "@/app/(dashboard)/production-workorders/actions";
import { ProductionWorkOrderLineDetailView } from "@/components/production-workorders/production-work-order-line-detail";
import { PageHeading } from "@/components/layout/page-heading";

type Props = {
  params: Promise<{ uuid: string }>;
};

const ProductionWorkOrderLinePage = async ({ params }: Props) => {
  const { uuid } = await params;

  const line = await getProductionWorkOrderLineDetail(uuid);

  if (!line) {
    notFound();
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <Link
          href="/production-workorders"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Production Workorders
        </Link>
      </div>
      <PageHeading
        title={
          [line.productCode ?? line.catalogProductCode, line.productName]
            .filter(Boolean)
            .join(" — ") || `Line #${line.id}`
        }
      />
      <ProductionWorkOrderLineDetailView line={line} />
    </div>
  );
};

export default ProductionWorkOrderLinePage;
