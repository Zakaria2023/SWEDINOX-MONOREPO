import Link from "next/link";
import { MachineDetail } from "@/app/(dashboard)/machines/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { DetailField } from "@/components/ui/detail-field";
import { DocumentCell } from "@/components/ui/document-cell";
import {
  formatDateColumn,
  formatDateValue,
  formatNumber,
  orDash,
  yesNo,
} from "@/lib/helpers";
import {
  MACHINE_CAPACITY_UNIT_LABELS,
  MACHINE_LOADING_LABELS,
  MACHINE_OPTION_LABELS,
  MACHINE_PRODUCTION_LABELS,
  WAREHOUSE_TYPE_LABELS,
} from "@/lib/labels";

type Props = {
  machine: MachineDetail;
};

export const MachineDetailView = ({ machine }: Props) => (
  <div className="space-y-6">
    <section className="space-y-4">
      <h2 className="border-b pb-2 text-base font-semibold">Machine</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <DetailField label="Code" value={machine.code} />
        <DetailField label="Name" value={machine.name} />
        <DetailField
          label="Option"
          value={MACHINE_OPTION_LABELS[machine.option]}
        />
        <DetailField
          label="Production"
          value={MACHINE_PRODUCTION_LABELS[machine.production]}
        />
        <DetailField
          label="Loading"
          value={machine.loading ? MACHINE_LOADING_LABELS[machine.loading] : null}
        />
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Stock location
          </p>
          {machine.stockLocationName ? (
            <Link
              href={`/warehouses/${machine.stockLocationUuid}`}
              className="text-sm text-primary hover:underline"
            >
              {machine.stockLocationName}
            </Link>
          ) : (
            <p className="text-sm">—</p>
          )}
        </div>
        <DetailField
          label="Location type"
          value={
            machine.stockLocationType
              ? WAREHOUSE_TYPE_LABELS[machine.stockLocationType]
              : null
          }
        />
        <DetailField label="Created" value={formatDateValue(machine.createdAt)} />
        <DetailField
          label="Last modified"
          value={formatDateValue(machine.updatedAt)}
        />
      </div>
    </section>

    <section className="space-y-4">
      <h2 className="border-b pb-2 text-base font-semibold">
        Capacity and limits
      </h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <DetailField
          label="Minimum length"
          value={
            machine.minLengthMm === null
              ? null
              : `${formatNumber(machine.minLengthMm)} mm`
          }
        />
        <DetailField
          label="Maximum length"
          value={
            machine.maxLengthMm === null
              ? null
              : `${formatNumber(machine.maxLengthMm)} mm`
          }
        />
        <DetailField
          label="Average daily capacity"
          value={
            machine.averageDailyCapacity === null
              ? null
              : `${formatNumber(machine.averageDailyCapacity)} ${
                  machine.averageDailyCapacityUnit
                    ? MACHINE_CAPACITY_UNIT_LABELS[
                        machine.averageDailyCapacityUnit
                      ]
                    : ""
                }`.trim()
          }
        />
        <DetailField
          label="Warning percentage"
          value={
            machine.warningPercentage === null
              ? null
              : `${machine.warningPercentage}%`
          }
        />
      </div>
    </section>

    <section className="space-y-4">
      <h2 className="border-b pb-2 text-base font-semibold">Availability</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <DetailField
          label="Out of business"
          value={yesNo(machine.outOfBusiness)}
        />
        <DetailField
          label="Out of business from"
          value={formatDateColumn(machine.outOfBusinessFrom)}
        />
        <DetailField
          label="Out of business until"
          value={formatDateColumn(machine.outOfBusinessUntil)}
        />
      </div>
      <DetailField label="Remarks" value={machine.remarks} />
      <div>
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Documents
        </p>
        <DocumentCell documents={machine.documents} />
      </div>
    </section>

    <section className="space-y-3">
      <h2 className="border-b pb-2 text-base font-semibold">
        Products this machine runs
      </h2>
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">Pref.</TableHead>
              <TableHead>Product code</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Product group</TableHead>
              <TableHead className="text-right">Per hour</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead className="text-right">Min corner</TableHead>
              <TableHead className="text-right">Max corner</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {machine.products.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="h-24 text-center text-muted-foreground"
                >
                  No products are set up on this machine.
                </TableCell>
              </TableRow>
            ) : (
              machine.products.map((row) => (
                <TableRow key={row.uuid}>
                  <TableCell className="text-right tabular-nums">
                    {orDash(row.preference)}
                  </TableCell>
                  <TableCell className="font-medium">
                    {row.productUuid ? (
                      <Link
                        href={`/products/${row.productUuid}`}
                        className="text-primary hover:underline"
                      >
                        {row.productCode ?? row.catalogProductCode ?? "—"}
                      </Link>
                    ) : (
                      orDash(row.productCode)
                    )}
                  </TableCell>
                  <TableCell>
                    {orDash(row.description ?? row.catalogProductName)}
                  </TableCell>
                  <TableCell>
                    {row.productGroupUuid && row.productGroupName ? (
                      <Link
                        href={`/product-groups/${row.productGroupUuid}`}
                        className="text-primary hover:underline"
                      >
                        {row.productGroupName}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {orDash(row.productionPerHour)}
                  </TableCell>
                  <TableCell>{orDash(row.prodUnit)}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {orDash(row.minCorner)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {orDash(row.maxCorner)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </section>

    <section className="space-y-3">
      <h2 className="border-b pb-2 text-base font-semibold">
        Post processings
      </h2>
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">Pref.</TableHead>
              <TableHead>Option</TableHead>
              <TableHead className="text-right">Days in system</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {machine.postProcessings.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="h-24 text-center text-muted-foreground"
                >
                  No post processings follow this machine.
                </TableCell>
              </TableRow>
            ) : (
              machine.postProcessings.map((row) => (
                <TableRow key={row.uuid}>
                  <TableCell className="text-right tabular-nums">
                    {orDash(row.preference)}
                  </TableCell>
                  <TableCell>
                    {row.option ? MACHINE_OPTION_LABELS[row.option] : "—"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {orDash(row.daysInSystem)}
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
