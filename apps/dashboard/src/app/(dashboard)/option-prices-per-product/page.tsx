import { getOptionPrices } from "@/app/(dashboard)/option-prices-per-product/actions";
import { GenerateOptionPricesButton } from "@/components/option-prices-per-product/generate-option-prices-button";
import { NewOptionDialog } from "@/components/option-prices-per-product/new-option-dialog";
import { OptionPricesTable } from "@/components/option-prices-per-product/option-prices-table-content";

const OptionPricesPerProductPage = async () => {
  const rows = await getOptionPrices();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-end gap-4">
        <div className="flex items-start gap-3">
          <NewOptionDialog />
          <GenerateOptionPricesButton />
        </div>
      </div>
      <OptionPricesTable rows={rows} />
    </div>
  );
};

export default OptionPricesPerProductPage;
