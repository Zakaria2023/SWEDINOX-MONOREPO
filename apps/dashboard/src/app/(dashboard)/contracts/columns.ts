import { ContractListItem } from "@/app/(dashboard)/contracts/actions";
import {
  dateCell,
  ExportColumn,
  numberCell,
  textCell,
  yesNoCell,
} from "@/lib/excel";
import { CONTRACT_TYPE_LABELS } from "@/lib/labels";

/** The contracts overview as a sheet — see app/(dashboard)/orders/columns.ts. */

export type ContractColumnKey =
  | "id"
  | "contractType"
  | "contractGroupName"
  | "description"
  | "searchCode1"
  | "searchCode2"
  | "searchCode3"
  | "websiteSorting"
  | "hideOnWebsite"
  | "createdAt";

export const CONTRACT_COLUMNS: Array<
  ExportColumn<ContractListItem, ContractColumnKey>
> = [
  {
    key: "id",
    label: "Code",
    defaultVisible: true,
    // The column is keyed "id" but shows the contract's code, as on screen.
    value: (row) => textCell(row.code),
  },
  {
    key: "contractType",
    label: "Contract Type",
    defaultVisible: true,
    value: (row) =>
      row.contractType ? CONTRACT_TYPE_LABELS[row.contractType] : null,
  },
  {
    key: "contractGroupName",
    label: "Contract Group",
    defaultVisible: true,
    value: (row) => textCell(row.contractGroupName),
  },
  {
    key: "description",
    label: "Description",
    defaultVisible: true,
    value: (row) => textCell(row.description),
  },
  {
    key: "searchCode1",
    label: "Search Code 1",
    defaultVisible: false,
    value: (row) => textCell(row.searchCode1),
  },
  {
    key: "searchCode2",
    label: "Search Code 2",
    defaultVisible: false,
    value: (row) => textCell(row.searchCode2),
  },
  {
    key: "searchCode3",
    label: "Search Code 3",
    defaultVisible: false,
    value: (row) => textCell(row.searchCode3),
  },
  {
    key: "websiteSorting",
    label: "Website Sort",
    defaultVisible: false,
    value: (row) => numberCell(row.websiteSorting),
  },
  {
    key: "hideOnWebsite",
    label: "Hide on Website",
    defaultVisible: false,
    value: (row) => yesNoCell(row.hideOnWebsite),
  },
  {
    key: "createdAt",
    label: "Created At",
    defaultVisible: false,
    value: (row) => dateCell(row.createdAt),
  },
];
