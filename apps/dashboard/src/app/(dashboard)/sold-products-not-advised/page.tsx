import { getSoldProductsNotAdvised } from "@/app/(dashboard)/sold-products-not-advised/actions";
import { SoldProductsNotAdvisedTable } from "@/components/sold-products-not-advised/sold-products-not-advised-table-content";

const SoldProductsNotAdvisedPage = async () => {
  const rows = await getSoldProductsNotAdvised();

  return (
    <div className="space-y-4">
      <SoldProductsNotAdvisedTable rows={rows} />
    </div>
  );
};

export default SoldProductsNotAdvisedPage;
