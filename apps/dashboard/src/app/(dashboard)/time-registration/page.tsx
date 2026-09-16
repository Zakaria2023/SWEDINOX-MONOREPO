import { getTimeRegistrations } from "@/app/(dashboard)/time-registration/actions";
import { TimeRegistrationsTable } from "@/components/time-registration/time-registrations-table-content";

const TimeRegistrationPage = async () => {
  const registrations = await getTimeRegistrations();

  return (
    <div className="space-y-4">
      <TimeRegistrationsTable registrations={registrations} />
    </div>
  );
};

export default TimeRegistrationPage;
