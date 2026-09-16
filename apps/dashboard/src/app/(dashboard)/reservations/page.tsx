import {
  getReservationRecords,
  getReservations,
} from "@/app/(dashboard)/reservations/actions";
import { ReservationsTable } from "@/components/reservations/reservations-table-content";
import { ReservationRecordsTable } from "@/components/reservations/reservation-records-table-content";

const ReservationsPage = async () => {
  const [records, reservations] = await Promise.all([
    getReservationRecords(),
    getReservations(),
  ]);

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <ReservationRecordsTable records={records} />
      </div>

      <div className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">
          Technical stock vs. reserved, per product
        </h2>
        <ReservationsTable reservations={reservations} />
      </div>
    </div>
  );
};

export default ReservationsPage;
