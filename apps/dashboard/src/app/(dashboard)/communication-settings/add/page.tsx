import {
  getCompaniesForSelect,
  getContractsForSelect,
} from "@/app/(dashboard)/communication-settings/actions";
import { CommunicationSettingForm } from "@/components/communication-settings/communication-setting-form";
import { PageHeading } from "@/components/layout/page-heading";

const AddCommunicationSettingPage = async () => {
  const [companies, contacts] = await Promise.all([
    getCompaniesForSelect(),
    getContractsForSelect(),
  ]);

  return (
    <div className="max-w-4xl space-y-6 p-6">
      <PageHeading
        titleKey="communication-settings-add-page.title"
        descriptionKey="communication-settings-add-page.description"
      />
      <CommunicationSettingForm companies={companies} contacts={contacts} />
    </div>
  );
};

export default AddCommunicationSettingPage;
