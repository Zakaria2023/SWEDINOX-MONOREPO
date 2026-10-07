import Link from "next/link";
import { Button } from "@/components/shadcn/button";

type RelatedRecord = {
  label: string;
  /** Null greys the button: there is nothing of that kind to open. */
  href: string | null;
};

type Props = {
  records: RelatedRecord[];
};

/**
 * The reference's "related records" buttons — `Show company`, `Show purchase
 * order`, `Show complaint` — which sit on almost every document toolbar and
 * grey out when there is nothing to open. One consistent bar rather than a
 * link scattered into whichever field happens to name the record.
 */
export const RelatedRecordsBar = ({ records }: Props) => (
  <div className="flex flex-wrap gap-2">
    {records.map((record) =>
      record.href ? (
        <Button
          key={record.label}
          variant="outline"
          size="sm"
          render={<Link href={record.href} />}
        >
          {record.label}
        </Button>
      ) : (
        <Button key={record.label} variant="outline" size="sm" disabled>
          {record.label}
        </Button>
      ),
    )}
  </div>
);
