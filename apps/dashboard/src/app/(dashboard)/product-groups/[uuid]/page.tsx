import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getProductGroupDetail } from "@/app/(dashboard)/product-groups/actions";
import { ProductGroupDetailView } from "@/components/product-groups/product-group-detail";
import { PageHeading } from "@/components/layout/page-heading";

type Props = {
  params: Promise<{ uuid: string }>;
};

const ProductGroupDetailPage = async ({ params }: Props) => {
  const { uuid } = await params;

  const group = await getProductGroupDetail(uuid);

  if (!group) {
    notFound();
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <Link
          href="/product-groups"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Product Groups
        </Link>
      </div>
      <PageHeading title={group.name} />
      <ProductGroupDetailView group={group} />
    </div>
  );
};

export default ProductGroupDetailPage;
