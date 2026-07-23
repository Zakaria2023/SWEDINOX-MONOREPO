import { getNetPrices } from "@/app/(dashboard)/net-prices/actions";
import { PageHeading } from "@/components/layout/page-heading";
import { GenerateNetPricesButton } from "@/components/net-prices/generate-net-prices-button";
import { NetPriceFilter } from "@/components/net-prices/net-price-filter";
import { NetPricesTable } from "@/components/net-prices/net-prices-table-content";

type Props = {
  searchParams: Promise<{
    contractCodeFrom?: string;
    contractCodeTo?: string;
    validFrom?: string;
    validUntil?: string;
    companyCode?: string;
  }>;
};

const NetPricesPage = async ({ searchParams }: Props) => {
  const {
    contractCodeFrom,
    contractCodeTo,
    validFrom,
    validUntil,
    companyCode,
  } = await searchParams;
  const rows = await getNetPrices({
    contractCodeFrom,
    contractCodeTo,
    validFrom,
    validUntil,
    companyCode: companyCode ? Number(companyCode) : undefined,
  });

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeading
          title="Net prices"
          description="What each contract customer actually pays per product, per quantity break"
        />
        <GenerateNetPricesButton />
      </div>
      <NetPriceFilter
        contractCodeFrom={contractCodeFrom}
        contractCodeTo={contractCodeTo}
        validFrom={validFrom}
        validUntil={validUntil}
        companyCode={companyCode}
      />
      <NetPricesTable rows={rows} />
    </div>
  );
};

export default NetPricesPage;
