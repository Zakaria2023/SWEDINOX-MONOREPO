import { getCustomersAndProspects } from "@/app/(dashboard)/customers-and-prospects/actions";
import { CustomersAndProspectsTable } from "@/components/customers-and-prospects/customers-and-prospects-table-content";

const CustomersAndProspectsPage = async () => {
  const rows = await getCustomersAndProspects();

  return (
    <div className="space-y-4">
      <CustomersAndProspectsTable rows={rows} />
    </div>
  );
};

export default CustomersAndProspectsPage;
