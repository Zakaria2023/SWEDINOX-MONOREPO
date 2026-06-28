import Link from "next/link";

type Props = {
  documents?: Array<{ id: string; fileName: string }> | null;
};

export const DocumentCell = ({ documents }: Props) => {
  if (!documents || documents.length === 0) {
    return <span className="text-muted-foreground">—</span>;
  }

  return (
    <div className="space-y-1">
      {documents.map((doc) => (
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
