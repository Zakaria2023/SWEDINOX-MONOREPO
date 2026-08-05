import { getCustomersAndProspects } from "@/app/(dashboard)/customers-and-prospects/actions";
import { CustomersAndProspectsTable } from "@/components/customers-and-prospects/customers-and-prospects-table-content";
import { PageHeading } from "@/components/layout/page-heading";

const CustomersAndProspectsPage = async () => {
  const rows = await getCustomersAndProspects();

  return (
    <div className="space-y-4">
      <PageHeading title="Customers and Prospects" />
      <CustomersAndProspectsTable rows={rows} />
    </div>
  );
};

export default CustomersAndProspectsPage;
