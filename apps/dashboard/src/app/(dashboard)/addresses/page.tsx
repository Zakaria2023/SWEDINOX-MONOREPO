import { AddressesTable } from "@/components/addresses/addresses-table";
import { PageHeading } from "@/components/layout/page-heading";

const AddressesPage = () => {
  return (
    <div className="space-y-6 p-6">
      <PageHeading
        titleKey="addresses-page.title"
        descriptionKey="addresses-page.description"
      />
      <AddressesTable />
    </div>
  );
};

export default AddressesPage;
