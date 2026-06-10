import {
  getCompaniesForSelect,
  getContactsForSelect,
} from "@/app/(dashboard)/communication-settings/actions";
import { CommunicationSettingForm } from "@/components/communication-settings/communication-setting-form";

const AddCommunicationSettingPage = async () => {
  const [companies, contacts] = await Promise.all([
    getCompaniesForSelect(),
    getContactsForSelect(),
  ]);

  return (
    <div className="max-w-4xl space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Add Communication Setting</h1>
        <p className="mt-2 text-gray-600">Create a new communication setting</p>
      </div>
      <CommunicationSettingForm companies={companies} contacts={contacts} />
    </div>
  );
};

export default AddCommunicationSettingPage;
