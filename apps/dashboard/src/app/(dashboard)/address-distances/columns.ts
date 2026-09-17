import { AddressDistanceListItem } from "@/app/(dashboard)/address-distances/actions";
import { ExportColumn, numberCell, textCell } from "@/lib/excel";

/**
 * Address distances as a sheet — the reference's five columns, in its order.
 *
 * `Km` is the distance from our own depot to this address, not between two
 * addresses: in the reference every row reading `0` is Bolderweg 10 in Almere,
 * spelled thirteen different ways.
 */

export type AddressDistanceColumnKey =
  | "country"
  | "city"
  | "street"
  | "postalCode"
  | "km";

export const ADDRESS_DISTANCE_COLUMNS: Array<
  ExportColumn<AddressDistanceListItem, AddressDistanceColumnKey>
> = [
  {
    key: "country",
    label: "Country",
    defaultVisible: true,
    value: (row) => textCell(row.country),
  },
  {
    key: "city",
    label: "City",
    defaultVisible: true,
    value: (row) => textCell(row.city),
  },
  {
    key: "street",
    label: "Street",
    defaultVisible: true,
    value: (row) => textCell(row.street),
  },
  {
    key: "postalCode",
    label: "Postal code",
    defaultVisible: true,
    value: (row) => textCell(row.postalCode),
  },
  {
    key: "km",
    label: "Km",
    defaultVisible: true,
    value: (row) => numberCell(row.km),
  },
];
