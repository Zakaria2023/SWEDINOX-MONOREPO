import { parseTableQuery, SearchParams } from "@/lib/table-query";
import { getOptionPrices } from "@/app/(dashboard)/option-prices-per-product/actions";
import { GenerateOptionPricesButton } from "@/components/option-prices-per-product/generate-option-prices-button";
import { NewOptionDialog } from "@/components/option-prices-per-product/new-option-dialog";
import { OptionPricesTable } from "@/components/option-prices-per-product/option-prices-table-content";

type Props = {
  searchParams: Promise<SearchParams>;
};

const OptionPricesPerProductPage = async ({ searchParams }: Props) => {
  const query = parseTableQuery(await searchParams);
  const rows = await getOptionPrices(query);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-end gap-4">
        <div className="flex items-start gap-3">
          <NewOptionDialog />
          <GenerateOptionPricesButton />
        </div>
      </div>
      <OptionPricesTable page={rows} />
    </div>
  );
};

export default OptionPricesPerProductPage;
