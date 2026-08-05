import { getSuppliersForSelect } from "@/app/(dashboard)/companies/actions";
import { getLocationsForSelect } from "@/app/(dashboard)/locations/actions";
import { getProductGroupsForSelect } from "@/app/(dashboard)/product-groups/actions";
import {
  getProductsForSelect,
  getRevenueGroupsForSelect,
} from "@/app/(dashboard)/products/actions";
import { PageHeading } from "@/components/layout/page-heading";
import { ProductForm } from "@/components/products/product-form";

const NewProductPage = async () => {
  const [productGroups, suppliers, products, locations, revenueGroups] =
    await Promise.all([
      getProductGroupsForSelect(),
      getSuppliersForSelect(),
      getProductsForSelect(),
      getLocationsForSelect(),
      getRevenueGroupsForSelect(),
    ]);

  return (
    <div className="space-y-4">
      <PageHeading title="Add Product" />
      <ProductForm
        productGroups={productGroups}
        suppliers={suppliers}
        products={products}
        locations={locations}
        revenueGroups={revenueGroups}
      />
    </div>
  );
};

export default NewProductPage;
