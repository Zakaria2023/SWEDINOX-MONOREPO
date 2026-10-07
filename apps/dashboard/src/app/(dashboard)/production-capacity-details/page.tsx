import { getProductionCapacityDetails } from "@/app/(dashboard)/production-capacity-details/actions";
import { ProductionCapacityDetailsTable } from "@/components/production-capacity-details/production-capacity-details-table-content";
import { parseTableQuery, SearchParams } from "@/lib/table-query";

type Props = {
  searchParams: Promise<SearchParams>;
};

const ProductionCapacityDetailsPage = async ({ searchParams }: Props) => {
  const page = await getProductionCapacityDetails(
    parseTableQuery(await searchParams),
  );

  return (
    <div className="space-y-4">
      <ProductionCapacityDetailsTable page={page} filters={[]} />
    </div>
  );
};

export default ProductionCapacityDetailsPage;
