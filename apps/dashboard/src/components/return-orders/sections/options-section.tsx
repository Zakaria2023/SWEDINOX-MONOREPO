import { ReturnOrderDetail } from "@/app/(dashboard)/return-orders/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { orDash, pluralize } from "@/lib/helpers";

type Props = {
  items: ReturnOrderDetail["items"];
};

/** The options carried by a saved return's lines, read-only. */
export const OptionsSection = ({ items }: Props) => {
  const linesWithOptions = items.filter((item) => item.options);

  return (
    <CollapsibleSection
      title="Options"
      summary={`${linesWithOptions.length} ${pluralize(linesWithOptions.length, "line")} with options`}
    >
      <div className="p-3">
        {linesWithOptions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No options on the lines of this return order.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">Code</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Options</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {linesWithOptions.map((item, index) => (
                  <TableRow key={item.uuid}>
                    <TableCell className="text-right tabular-nums">
                      {(item.lineNumber ?? index + 1) * 10}
                    </TableCell>
                    <TableCell>{orDash(item.productCode)}</TableCell>
                    <TableCell>{orDash(item.options)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </CollapsibleSection>
  );
};
