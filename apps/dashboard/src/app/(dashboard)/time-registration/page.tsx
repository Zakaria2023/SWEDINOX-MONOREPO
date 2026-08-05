import { getTimeRegistrations } from "@/app/(dashboard)/time-registration/actions";
import { TimeRegistrationsTable } from "@/components/time-registration/time-registrations-table-content";
import { PageHeading } from "@/components/layout/page-heading";

const TimeRegistrationPage = async () => {
  const registrations = await getTimeRegistrations();

  return (
    <div className="space-y-6 p-6">
      <PageHeading title="Time Registration" />
      <TimeRegistrationsTable registrations={registrations} />
    </div>
  );
};

export default TimeRegistrationPage;
