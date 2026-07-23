import {
  getFreightFlow,
  getSfnCounterparties,
} from "@/app/(dashboard)/freight-flow/actions";
import { FreightFlowFilter } from "@/components/freight-flow/freight-flow-filter";
import { FreightFlowTable } from "@/components/freight-flow/freight-flow-table-content";
import { SfnCounterpartiesPanel } from "@/components/freight-flow/sfn-counterparties-panel";
import { PageHeading } from "@/components/layout/page-heading";

type Props = {
  searchParams: Promise<{
    yearFrom?: string;
    yearTo?: string;
    monthFrom?: string;
    monthTo?: string;
  }>;
};

const toNumber = (value: string | undefined) =>
  value ? Number(value) : undefined;

const FreightFlowPage = async ({ searchParams }: Props) => {
  const { yearFrom, yearTo, monthFrom, monthTo } = await searchParams;

  const [rows, counterparties] = await Promise.all([
    getFreightFlow({
      yearFrom: toNumber(yearFrom),
      yearTo: toNumber(yearTo),
      monthFrom: toNumber(monthFrom),
      monthTo: toNumber(monthTo),
    }),
    getSfnCounterparties(),
  ]);

  return (
    <div className="space-y-6 p-6">
      <PageHeading
        title="Freight flow (SFN)"
        description="The monthly goods flow per revenue group behind the steel federation return, in kilograms"
      />
      <FreightFlowFilter
        yearFrom={yearFrom}
        yearTo={yearTo}
        monthFrom={monthFrom}
        monthTo={monthTo}
      />
      <SfnCounterpartiesPanel counterparties={counterparties} />
      <FreightFlowTable rows={rows} />
    </div>
  );
};

export default FreightFlowPage;
