import { getProductionWorkOrderLines } from "@/app/(dashboard)/production-workorders/actions";
import { ProductionWorkOrdersTable } from "@/components/production-workorders/production-workorders-table-content";
import { PageHeading } from "@/components/layout/page-heading";

const ProductionWorkOrdersPage = async () => {
  const lines = await getProductionWorkOrderLines();

  return (
    <div className="space-y-6 p-6">
      <PageHeading
        title="Production workorders"
        description="Machine processing lines to run, grouped by machine and option"
      />
      <ProductionWorkOrdersTable lines={lines} />
    </div>
  );
};

export default ProductionWorkOrdersPage;
