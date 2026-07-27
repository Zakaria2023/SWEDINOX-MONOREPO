import { getCustomerRevenuePerProductGroup } from "@/app/(dashboard)/customer-revenue-per-product-group/actions";
import { CustomerRevenuePerProductGroupTable } from "@/components/customer-revenue-per-product-group/customer-revenue-per-product-group-table-content";
import { PageHeading } from "@/components/layout/page-heading";

const CustomerRevenuePerProductGroupPage = async () => {
  const rows = await getCustomerRevenuePerProductGroup();

  return (
    <div className="space-y-6 p-6">
      <PageHeading
        title="Customer revenue per product group"
        description="Sales turnover per customer and product group by invoice period"
      />
      <CustomerRevenuePerProductGroupTable rows={rows} />
    </div>
  );
};

export default CustomerRevenuePerProductGroupPage;
