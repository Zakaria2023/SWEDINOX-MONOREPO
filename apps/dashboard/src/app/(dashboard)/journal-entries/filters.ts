import { CompanyOption } from "@/app/(dashboard)/companies/actions";
import { LedgerAccountRow } from "@/app/(dashboard)/trial-balance/actions";
import { companyOptionLabel } from "@/lib/helpers";
import { TableFilterControl } from "@/lib/table-query";

// The journals postings are written through, from the ledger module that writes
// them. Not an enum on the column, so the four names are listed here rather
// than derived — if a fifth journal is ever posted to, it belongs in both places
// and this list is where the screen would notice.
const JOURNALS = [
  { value: "sales", label: "Sales" },
  { value: "purchase", label: "Purchase" },
  { value: "stock", label: "Stock" },
  { value: "bank", label: "Bank" },
];

export const journalEntryFilters = (
  accounts: LedgerAccountRow[],
  companies: CompanyOption[],
): TableFilterControl[] => [
  {
    key: "account",
    kind: "select",
    label: "Account",
    placeholder: "All accounts",
    options: accounts.map((account) => ({
      value: account.number,
      label: `${account.number} ${account.name}`,
    })),
  },
  { key: "journal", kind: "select", label: "Journal", options: JOURNALS },
  {
    key: "company",
    kind: "select",
    label: "Counterparty",
    placeholder: "All counterparties",
    options: companies.map((company) => ({
      value: company.uuid,
      label: companyOptionLabel(company),
    })),
  },
  { key: "bookingDate", kind: "dateRange", label: "Booking date" },
  { key: "amount", kind: "numberRange", label: "Amount" },
];
