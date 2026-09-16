import { getOptionRevenue } from "@/app/(dashboard)/options/actions";
import { GenerateOptionChargesButton } from "@/components/options/generate-option-charges-button";
import { OptionsTable } from "@/components/options/options-table-content";

const OptionsPage = async () => {
  const rows = await getOptionRevenue();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-end gap-4">
        <GenerateOptionChargesButton />
      </div>
      <OptionsTable rows={rows} />
    </div>
  );
};

export default OptionsPage;
