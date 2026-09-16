import { getRevenuePerProduct } from "@/app/(dashboard)/revenue-per-product/actions";
import { RevenuePerProductTable } from "@/components/revenue-per-product/revenue-per-product-table-content";

const RevenuePerProductPage = async () => {
  const rows = await getRevenuePerProduct();

  return (
    <div className="space-y-4">
      <RevenuePerProductTable rows={rows} />
    </div>
  );
};

export default RevenuePerProductPage;
