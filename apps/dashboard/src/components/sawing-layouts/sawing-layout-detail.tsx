import { SawingLayoutDetail } from "@/app/(dashboard)/sawing-layouts/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { DetailField } from "@/components/ui/detail-field";
import {
  formatBoolean,
  formatDateColumn,
  formatDateValue,
  formatNumber,
  orDash,
} from "@/lib/helpers";
import {
  SAWING_LAYOUT_FETCH_STATUS_LABELS,
  SAWING_STATUS_LABELS,
} from "@/lib/labels";

type Props = {
  layout: SawingLayoutDetail;
};

export const SawingLayoutDetailView = ({ layout }: Props) => (
  <div className="space-y-6">
    <section className="space-y-4">
      <h2 className="border-b pb-2 text-base font-semibold">Fetch</h2>
      <p className="text-sm text-muted-foreground">
        Retrieving the raw length from stock and bringing it to the saw.
      </p>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <DetailField label="Machine" value={layout.machine} />
        <DetailField
          label="Fetch date"
          value={formatDateColumn(layout.fetchDate)}
        />
        <DetailField label="Fetch code" value={layout.fetchCode} />
        <DetailField
          label="Fetch status"
          value={
            layout.fetchStatus
              ? SAWING_LAYOUT_FETCH_STATUS_LABELS[layout.fetchStatus]
              : null
          }
        />
        <DetailField label="Fetch quantity" value={layout.fetchQty} />
        <DetailField label="Warehouse" value={layout.warehouse} />
        <DetailField label="Section" value={layout.section} />
        <DetailField label="Location" value={layout.location} />
        <DetailField label="Raw product" value={layout.product} />
        <DetailField label="Description" value={layout.description} />
        <DetailField label="Length" value={layout.length} />
        <DetailField
          label="Residual length"
          value={layout.residualLength}
        />
      </div>
    </section>

    <section className="space-y-4">
      <h2 className="border-b pb-2 text-base font-semibold">Sawing</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <DetailField
          label="Sawing date"
          value={formatDateColumn(layout.sawingDate)}
        />
        <DetailField label="Sawing code" value={layout.sawingCode} />
        <DetailField
          label="Sawing status"
          value={
            layout.sawingStatus
              ? SAWING_STATUS_LABELS[layout.sawingStatus]
              : null
          }
        />
        <DetailField label="Sawn product" value={layout.sawingProduct} />
        <DetailField
          label="Sawn product description"
          value={layout.sawingProductDescription}
        />
        <DetailField
          label="Total pieces to be sawn"
          value={layout.totalPiecesToBeSawn}
        />
        <DetailField label="Sawing of TL" value={layout.sawingOfTl} />
        <DetailField
          label="Sawing according to layout"
          value={formatBoolean(layout.sawingAccordingToLayout)}
        />
        <DetailField
          label="Layout includes cutoff"
          value={formatBoolean(layout.layoutIncludesCutoff)}
        />
        <DetailField
          label="Follow-up processing"
          value={layout.followUpProcessing}
        />
        <DetailField label="To locations" value={layout.toLocations} />
        <DetailField
          label="Created"
          value={formatDateValue(layout.createdAt)}
        />
        <DetailField
          label="Last modified"
          value={formatDateValue(layout.updatedAt)}
        />
      </div>
    </section>

    <section className="space-y-3">
      <h2 className="border-b pb-2 text-base font-semibold">Pieces cut</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <DetailField
          label="Total pieces in the layout"
          value={formatNumber(layout.totalPieces)}
        />
        <DetailField
          label="Total length cut"
          value={formatNumber(layout.totalCutLength)}
        />
        <DetailField
          label="Residual length"
          value={layout.residualLength}
        />
      </div>
      <div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">Slot</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
              <TableHead className="text-right">Length</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {layout.cuts.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="h-24 text-center text-muted-foreground"
                >
                  No piece slots are filled on this layout.
                </TableCell>
              </TableRow>
            ) : (
              layout.cuts.map((cut) => (
                <TableRow key={cut.slot}>
                  <TableCell className="text-right tabular-nums">
                    {cut.slot}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {orDash(cut.qty)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {orDash(cut.length)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </section>
  </div>
);
