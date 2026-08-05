import { getLocationForEdit } from "@/app/(dashboard)/locations/actions";
import { locationToEditValues } from "@/app/(dashboard)/locations/mappers";
import { PageHeading } from "@/components/layout/page-heading";
import { LocationEditForm } from "@/components/locations/location-edit-form";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ uuid: string }>;
};

const EditLocationPage = async ({ params }: Props) => {
  const { uuid } = await params;
  const location = await getLocationForEdit(uuid);

  if (!location) {
    notFound();
  }

  return (
    <div className="space-y-4">
      <div>
        <Link
          href="/locations"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Locations
        </Link>
      </div>
      <PageHeading title={`Edit ${location.name}`} />
      <LocationEditForm
        locationUuid={uuid}
        defaultValues={locationToEditValues(location)}
      />
    </div>
  );
};

export default EditLocationPage;
