import { getSuppliers } from "@/app/(dashboard)/suppliers/actions";
import { SuppliersTable } from "@/components/suppliers/suppliers-table-content";
import { PageHeading } from "@/components/layout/page-heading";

const SuppliersPage = async () => {
  const rows = await getSuppliers();

  return (
    <div className="space-y-6 p-6">
      <PageHeading title="Suppliers" />
      <SuppliersTable rows={rows} />
    </div>
  );
};

export default SuppliersPage;
