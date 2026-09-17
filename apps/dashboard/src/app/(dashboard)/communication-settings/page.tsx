import { getCommunicationSettings } from "@/app/(dashboard)/communication-settings/actions";
import { communicationSettingFilters } from "@/app/(dashboard)/communication-settings/filters";
import { getCompaniesForSelect } from "@/app/(dashboard)/companies/actions";
import { CommunicationSettingsTable } from "@/components/communication-settings/communication-settings-table-content";
import { parseTableQuery, SearchParams } from "@/lib/table-query";

type Props = {
  searchParams: Promise<SearchParams>;
};

const CommunicationSettingsPage = async ({ searchParams }: Props) => {
  const query = parseTableQuery(await searchParams);
  const page = await getCommunicationSettings(query);
  const companies = await getCompaniesForSelect();

  return (
    <div className="space-y-4">
      <CommunicationSettingsTable
        page={page}
        filters={communicationSettingFilters(companies)}
      />
    </div>
  );
};

export default CommunicationSettingsPage;
