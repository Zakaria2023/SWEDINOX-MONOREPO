import { getOptionRevenue } from "@/app/(dashboard)/options/actions";
import { PageHeading } from "@/components/layout/page-heading";
import { GenerateOptionChargesButton } from "@/components/options/generate-option-charges-button";
import { OptionsTable } from "@/components/options/options-table-content";

const OptionsPage = async () => {
  const rows = await getOptionRevenue();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeading title="Options" />
        <GenerateOptionChargesButton />
      </div>
      <OptionsTable rows={rows} />
    </div>
  );
};

export default OptionsPage;
