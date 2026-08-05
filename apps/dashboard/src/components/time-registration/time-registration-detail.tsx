import { TimeRegistrationListItem } from "@/app/(dashboard)/time-registration/actions";
import { DetailField } from "@/components/ui/detail-field";
import { formatDateValue, formatTimeValue } from "@/lib/helpers";

type Props = {
  registration: TimeRegistrationListItem;
};

export const TimeRegistrationDetailView = ({ registration }: Props) => (
  <div className="space-y-6">
    <section className="space-y-4">
      <h2 className="border-b pb-2 text-base font-semibold">Scan</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <DetailField
          label="Date"
          value={formatDateValue(registration.dateTime)}
        />
        <DetailField
          label="Time"
          value={formatTimeValue(registration.dateTime)}
        />
        <DetailField label="Scan code" value={registration.scanCode} />
        <DetailField label="User" value={registration.user} />
        <DetailField label="Extra user" value={registration.extraUser} />
      </div>
      <p className="text-sm text-muted-foreground">
        The user is a shop-floor scan-login code, not a dashboard account.
      </p>
    </section>

    <section className="space-y-4">
      <h2 className="border-b pb-2 text-base font-semibold">
        Context and action
      </h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <DetailField label="Context" value={registration.context} />
        <DetailField
          label="Context reference"
          value={registration.contextReference}
        />
        <DetailField label="Action" value={registration.action} />
        <DetailField
          label="Action reference"
          value={registration.actionReference}
        />
        <DetailField
          label="Created"
          value={formatDateValue(registration.createdAt)}
        />
        <DetailField
          label="Last modified"
          value={formatDateValue(registration.updatedAt)}
        />
      </div>
    </section>
  </div>
);
