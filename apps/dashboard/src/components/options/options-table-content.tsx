"use client";

import {
  exportOptionLines,
  OptionLineRow,
} from "@/app/(dashboard)/options/actions";
import {
  OPTION_LINE_COLUMNS,
  OptionLineColumnKey,
} from "@/app/(dashboard)/options/columns";
import { GenerateOptionChargesButton } from "@/components/options/generate-option-charges-button";
import { OverviewTable } from "@/components/ui/overview-table";
import { Paged, TableFilterControl } from "@/lib/table-query";

type Props = {
  page: Paged<OptionLineRow>;
  filters: TableFilterControl[];
};

const SORTABLE: Partial<Record<OptionLineColumnKey, string>> = {
  order: "order",
  createdAt: "createdAt",
  optionCode: "optionCode",
  customer: "customer",
  revenue: "amount",
  deliveryDate: "deliveryDate",
};

export const OptionsTable = ({ page, filters }: Props) => (
  <OverviewTable
    page={page}
    filters={filters}
    columns={OPTION_LINE_COLUMNS}
    sortable={SORTABLE}
    rowKey={(row) => row.uuid}
    exportAction={exportOptionLines}
    fileName="options"
    searchPlaceholder="Search product, customer, option or reference…"
    emptyText="No options charged."
    singular="option"
    plural="options"
    toolbar={<GenerateOptionChargesButton />}
  />
);
