import { getProducts } from "@/app/(dashboard)/products/actions";
import { productFilters } from "@/app/(dashboard)/products/filters";
import { getProductGroupsForSelect } from "@/app/(dashboard)/product-groups/actions";
import { getCompaniesForSelect } from "@/app/(dashboard)/companies/actions";
import { parseTableQuery, SearchParams } from "@/lib/table-query";
import { ProductsTable } from "@/components/products/products-table-content";

type Props = {
  searchParams: Promise<SearchParams>;
};

const ProductsPage = async ({ searchParams }: Props) => {
  const query = parseTableQuery(await searchParams);
  // Sequential rather than concurrent: this database caps connections.
  const products = await getProducts(query);
  const productGroups = await getProductGroupsForSelect();
  const companies = await getCompaniesForSelect();

  return (
    <ProductsTable
      page={products}
      filters={productFilters(productGroups, companies)}
    />
  );
};

export default ProductsPage;
