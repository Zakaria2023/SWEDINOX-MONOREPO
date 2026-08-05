import { TripDataDetail } from "@/app/(dashboard)/trip-data/actions";
import { DetailField } from "@/components/ui/detail-field";
import {
  formatDateColumn,
  formatDateValue,
  formatFixed2,
} from "@/lib/helpers";

type Props = {
  trip: TripDataDetail;
};

export const TripDataDetailView = ({ trip }: Props) => (
  <div className="space-y-6">
    <section className="space-y-4">
      <h2 className="border-b pb-2 text-base font-semibold">Trip</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <DetailField label="Trip number" value={trip.tripNumber} />
        <DetailField
          label="Trip date"
          value={formatDateColumn(trip.tripDate)}
        />
        <DetailField label="Vehicle" value={trip.vehicle} />
        <DetailField label="Stops" value={trip.stops} />
        <DetailField label="Created" value={formatDateValue(trip.createdAt)} />
        <DetailField
          label="Last modified"
          value={formatDateValue(trip.updatedAt)}
        />
      </div>
      <DetailField label="Orders per stop" value={trip.ordersPerStop} />
    </section>

    <section className="space-y-4">
      <h2 className="border-b pb-2 text-base font-semibold">Load</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <DetailField label="Total kg" value={trip.kg} />
        <DetailField label="Total colli" value={trip.colli} />
        <DetailField
          label="Kg per stop"
          value={
            trip.kgPerStop === null
              ? "No stops recorded"
              : formatFixed2(trip.kgPerStop)
          }
        />
        <DetailField
          label="Colli per stop"
          value={
            trip.colliPerStop === null
              ? "No stops recorded"
              : formatFixed2(trip.colliPerStop)
          }
        />
      </div>
    </section>
  </div>
);
