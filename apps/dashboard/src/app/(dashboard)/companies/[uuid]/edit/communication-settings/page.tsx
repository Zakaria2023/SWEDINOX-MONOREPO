import { CompanyCommunicationSettingsEditor } from "@/components/companies/edit/company-communication-settings-editor";
import { PageHeading } from "@/components/layout/page-heading";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCompanyHeader } from "../contacts/actions";
import { getCompanyCommunicationSettings } from "./actions";

type Props = {
  params: Promise<{ uuid: string }>;
};

const CompanyCommunicationSettingsPage = async ({ params }: Props) => {
  const { uuid } = await params;
  const [company, settings] = await Promise.all([
    getCompanyHeader(uuid),
    getCompanyCommunicationSettings(uuid),
  ]);

  if (!company) {
    notFound();
  }

  return (
    <div className="max-w-4xl space-y-6 p-6">
      <div>
        <Link
          href={`/companies/${uuid}/edit`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Back to edit overview
        </Link>
      </div>
      <PageHeading title={`Communication Settings — ${company.companyName}`} />
      <CompanyCommunicationSettingsEditor
        companyUuid={uuid}
        settings={settings}
      />
    </div>
  );
};

export default CompanyCommunicationSettingsPage;
