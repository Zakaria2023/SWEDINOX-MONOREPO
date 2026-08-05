import { getRevenuePerProduct } from "@/app/(dashboard)/revenue-per-product/actions";
import { RevenuePerProductTable } from "@/components/revenue-per-product/revenue-per-product-table-content";
import { PageHeading } from "@/components/layout/page-heading";

const RevenuePerProductPage = async () => {
  const rows = await getRevenuePerProduct();

  return (
    <div className="space-y-6 p-6">
      <PageHeading title="Revenue per product" />
      <RevenuePerProductTable rows={rows} />
    </div>
  );
};

export default RevenuePerProductPage;
