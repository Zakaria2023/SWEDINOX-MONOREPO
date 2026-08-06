import Link from "next/link";
import { CommunicationSettingDetail } from "@/app/(dashboard)/communication-settings/actions";
import { DetailField } from "@/components/ui/detail-field";
import { formatDateValue, userName } from "@/lib/helpers";
import {
  COMMUNICATION_SETTING_DOCUMENT_TYPE_LABELS,
  COMMUNICATION_SETTING_SHAPE_LABELS,
  COMMUNICATION_SETTING_TYPE_LABELS,
} from "@/lib/labels";

type Props = {
  /** Clerk id -> name; these columns store the id, not the name. */
  userNames: Record<string, string>;
  setting: CommunicationSettingDetail;
};

export const CommunicationSettingDetailView = ({
  setting,
  userNames,
}: Props) => (
  <div className="space-y-6">
    <section className="space-y-4">
      <h2 className="border-b pb-2 text-base font-semibold">Setting</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Company
          </p>
          {setting.companyName ? (
            <Link
              href={`/companies/${setting.companyUuid}`}
              className="text-sm text-primary hover:underline"
            >
              {setting.companyName}
            </Link>
          ) : (
            <p className="text-sm">—</p>
          )}
        </div>
        <DetailField label="Company code" value={setting.companyId} />
        <DetailField
          label="Document type"
          value={
            COMMUNICATION_SETTING_DOCUMENT_TYPE_LABELS[setting.documentType]
          }
        />
        <DetailField
          label="Communication type"
          value={COMMUNICATION_SETTING_TYPE_LABELS[setting.communicationType]}
        />
        <DetailField
          label="Shape"
          value={
            setting.shape
              ? COMMUNICATION_SETTING_SHAPE_LABELS[setting.shape]
              : null
          }
        />
        <DetailField label="Email" value={setting.email} />
        <DetailField label="Fax" value={setting.fax} />
        <DetailField
          label="Modified by"
          value={userName(setting.modifiedByUserId, userNames)}
        />
        <DetailField
          label="Created"
          value={formatDateValue(setting.createdAt)}
        />
        <DetailField
          label="Last modified"
          value={formatDateValue(setting.updatedAt)}
        />
      </div>
    </section>
  </div>
);
