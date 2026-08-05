import { getOptionPrices } from "@/app/(dashboard)/option-prices-per-product/actions";
import { PageHeading } from "@/components/layout/page-heading";
import { GenerateOptionPricesButton } from "@/components/option-prices-per-product/generate-option-prices-button";
import { NewOptionDialog } from "@/components/option-prices-per-product/new-option-dialog";
import { OptionPricesTable } from "@/components/option-prices-per-product/option-prices-table-content";

const OptionPricesPerProductPage = async () => {
  const rows = await getOptionPrices();

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeading title="Option prices per product" />
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
