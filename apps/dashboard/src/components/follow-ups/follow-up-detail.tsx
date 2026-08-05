import Link from "next/link";
import { FollowUpDetail } from "@/app/(dashboard)/follow-ups/actions";
import { DetailField } from "@/components/ui/detail-field";
import { formatDateValue, yesNo } from "@/lib/helpers";

type Props = {
  followUp: FollowUpDetail;
};

export const FollowUpDetailView = ({ followUp }: Props) => (
  <div className="space-y-6">
    <section className="space-y-4">
      <h2 className="border-b pb-2 text-base font-semibold">Follow-up</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Company
          </p>
          {followUp.companyName ? (
            <Link
              href={`/companies/${followUp.companyUuid}`}
              className="text-sm text-primary hover:underline"
            >
              {followUp.companyName}
            </Link>
          ) : (
            <p className="text-sm">—</p>
          )}
        </div>
        <DetailField label="Company code" value={followUp.companyId} />
        <DetailField label="Date" value={followUp.date} />
        <DetailField label="By" value={followUp.by} />
        <DetailField
          label="Contact person"
          value={followUp.contactPerson}
        />
        <DetailField label="Completed" value={yesNo(followUp.completed)} />
        <DetailField
          label="Created"
          value={formatDateValue(followUp.createdAt)}
        />
        <DetailField
          label="Last modified"
          value={formatDateValue(followUp.updatedAt)}
        />
      </div>
    </section>

    <section className="space-y-4">
      <h2 className="border-b pb-2 text-base font-semibold">Note</h2>
      <p className="rounded-lg border bg-muted/30 p-4 text-sm whitespace-pre-wrap">
        {followUp.text ?? "No note was recorded."}
      </p>
    </section>
  </div>
);
