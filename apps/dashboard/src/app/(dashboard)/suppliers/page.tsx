import { getSuppliers } from "@/app/(dashboard)/suppliers/actions";
import { SuppliersTable } from "@/components/suppliers/suppliers-table-content";

const SuppliersPage = async () => {
  const rows = await getSuppliers();

  return (
    <div className="space-y-4">
      <SuppliersTable rows={rows} />
    </div>
  );
};

export default SuppliersPage;
