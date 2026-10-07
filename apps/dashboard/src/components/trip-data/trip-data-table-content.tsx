"use client";

import {
  exportTripData,
  TripDataRow,
} from "@/app/(dashboard)/trip-data/actions";
import { TRIP_DATA_COLUMNS } from "@/app/(dashboard)/trip-data/columns";
import { OverviewTable } from "@/components/ui/overview-table";
import { Paged, TableFilterControl } from "@/lib/table-query";

type Props = {
  page: Paged<TripDataRow>;
  filters: TableFilterControl[];
};

export const TripDataTable = ({ page, filters }: Props) => (
  <OverviewTable
    page={page}
    filters={filters}
    columns={TRIP_DATA_COLUMNS}
    rowKey={(row) => row.uuid}
    exportAction={exportTripData}
    fileName="trip-data"
    searchPlaceholder="Search trip or vehicle…"
    emptyText="No trips found."
    singular="trip"
    plural="trips"
  />
);
