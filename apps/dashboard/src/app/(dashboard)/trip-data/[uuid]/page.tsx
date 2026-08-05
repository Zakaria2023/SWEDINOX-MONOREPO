import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getTripDataDetail } from "@/app/(dashboard)/trip-data/actions";
import { TripDataDetailView } from "@/components/trip-data/trip-data-detail";
import { PageHeading } from "@/components/layout/page-heading";

type Props = {
  params: Promise<{ uuid: string }>;
};

const TripDataDetailPage = async ({ params }: Props) => {
  const { uuid } = await params;

  const trip = await getTripDataDetail(uuid);

  if (!trip) {
    notFound();
  }

  return (
    <div className="space-y-4">
      <div>
        <Link
          href="/trip-data"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Trip Data
        </Link>
      </div>
      <PageHeading
        title={
          trip.tripNumber === null
            ? `Trip #${trip.id}`
            : `Trip ${trip.tripNumber}`
        }
      />
      <TripDataDetailView trip={trip} />
    </div>
  );
};

export default TripDataDetailPage;
