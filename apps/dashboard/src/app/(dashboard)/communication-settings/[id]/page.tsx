import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getCommunicationSettingDetail } from "@/app/(dashboard)/communication-settings/actions";
import { CommunicationSettingDetailView } from "@/components/communication-settings/communication-setting-detail";
import { PageHeading } from "@/components/layout/page-heading";
import { COMMUNICATION_SETTING_DOCUMENT_TYPE_LABELS } from "@/lib/labels";

type Props = {
  params: Promise<{ id: string }>;
};

// `CommunicationSettings` has no uuid column, so the route is keyed by its
// autoincrement id. A non-numeric param is a 404 rather than a query on NaN.
const CommunicationSettingDetailPage = async ({ params }: Props) => {
  const { id } = await params;
  const numericId = Number(id);

  if (!Number.isInteger(numericId)) {
    notFound();
  }

  const setting = await getCommunicationSettingDetail(numericId);

  if (!setting) {
    notFound();
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <Link
          href="/communication-settings"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Communication Settings
        </Link>
      </div>
      <PageHeading
        title={COMMUNICATION_SETTING_DOCUMENT_TYPE_LABELS[setting.documentType]}
      />
      <CommunicationSettingDetailView setting={setting} />
    </div>
  );
};

export default CommunicationSettingDetailPage;
