import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getAddressDistanceDetail } from "@/app/(dashboard)/address-distances/actions";
import { AddressDistanceDetailView } from "@/components/address-distances/address-distance-detail";
import { PageHeading } from "@/components/layout/page-heading";
import { formatNumber } from "@/lib/helpers";

type Props = {
  params: Promise<{ uuid: string }>;
};

const AddressDistanceDetailPage = async ({ params }: Props) => {
  const { uuid } = await params;

  const distance = await getAddressDistanceDetail(uuid);

  if (!distance) {
    notFound();
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <Link
          href="/address-distances"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Address Distances
        </Link>
      </div>
      <PageHeading
        title={
          [distance.city, distance.country].filter(Boolean).join(", ") ||
          "Distance"
        }
        description={
          distance.km === null
            ? undefined
            : `${formatNumber(Number(distance.km))} km`
        }
      />
      <AddressDistanceDetailView distance={distance} />
    </div>
  );
};

export default AddressDistanceDetailPage;
