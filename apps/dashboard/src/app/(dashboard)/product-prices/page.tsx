import { getProductPrices } from "@/app/(dashboard)/product-prices/actions";
import { PageHeading } from "@/components/layout/page-heading";
import { ProductPriceFilter } from "@/components/product-prices/product-price-filter";
import { ProductPricesTable } from "@/components/product-prices/product-prices-table-content";
import { RecalculatePricesButton } from "@/components/product-prices/recalculate-prices-button";

type Props = {
  searchParams: Promise<{
    codeFrom?: string;
    codeTo?: string;
    priceDateFrom?: string;
  }>;
};

const ProductPricesPage = async ({ searchParams }: Props) => {
  const { codeFrom, codeTo, priceDateFrom } = await searchParams;
  const rows = await getProductPrices({ codeFrom, codeTo, priceDateFrom });

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeading
          title="Product prices"
          description="What every product costs to re-buy and what it is sold at"
        />
        <RecalculatePricesButton />
      </div>
      <ProductPriceFilter
        codeFrom={codeFrom}
        codeTo={codeTo}
        priceDateFrom={priceDateFrom}
      />
      <ProductPricesTable rows={rows} />
    </div>
  );
};

export default ProductPricesPage;
