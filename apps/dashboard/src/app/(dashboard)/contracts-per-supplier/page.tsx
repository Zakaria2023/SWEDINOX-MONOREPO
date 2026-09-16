import { getContractsPerSupplier } from "@/app/(dashboard)/contracts/actions";
import { ContractsPerSupplierTable } from "@/components/contracts-per-supplier/contracts-per-supplier-table-content";

const ContractsPerSupplierPage = async () => {
  const rows = await getContractsPerSupplier();

  return (
    <div className="space-y-4">
      <ContractsPerSupplierTable rows={rows} />
    </div>
  );
};

export default ContractsPerSupplierPage;
