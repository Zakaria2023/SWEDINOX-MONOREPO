import { getCustomerStock } from "@/app/(dashboard)/customer-stock/actions";
import { CustomerStockTable } from "@/components/customer-stock/customer-stock-table-content";
import { PageHeading } from "@/components/layout/page-heading";

const CustomerStockPage = async () => {
  const stock = await getCustomerStock();

  return (
    <div className="space-y-4">
      <PageHeading title="Customer stock on location" />
      <CustomerStockTable stock={stock} />
    </div>
  );
};

export default CustomerStockPage;
