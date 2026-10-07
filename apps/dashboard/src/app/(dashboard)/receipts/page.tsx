import { getReceipts } from "@/app/(dashboard)/receipts/actions";
import { ReceiptsTable } from "@/components/receipts/receipts-table-content";
import { parseTableQuery, SearchParams, TableFilterControl } from "@/lib/table-query";

type Props = {
  searchParams: Promise<SearchParams>;
};

// The reference filters on `Date reported as completed`; the kind of receipt
// is how the two populations are told apart.
const RECEIPT_FILTERS: TableFilterControl[] = [
  { key: "completedOn", kind: "dateRange", label: "Date reported as completed" },
  {
    key: "orderType",
    kind: "select",
    label: "Order type",
    placeholder: "Purchases and returns",
    options: [
      { value: "purchase", label: "Purchase order" },
      { value: "return", label: "Return" },
    ],
  },
];

const ReceiptsPage = async ({ searchParams }: Props) => {
  const query = parseTableQuery(await searchParams);
  const page = await getReceipts(query);

  return (
    <div className="space-y-4">
      <ReceiptsTable page={page} filters={RECEIPT_FILTERS} />
    </div>
  );
};

export default ReceiptsPage;
