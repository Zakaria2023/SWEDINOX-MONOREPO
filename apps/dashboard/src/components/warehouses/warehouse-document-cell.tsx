import Link from "next/link";
import { SelectWarehouses } from "@/db";

type Props = {
  warehouse: SelectWarehouses;
};

export const WarehouseDocumentCell = ({ warehouse }: Props) => {
  const docs = warehouse.documents;

  if (!docs || docs.length === 0) {
    return <span className="text-muted-foreground">—</span>;
  }

  return (
    <div className="space-y-1">
      {docs.map((doc) => (
        <div key={doc.id}>
          <Link
            href={`/api/documents/${doc.id}/download?fileName=${encodeURIComponent(doc.fileName)}`}
            className="text-sm underline hover:no-underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            {doc.fileName}
          </Link>
        </div>
      ))}
    </div>
  );
};
