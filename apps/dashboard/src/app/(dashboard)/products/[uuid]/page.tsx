import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductDetail } from "@/app/(dashboard)/products/actions";
import { PageHeading } from "@/components/layout/page-heading";
import { ProductDetailView } from "@/components/products/product-detail";

type Props = {
  params: Promise<{ uuid: string }>;
};

const ProductDetailPage = async ({ params }: Props) => {
  const { uuid } = await params;

  const product = await getProductDetail(uuid);

  if (!product) {
    notFound();
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <Link
          href="/products"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Products
        </Link>
      </div>
      <PageHeading title={product.productCode} description={product.name} />
      <ProductDetailView product={product} />
    </div>
  );
};

export default ProductDetailPage;
