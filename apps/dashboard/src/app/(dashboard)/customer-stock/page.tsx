import { getCustomerStock } from "@/app/(dashboard)/customer-stock/actions";
import { CustomerStockTable } from "@/components/customer-stock/customer-stock-table-content";
import { PageHeading } from "@/components/layout/page-heading";

const CustomerStockPage = async () => {
  const stock = await getCustomerStock();

  return (
    <div className="space-y-6 p-6">
      <PageHeading
        title="Customer stock on location"
        description="Consignment stock held at our locations but owned by a customer or supplier"
      />
      <CustomerStockTable stock={stock} />
    </div>
  );
};

export default CustomerStockPage;
