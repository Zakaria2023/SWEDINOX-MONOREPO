import { getSuppliers } from "@/app/(dashboard)/suppliers/actions";
import { SuppliersTable } from "@/components/suppliers/suppliers-table-content";
import { parseTableQuery, SearchParams } from "@/lib/table-query";

type Props = {
  searchParams: Promise<SearchParams>;
};

const SuppliersPage = async ({ searchParams }: Props) => {
  const query = parseTableQuery(await searchParams);
  const page = await getSuppliers(query);

  return (
    <div className="space-y-4">
      <SuppliersTable page={page} />
    </div>
  );
};

export default SuppliersPage;
