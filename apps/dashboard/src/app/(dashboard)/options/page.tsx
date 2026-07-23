import { getOptionRevenue } from "@/app/(dashboard)/options/actions";
import { PageHeading } from "@/components/layout/page-heading";
import { GenerateOptionChargesButton } from "@/components/options/generate-option-charges-button";
import { OptionRevenueFilter } from "@/components/options/option-revenue-filter";
import { OptionsTable } from "@/components/options/options-table-content";

type Props = {
  searchParams: Promise<{ createdFrom?: string; createdUntil?: string }>;
};

const OptionsPage = async ({ searchParams }: Props) => {
  const { createdFrom, createdUntil } = await searchParams;
  const rows = await getOptionRevenue({ createdFrom, createdUntil });

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeading
          title="Options"
          description="Revenue and profit per processing option, split by revenue group and line status"
        />
        <GenerateOptionChargesButton />
      </div>
      <OptionRevenueFilter
        createdFrom={createdFrom}
        createdUntil={createdUntil}
      />
      <OptionsTable rows={rows} />
    </div>
  );
};

export default OptionsPage;
