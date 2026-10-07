"use client";

import {
  CustomerRevenueRow,
  exportCustomerRevenue,
} from "@/app/(dashboard)/customer-revenue/actions";
import { CUSTOMER_REVENUE_COLUMNS } from "@/app/(dashboard)/customer-revenue/columns";
import { OverviewTable } from "@/components/ui/overview-table";
import { Paged, TableFilterControl } from "@/lib/table-query";

type Props = {
  page: Paged<CustomerRevenueRow>;
  filters: TableFilterControl[];
};

export const CustomerRevenueTable = ({ page, filters }: Props) => (
  <OverviewTable
    page={page}
    filters={filters}
    columns={CUSTOMER_REVENUE_COLUMNS}
    rowKey={(row) => row.companyUuid}
    exportAction={exportCustomerRevenue}
    fileName="customer-revenue"
    searchPlaceholder="Search customer name or code…"
    emptyText="No customers."
    singular="customer"
    plural="customers"
  />
);
