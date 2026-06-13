import { getLocationsForTree } from "@/app/(dashboard)/locations/actions";
import { SubLocationForm } from "@/components/locations/sub-location-form";
import { PageHeading } from "@/components/layout/page-heading";

const AddSubLocationPage = async () => {
  const locations = await getLocationsForTree();

  return (
    <div className="max-w-4xl space-y-6 p-6">
      <PageHeading
        titleKey="locations-add-sub-page.title"
        descriptionKey="locations-add-sub-page.description"
      />
      <SubLocationForm locations={locations} />
    </div>
  );
};

export default AddSubLocationPage;
