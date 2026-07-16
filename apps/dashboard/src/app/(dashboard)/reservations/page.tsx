import { getReservations } from "@/app/(dashboard)/reservations/actions";
import { ReservationsTable } from "@/components/reservations/reservations-table-content";
import { PageHeading } from "@/components/layout/page-heading";

const ReservationsPage = async () => {
  const reservations = await getReservations();

  return (
    <div className="space-y-6 p-6">
      <PageHeading
        title="Reservations"
        description="Technical stock and what open sales orders reserve, per product"
      />
      <ReservationsTable reservations={reservations} />
    </div>
  );
};

export default ReservationsPage;
