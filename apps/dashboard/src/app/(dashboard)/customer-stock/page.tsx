import { getCustomerStock } from "@/app/(dashboard)/customer-stock/actions";
import { CustomerStockTable } from "@/components/customer-stock/customer-stock-table-content";

const CustomerStockPage = async () => {
  const stock = await getCustomerStock();

  return (
    <div className="space-y-4">
      <CustomerStockTable stock={stock} />
    </div>
  );
};

export default CustomerStockPage;
