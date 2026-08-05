import { getSoldProductsNotAdvised } from "@/app/(dashboard)/sold-products-not-advised/actions";
import { SoldProductsNotAdvisedTable } from "@/components/sold-products-not-advised/sold-products-not-advised-table-content";
import { PageHeading } from "@/components/layout/page-heading";

const SoldProductsNotAdvisedPage = async () => {
  const rows = await getSoldProductsNotAdvised();

  return (
    <div className="space-y-6 p-6">
      <PageHeading title="Sold products not on the order recommendation" />
      <SoldProductsNotAdvisedTable rows={rows} />
    </div>
  );
};

export default SoldProductsNotAdvisedPage;
