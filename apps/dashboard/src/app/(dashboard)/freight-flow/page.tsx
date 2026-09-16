import {
  getFreightFlow,
  getSfnCounterparties,
} from "@/app/(dashboard)/freight-flow/actions";
import { FreightFlowTable } from "@/components/freight-flow/freight-flow-table-content";
import { SfnCounterpartiesPanel } from "@/components/freight-flow/sfn-counterparties-panel";

const FreightFlowPage = async () => {
  const [rows, counterparties] = await Promise.all([
    getFreightFlow(),
    getSfnCounterparties(),
  ]);

  return (
    <div className="space-y-4">
      <SfnCounterpartiesPanel counterparties={counterparties} />
      <FreightFlowTable rows={rows} />
    </div>
  );
};

export default FreightFlowPage;
