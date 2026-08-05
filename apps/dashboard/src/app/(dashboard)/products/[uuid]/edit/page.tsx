import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSuppliersForSelect } from "@/app/(dashboard)/companies/actions";
import { getLocationsForSelect } from "@/app/(dashboard)/locations/actions";
import { getProductGroupsForSelect } from "@/app/(dashboard)/product-groups/actions";
import {
  getProductDetail,
  getProductsForSelect,
  getRevenueGroupsForSelect,
} from "@/app/(dashboard)/products/actions";
import { productDetailToFormValues } from "@/app/(dashboard)/products/mappers";
import { PageHeading } from "@/components/layout/page-heading";
import { ProductForm } from "@/components/products/product-form";

type Props = {
  params: Promise<{ uuid: string }>;
};

const EditProductPage = async ({ params }: Props) => {
  const { uuid } = await params;

  const [
    product,
    productGroups,
    suppliers,
    products,
    locations,
    revenueGroups,
  ] = await Promise.all([
    getProductDetail(uuid),
    getProductGroupsForSelect(),
    getSuppliersForSelect(),
    getProductsForSelect(),
    getLocationsForSelect(),
    getRevenueGroupsForSelect(),
  ]);

  if (!product) {
    notFound();
  }

  return (
    <div className="space-y-4">
      <div>
        <Link
          href={`/products/${uuid}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          {product.productCode}
        </Link>
      </div>
      <PageHeading title={`Edit ${product.productCode}`} />
      <ProductForm
        productGroups={productGroups}
        suppliers={suppliers}
        products={products}
        locations={locations}
        revenueGroups={revenueGroups}
        productUuid={uuid}
        defaultValues={productDetailToFormValues(product)}
      />
    </div>
  );
};

export default EditProductPage;
