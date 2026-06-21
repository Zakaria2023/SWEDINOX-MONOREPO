import Link from "next/link";
import { SelectWarehouses } from "@/db";

type Props = {
  warehouse: SelectWarehouses;
};

export const WarehouseDocumentCell = ({ warehouse }: Props) => {
  if (warehouse.documentId && warehouse.documentFileName) {
    return (
      <Link
        href={`/api/documents/${warehouse.documentId}/download?fileName=${encodeURIComponent(warehouse.documentFileName)}`}
        className="text-sm underline hover:no-underline"
        target="_blank"
        rel="noopener noreferrer"
      >
        {warehouse.documentFileName}
      </Link>
    );
  }

  return <span className="text-muted-foreground">—</span>;
};
