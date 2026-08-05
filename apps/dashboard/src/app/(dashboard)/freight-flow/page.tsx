import {
  getFreightFlow,
  getSfnCounterparties,
} from "@/app/(dashboard)/freight-flow/actions";
import { FreightFlowTable } from "@/components/freight-flow/freight-flow-table-content";
import { SfnCounterpartiesPanel } from "@/components/freight-flow/sfn-counterparties-panel";
import { PageHeading } from "@/components/layout/page-heading";

const FreightFlowPage = async () => {
  const [rows, counterparties] = await Promise.all([
    getFreightFlow(),
    getSfnCounterparties(),
  ]);

  return (
    <div className="space-y-6 p-6">
      <PageHeading title="Freight flow (SFN)" />
      <SfnCounterpartiesPanel counterparties={counterparties} />
      <FreightFlowTable rows={rows} />
    </div>
  );
};

export default FreightFlowPage;
