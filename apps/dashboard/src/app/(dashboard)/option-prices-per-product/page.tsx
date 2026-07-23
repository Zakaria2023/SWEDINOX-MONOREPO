import { getOptionPrices } from "@/app/(dashboard)/option-prices-per-product/actions";
import { PageHeading } from "@/components/layout/page-heading";
import { GenerateOptionPricesButton } from "@/components/option-prices-per-product/generate-option-prices-button";
import { NewOptionDialog } from "@/components/option-prices-per-product/new-option-dialog";
import { OptionPriceFilter } from "@/components/option-prices-per-product/option-price-filter";
import { OptionPricesTable } from "@/components/option-prices-per-product/option-prices-table-content";

type Props = {
  searchParams: Promise<{ codeFrom?: string; codeTo?: string }>;
};

const OptionPricesPerProductPage = async ({ searchParams }: Props) => {
  const { codeFrom, codeTo } = await searchParams;
  const rows = await getOptionPrices({ codeFrom, codeTo });

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeading
          title="Option prices per product"
          description="What each processing option costs on each product, and from when"
        />
        <div className="flex items-start gap-3">
          <NewOptionDialog />
          <GenerateOptionPricesButton />
        </div>
      </div>
      <OptionPriceFilter codeFrom={codeFrom} codeTo={codeTo} />
      <OptionPricesTable rows={rows} />
    </div>
  );
};

export default OptionPricesPerProductPage;
