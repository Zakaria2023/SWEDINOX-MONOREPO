import { getProducts } from "@/app/(dashboard)/products/actions";
import { ProductsTableContent } from "./products-table-content";

export const ProductsTable = async () => {
  const products = await getProducts();
  return <ProductsTableContent products={products} />;
};
