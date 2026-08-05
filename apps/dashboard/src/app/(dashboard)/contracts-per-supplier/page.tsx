import { getContractsPerSupplier } from "@/app/(dashboard)/contracts/actions";
import { ContractsPerSupplierTable } from "@/components/contracts-per-supplier/contracts-per-supplier-table-content";
import { PageHeading } from "@/components/layout/page-heading";

const ContractsPerSupplierPage = async () => {
  const rows = await getContractsPerSupplier();

  return (
    <div className="space-y-4">
      <PageHeading title="Contracts per Supplier" />
      <ContractsPerSupplierTable rows={rows} />
    </div>
  );
};

export default ContractsPerSupplierPage;
