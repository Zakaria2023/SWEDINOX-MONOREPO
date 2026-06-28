import { getProductGroups } from "@/app/(dashboard)/product-groups/actions";
import { ProductGroupsTableContent } from "./product-groups-table-content";

export const ProductGroupsTable = async () => {
  const productGroups = await getProductGroups();
  return <ProductGroupsTableContent productGroups={productGroups} />;
};
