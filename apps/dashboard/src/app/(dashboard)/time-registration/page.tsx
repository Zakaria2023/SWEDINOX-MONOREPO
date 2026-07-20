import { getTimeRegistrations } from "@/app/(dashboard)/time-registration/actions";
import { TimeRegistrationsTable } from "@/components/time-registration/time-registrations-table-content";
import { PageHeading } from "@/components/layout/page-heading";

const TimeRegistrationPage = async () => {
  const registrations = await getTimeRegistrations();

  return (
    <div className="space-y-6 p-6">
      <PageHeading
        title="Time Registration"
        description="Shop-floor scan events — who scanned what, and the context and action each scan belongs to"
      />
      <TimeRegistrationsTable registrations={registrations} />
    </div>
  );
};

export default TimeRegistrationPage;
