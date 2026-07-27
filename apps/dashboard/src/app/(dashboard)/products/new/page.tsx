import { getProductGroupsForSelect } from "@/app/(dashboard)/product-groups/actions";
import { getSuppliersForSelect } from "@/app/(dashboard)/companies/actions";
import { ProductForm } from "@/components/products/product-form";
import { PageHeading } from "@/components/layout/page-heading";

const NewProductPage = async () => {
  const [productGroups, suppliers] = await Promise.all([
    getProductGroupsForSelect(),
    getSuppliersForSelect(),
  ]);

  return (
    <div className="max-w-4xl space-y-6 p-6">
      <PageHeading
        title="Add Product"
        description="Create a new product with all its properties"
      />
      <ProductForm productGroups={productGroups} suppliers={suppliers} />
    </div>
  );
};

export default NewProductPage;
