import { getProductGroups } from "@/app/(dashboard)/product-groups/actions";
import { ProductGroupsTable } from "@/components/product-groups/product-groups-table-content";

const ProductGroupsPage = async () => {
  const productGroups = await getProductGroups();

  return <ProductGroupsTable productGroups={productGroups} />;
};

export default ProductGroupsPage;
