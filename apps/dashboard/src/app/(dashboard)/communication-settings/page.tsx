import Link from "next/link";
import { CommunicationSettingsTable } from "@/components/communication-settings/communication-settings-table";

const CommunicationSettingsPage = () => (
  <div className="space-y-6 p-6">
    <div className="flex items-start justify-between">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Communication Settings</h1>
        <p className="mt-2 text-gray-600">Manage communication settings per company and document type</p>
      </div>
      <Link
        href="/communication-settings/add"
        className="inline-flex h-8 items-center justify-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
      >
        New Setting
      </Link>
    </div>

    <CommunicationSettingsTable />
  </div>
);

export default CommunicationSettingsPage;
